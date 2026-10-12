# ImageLab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete production-ready, client-only ImageLab compressor described in `CODEX.md`, including all public routes, batch workflows, target compression, downloads, SEO, accessibility, tests, and deployment documentation.

**Architecture:** Next.js server components render static public content and metadata; small client boundaries own file intake and the workspace. A framework-independent compression layer accepts injected browser codec adapters, uses bounded candidate search and progressive resizing, and feeds a two-item concurrency queue backed by an in-memory external store.

**Tech Stack:** Next.js 16.4, React 19.3, strict TypeScript, Tailwind CSS 4, Lucide React, Canvas/OffscreenCanvas, Web Workers, JSZip, Vitest, Testing Library, Playwright.

## Global Constraints

- Support JPG, PNG, and WebP; validate magic bytes and successful decode.
- Process image bytes only in the browser; never persist, upload, log, or encode them into URLs.
- Limit intake to 40 files, 30 MB per file, 250 MB per batch, and 40 megapixels per decoded image.
- Preserve transparency unless the user explicitly opts into a compatible format conversion.
- Treat a target as a maximum, never claim exact equality, never report an oversized candidate as success, and never present a larger result as an improvement.
- Bound quality attempts, dimension attempts, elapsed processing, batch concurrency, and cancellation checks.
- Recompress only from immutable originals and revoke every owned object URL.
- Keep `/compress` out of the sitemap and mark it `noindex, nofollow`.
- Use `NEXT_PUBLIC_SITE_URL` for production canonicals and never derive canonicals from Vercel preview URLs.
- No authentication, database, API route, external image service, analytics, advertisements, or required secret.
- Follow the Next.js 16.4 documentation bundled under `node_modules/next/dist/docs/`.

---

## File map

- `app/layout.tsx`, `app/globals.css`, `next.config.ts`: global shell, visual tokens, fonts, and security headers.
- `app/page.tsx`, `app/about/page.tsx`, `app/privacy/page.tsx`: static public pages.
- `app/compress/page.tsx`, `app/compress/layout.tsx`: noindex workspace route.
- `app/compress-image-to-[target]/page.tsx`: statically generated preset pages backed by one definition table.
- `app/robots.ts`, `app/sitemap.ts`: crawler directives and public URLs.
- `components/site-header.tsx`, `components/site-footer.tsx`, `components/upload-dropzone.tsx`, `components/preset-links.tsx`: shared public UI.
- `components/compressor/*`: workspace, file queue, settings, preview, result actions, notices, and toasts.
- `stores/compression-store.ts`: in-memory session state and cleanup ownership.
- `lib/files/*`: signatures, limits, decode validation, naming, sizes, and downloads.
- `lib/compression/*`: contracts, search, browser codec, runner, scheduler, and ZIP creation.
- `workers/compression.worker.ts`: worker message boundary and OffscreenCanvas execution.
- `lib/seo/*`: origin, presets, metadata, and JSON-LD.
- `tests/unit/*`, `tests/e2e/*`, `tests/fixtures/*`: deterministic logic and browser flows.

### Task 1: Establish the tested project foundation

**Files:**
- Modify: `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`
- Create: `vitest.config.ts`, `playwright.config.ts`, `tests/setup.ts`, `.env.example`

**Interfaces:**
- Produces scripts `typecheck`, `test`, `test:run`, `test:e2e`, and `verify`.
- Produces path-resolved Vitest and Playwright environments used by every later task.

- [ ] **Step 1: Add a failing foundation smoke test**

```ts
// tests/unit/foundation.test.ts
import { describe, expect, it } from "vitest";
describe("test foundation", () => {
  it("resolves the application alias", async () => {
    const module = await import("@/lib/constants");
    expect(module.APP_NAME).toBe("ImageLab");
  });
});
```

- [ ] **Step 2: Install only required dependencies and configure scripts**

Run: `npm install lucide-react jszip && npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test`

Add `lib/constants.ts` exporting `APP_NAME`, resource limits, and batch concurrency. Configure Vitest for jsdom and Playwright for Chromium against `npm run dev`. Add `NEXT_PUBLIC_SITE_URL=https://your-project.vercel.app` to `.env.example`.

- [ ] **Step 3: Verify the foundation**

Run: `npm run test:run -- tests/unit/foundation.test.ts && npm run typecheck`

Expected: one passing test and zero TypeScript errors.

- [ ] **Step 4: Commit**

```powershell
git add package.json package-lock.json next.config.ts tsconfig.json eslint.config.mjs vitest.config.ts playwright.config.ts tests/setup.ts tests/unit/foundation.test.ts .env.example lib/constants.ts
git commit -m "chore: configure ImageLab quality tooling"
```

### Task 2: Implement file validation and resource safety

**Files:**
- Create: `lib/files/types.ts`, `lib/files/signatures.ts`, `lib/files/validate.ts`, `lib/files/format.ts`, `lib/files/names.ts`
- Test: `tests/unit/files.test.ts`

**Interfaces:**
- Produces `validateFile(file: File, currentBatchBytes?: number): Promise<ValidationResult>`.
- Produces `detectImageType(bytes: Uint8Array): SupportedMime | null`, `formatBytes(bytes: number): string`, and `compressedName(name: string, mime: SupportedMime, taken?: Set<string>): string`.

- [ ] **Step 1: Write failing signature, limit, corruption, and collision tests**

```ts
expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff]))).toBe("image/jpeg");
expect(detectImageType(pngHeader)).toBe("image/png");
expect(await validateFile(spoofedFile)).toMatchObject({ ok: false, code: "invalid-signature" });
expect(compressedName("photo.jpg", "image/jpeg", new Set(["photo-compressed.jpg"]))).toBe("photo-compressed-2.jpg");
```

- [ ] **Step 2: Run tests and confirm they fail for missing modules**

Run: `npm run test:run -- tests/unit/files.test.ts`

- [ ] **Step 3: Implement typed validation and formatting**

Use exact JPEG, PNG, and RIFF/WEBP signatures, reject MIME/signature mismatches, decode dimensions through an injectable `decodeDimensions` function, and return codes `unsupported-type`, `invalid-signature`, `file-too-large`, `batch-too-large`, `decode-failed`, or `dimensions-too-large`.

- [ ] **Step 4: Run tests and commit**

Run: `npm run test:run -- tests/unit/files.test.ts`

```powershell
git add lib/files tests/unit/files.test.ts
git commit -m "feat: validate image files safely"
```

### Task 3: Build the bounded compression search engine

**Files:**
- Create: `lib/compression/types.ts`, `lib/compression/search.ts`, `lib/compression/auto.ts`, `lib/compression/target.ts`
- Test: `tests/unit/compression-search.test.ts`

**Interfaces:**
- Defines `CompressionSettings`, `EncodeRequest`, `EncodeCandidate`, `CompressionSuccess`, and `CompressionLimitation`.
- Produces `compressAutomatic(source, encoder, signal)` and `compressToTarget(source, settings, encoder, signal)`.

- [ ] **Step 1: Write failing deterministic engine tests**

```ts
const result = await compressToTarget(source, { mode: "target", targetBytes: 100_000, output: "preserve" }, fakeEncoder, signal);
expect(result.status).toBe("success");
if (result.status === "success") expect(result.blob.size).toBeLessThanOrEqual(100_000);
expect(fakeEncoder.calls).toBeLessThanOrEqual(48);
```

Cover small/large JPEG, transparent PNG, WebP, already optimized input, tiny target, unreachable target, non-monotonic encoder sizes, cancellation, preserved aspect ratio, and no enlargement.

- [ ] **Step 2: Run tests and observe missing implementation failures**

Run: `npm run test:run -- tests/unit/compression-search.test.ts`

- [ ] **Step 3: Implement bounded candidate selection**

Sample quality values before bounded refinement, keep every candidate at or below target, prefer larger dimensions then higher quality within the valid set, reduce dimensions by a bounded scale schedule, apply a 2% safety margin, and return `unreachable-target`, `already-optimized`, or `cancelled` limitation states honestly.

- [ ] **Step 4: Verify focused tests and commit**

Run: `npm run test:run -- tests/unit/compression-search.test.ts`

```powershell
git add lib/compression tests/unit/compression-search.test.ts
git commit -m "feat: add bounded image compression engine"
```

### Task 4: Add browser codecs, worker fallback, batching, and ZIPs

**Files:**
- Create: `lib/compression/browser-codec.ts`, `lib/compression/runner.ts`, `lib/compression/scheduler.ts`, `lib/compression/zip.ts`, `workers/compression.worker.ts`
- Test: `tests/unit/scheduler.test.ts`, `tests/unit/zip.test.ts`, `tests/unit/runner.test.ts`

**Interfaces:**
- Produces `createCompressionRunner(): CompressionRunner`, `runWithConcurrency(jobs, worker, { limit: 2, signal })`, and `createResultsZip(results): Promise<Blob>`.
- Worker messages contain transferable image bytes and settings; responses contain typed result metadata and transferable blobs/array buffers.

- [ ] **Step 1: Write failing concurrency, cancellation, fallback, and ZIP tests**

```ts
expect(maxObservedConcurrency).toBe(2);
expect(results.map((item) => item.status)).toContain("cancelled");
expect(zip.file("photo-compressed-2.jpg")).toBeDefined();
expect(await runner.compress(input)).toEqual(mainThreadFallbackResult);
```

- [ ] **Step 2: Run focused tests**

Run: `npm run test:run -- tests/unit/scheduler.test.ts tests/unit/zip.test.ts tests/unit/runner.test.ts`

- [ ] **Step 3: Implement Canvas and OffscreenCanvas adapters**

Decode with `createImageBitmap` where supported, draw with preserved aspect ratio, use PNG without a fake quality assumption, map explicit WebP/JPEG output choices, close bitmaps, release canvas dimensions after use, and fall back once when worker/OffscreenCanvas support fails.

- [ ] **Step 4: Implement the queue and ZIP generator, then commit**

Run: `npm run test:run -- tests/unit/scheduler.test.ts tests/unit/zip.test.ts tests/unit/runner.test.ts`

```powershell
git add lib/compression workers tests/unit/scheduler.test.ts tests/unit/zip.test.ts tests/unit/runner.test.ts
git commit -m "feat: process image batches and create ZIP downloads"
```

### Task 5: Implement the in-memory session store and cleanup

**Files:**
- Create: `stores/compression-store.ts`, `hooks/use-compression-store.ts`
- Test: `tests/unit/compression-store.test.ts`

**Interfaces:**
- Produces `compressionStore.getSnapshot()`, `.subscribe(listener)`, `.add(files)`, `.remove(id)`, `.update(id, patch)`, `.reset()`, and `.dispose()`.
- Produces `useCompressionStore(selector)` for React components.

- [ ] **Step 1: Write failing lifecycle tests**

```ts
compressionStore.remove(item.id);
expect(URL.revokeObjectURL).toHaveBeenCalledWith(item.previewUrl);
compressionStore.reset();
expect(compressionStore.getSnapshot().items).toHaveLength(0);
```

Test immutable original retention, result replacement cleanup, removal, reset, partial validation, and reload-equivalent empty state.

- [ ] **Step 2: Implement `useSyncExternalStore` state and URL ownership**

Keep every original `File`, create URLs only through one helper, revoke result and preview URLs exactly once, and expose serializable metadata separately from binary objects.

- [ ] **Step 3: Verify and commit**

Run: `npm run test:run -- tests/unit/compression-store.test.ts`

```powershell
git add stores hooks tests/unit/compression-store.test.ts
git commit -m "feat: manage local compression sessions"
```

### Task 6: Build the visual system and public homepage

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `next.config.ts`
- Create: `components/site-header.tsx`, `components/site-footer.tsx`, `components/upload-dropzone.tsx`, `components/preset-links.tsx`, `components/icons.tsx`
- Test: `tests/unit/upload-dropzone.test.tsx`

**Interfaces:**
- Produces `<UploadDropzone onAccepted?: () => void compact?: boolean />` that validates, stores, reports partial errors, and navigates to `/compress`.

- [ ] **Step 1: Write failing accessible upload tests**

```tsx
expect(screen.getByRole("button", { name: /choose images/i })).toBeVisible();
await user.upload(input, [validJpeg, invalidText]);
expect(mockAdd).toHaveBeenCalledWith([validJpeg]);
expect(screen.getByRole("alert")).toHaveTextContent(/not supported/i);
```

- [ ] **Step 2: Implement tokens and semantic homepage**

Use the exact brief palette, Geist variables, responsive spacing, visible focus rings, reduced motion, skip link, header links, centered hero copy, upload zone, three benefits, three-step instructions, and preset links. Add security headers for framing, MIME sniffing, referrers, and unused permissions.

- [ ] **Step 3: Verify responsiveness and commit**

Run: `npm run test:run -- tests/unit/upload-dropzone.test.tsx && npm run lint && npm run typecheck`

```powershell
git add app components next.config.ts tests/unit/upload-dropzone.test.tsx
git commit -m "feat: build ImageLab homepage and upload flow"
```

### Task 7: Build the complete compression workspace

**Files:**
- Create: `app/compress/layout.tsx`, `app/compress/page.tsx`
- Create: `components/compressor/workspace.tsx`, `file-list.tsx`, `file-row.tsx`, `settings-panel.tsx`, `preview-panel.tsx`, `result-summary.tsx`, `workspace-empty.tsx`, `format-choice.tsx`, `toast-region.tsx`, `confirm-reset.tsx`
- Test: `tests/unit/workspace.test.tsx`

**Interfaces:**
- `<CompressorWorkspace initialTargetBytes?: number />` consumes the store and compression runner.
- Settings support `{ mode: "auto" }` or `{ mode: "target"; targetBytes; output: "preserve" | "image/webp" | "image/jpeg" }`.

- [ ] **Step 1: Write failing workspace behavior tests**

```tsx
expect(screen.getByText("Select images to start compressing")).toBeVisible();
expect(screen.getByRole("button", { name: /compress all/i })).toBeEnabled();
expect(screen.getByText(/transparency/i)).toBeVisible();
expect(screen.getByRole("status")).toHaveTextContent(/completed/i);
```

Cover ready/processing/completed/failed/cancelled states, selection, removal, add more, single/all compression, presets and custom KB/MB, preview toggle, metadata, retry, explicit conversion, reset confirmation, and disabled conflicts.

- [ ] **Step 2: Implement the responsive two-column workspace**

Render compact file rows with thumbnails and technical metadata, a centered non-upscaled preview, original/result toggle, honest saved percentage, limitations, individual download, ZIP download, add-more and start-over actions. Announce transitions in a polite live region and move focus only after destructive keyboard actions or completion.

- [ ] **Step 3: Verify component behavior and commit**

Run: `npm run test:run -- tests/unit/workspace.test.tsx && npm run lint && npm run typecheck`

```powershell
git add app/compress components/compressor tests/unit/workspace.test.tsx
git commit -m "feat: add full compression workspace"
```

### Task 8: Add preset tools and informational pages

**Files:**
- Create: `lib/seo/presets.ts`, `lib/seo/metadata.ts`, `lib/seo/json-ld.ts`
- Create: `app/compress-image-to-[target]/page.tsx`, `components/preset-compressor.tsx`
- Create: `app/about/page.tsx`, `app/privacy/page.tsx`
- Test: `tests/unit/presets.test.ts`

**Interfaces:**
- Produces `PRESETS`, `getPreset(slug)`, `createPageMetadata(preset)`, and static params for `20kb`, `50kb`, `100kb`, `200kb`, `500kb`, and `1mb`.

- [ ] **Step 1: Write failing route-data uniqueness tests**

```ts
expect(new Set(PRESETS.map((p) => p.title)).size).toBe(6);
expect(new Set(PRESETS.map((p) => p.description)).size).toBe(6);
expect(getPreset("1mb")?.bytes).toBe(1_000_000);
```

- [ ] **Step 2: Implement six statically generated functional pages**

Each page has a unique title, description, canonical, H1, size-specific use guidance and limitation copy, related-tool links, and `<PresetCompressor targetBytes={preset.bytes} />`. About and privacy pages explain local processing, no accounts, no remote persistence, metadata removal, codecs, and resource limits.

- [ ] **Step 3: Verify and commit**

Run: `npm run test:run -- tests/unit/presets.test.ts && npm run typecheck`

```powershell
git add lib/seo app/compress-image-to-[target] app/about app/privacy components/preset-compressor.tsx tests/unit/presets.test.ts
git commit -m "feat: add target-size tools and trust pages"
```

### Task 9: Complete technical SEO and share metadata

**Files:**
- Create: `lib/seo/origin.ts`, `app/sitemap.ts`, `app/robots.ts`, `app/opengraph-image.tsx`
- Modify: `app/layout.tsx`, `app/page.tsx`, `app/compress/layout.tsx`
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Produces `siteOrigin(): URL`, public sitemap entries, crawler rules, WebApplication JSON-LD, Open Graph, and Twitter metadata.

- [ ] **Step 1: Write failing SEO tests**

```ts
expect(sitemap().some((entry) => entry.url.endsWith("/compress"))).toBe(false);
expect(robots().rules).toMatchObject({ userAgent: "*", allow: "/" });
expect(workspaceMetadata.robots).toMatchObject({ index: false, follow: false });
```

- [ ] **Step 2: Implement canonical-safe metadata**

Use `metadataBase`, exact homepage title/description, canonical paths, OG/Twitter cards, a generated monochrome OG image, and JSON-LD containing only supported WebApplication facts. Sitemap includes `/`, six preset pages, `/about`, and `/privacy`.

- [ ] **Step 3: Verify and commit**

Run: `npm run test:run -- tests/unit/seo.test.ts && npm run build`

```powershell
git add app lib/seo tests/unit/seo.test.ts
git commit -m "feat: complete ImageLab technical SEO"
```

### Task 10: Add critical end-to-end coverage

**Files:**
- Create: `tests/fixtures/sample.jpg`, `tests/fixtures/transparent.png`, `tests/fixtures/sample.webp`
- Create: `tests/e2e/homepage.spec.ts`, `tests/e2e/workspace.spec.ts`, `tests/e2e/batch.spec.ts`, `tests/e2e/refresh.spec.ts`

**Interfaces:**
- Exercises the production UI and real browser codecs in Chromium.

- [ ] **Step 1: Add the required failing browser journeys**

```ts
await page.setInputFiles('input[type="file"]', "tests/fixtures/sample.jpg");
await expect(page).toHaveURL(/\/compress$/);
await page.getByRole("button", { name: "Compress image" }).click();
const download = await page.waitForEvent("download");
expect(download.suggestedFilename()).toContain("-compressed");
```

Cover homepage, upload/navigation, automatic download, target compression, multiple files, ZIP download, removal, and refresh empty state.

- [ ] **Step 2: Run and fix product defects exposed by the journeys**

Run: `npx playwright install chromium` then `npm run test:e2e`

Expected: all required journeys pass in Chromium without network image uploads.

- [ ] **Step 3: Commit**

```powershell
git add tests/e2e tests/fixtures
git commit -m "test: cover critical compression journeys"
```

### Task 11: Document, audit, and release-verify

**Files:**
- Modify: `README.md`
- Create: `docs/limitations.md`
- Modify as defects require: files from Tasks 1-10

**Interfaces:**
- Documents installation, local commands, browser support, privacy, Vercel deployment, canonical configuration, limitations, and v2 opportunities.

- [ ] **Step 1: Write deployment and limitation documentation**

Document `npm install`, `npm run dev`, `npm run verify`, `npm run build`, importing the repo in Vercel, setting `NEXT_PUBLIC_SITE_URL` to the stable assigned domain, and redeploying. State codec variability, target limitations, explicit format conversion, metadata/color-profile removal, memory limits, and no persistence after refresh.

- [ ] **Step 2: Run the complete release gate**

Run: `npm run lint`, `npm run typecheck`, `npm run test:run -- --coverage`, `npm run test:e2e`, and `npm run build`.

Expected: every command exits 0; production build lists all public routes; no `/api` route exists; `/compress` remains noindex and absent from the sitemap.

- [ ] **Step 3: Inspect for placeholders and privacy regressions**

Run: `rg -n "TODO|FIXME|placeholder|fetch\(|axios|localStorage|sessionStorage" app components lib stores workers README.md docs/limitations.md`

Expected: no unfinished UI/code, remote image transmission, or binary persistence. Any documented browser storage wording is reviewed manually.

- [ ] **Step 4: Commit the verified release**

```powershell
git add README.md docs/limitations.md
git commit -m "docs: prepare ImageLab for deployment"
```
