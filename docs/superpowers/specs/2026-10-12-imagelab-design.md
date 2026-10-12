# ImageLab Design

## Product outcome

ImageLab is a dark-only, privacy-first image compressor for JPG, PNG, and WebP files. A visitor can add one or many images, choose balanced automatic compression or a maximum target size, process everything locally, inspect honest results, and download individual files or a ZIP. Public content remains indexable and fast; the private workspace is noindex and excluded from the sitemap.

## Architecture

The application uses Next.js 16 App Router and React 19. Static pages, metadata, structured data, sitemap, and robots rules are server-rendered. Interactive upload and compression surfaces are isolated client components and the compression code is loaded only when required.

The implementation is divided into focused layers:

- `app/`: routes, layouts, page metadata, structured data, sitemap, and robots rules.
- `components/`: shared header, footer, upload surface, feedback, and static content primitives.
- `components/compressor/`: workspace, file list, settings, preview, result summary, and download controls.
- `stores/`: an in-memory external store containing original `File` objects and per-file session state. It never persists image bytes.
- `lib/files/`: signature validation, filename generation, size formatting, object URL ownership, and resource limits.
- `lib/compression/`: typed compression contracts, candidate selection, bounded optimization, batch scheduling, cancellation, and ZIP preparation.
- `workers/`: an optional browser worker path for supported bitmap/codec operations, with a safe main-thread fallback.

Only original inputs are retained for recompression. Compressed output is replaceable and never becomes the next compression source.

## Routes and page composition

The homepage contains the header, concise hero, primary upload drop zone, three product benefits, a three-step explanation, and links to target-size tools. A valid selection is placed in the in-memory store before navigation to `/compress`.

`/compress` owns the full workspace. A refresh naturally empties the memory store and produces a friendly reselect state. Desktop uses a compact settings/file rail and a larger preview/results panel; mobile follows file selection, settings, preview, and actions in task order.

The six target routes are statically generated from one typed preset definition. Each supplies unique metadata, H1 copy, practical guidance, limitations, related links, and a compressor entry surface initialized to its target. The implementation and engine are shared rather than duplicated. `/privacy` and `/about` explain local processing, metadata limitations, and product intent.

## File intake and state model

The upload surface supports pointer, drag-and-drop, keyboard activation, and mobile file selection. Validation checks MIME declarations and recognized file signatures, then attempts decode before processing. The initial limits are 40 files, 30 MB per file, 250 MB per batch, and 40 megapixels per decoded image. Invalid or corrupt files receive actionable errors without rejecting otherwise valid files in the same selection.

Each item has an ID, immutable original file, decoded metadata, preview URL, optional result, and one of these processing states: ready, processing, completed, failed, or cancelled. Object URLs are revoked when replaced, removed, reset, or unmounted. The store exposes narrow actions and uses React's external-store subscription API instead of a state-management dependency.

## Compression behavior

The engine accepts a source and explicit settings, and returns either a valid result with diagnostic metadata or a typed limitation/error result. Every search has fixed attempt counts, minimum quality and dimension bounds, cancellation checks, and an elapsed-time safety budget.

Automatic mode tries a conservative encode at original dimensions and format where the browser supports it. JPEG and WebP use a small bounded set of balanced quality candidates. PNG is re-encoded without pretending its quality argument behaves like JPEG. An output is successful only when it is meaningfully smaller; otherwise the UI says the image is already well optimized and retains the original for download.

Target mode uses a safety-adjusted maximum byte count. For JPEG and WebP, it samples quality, retains the best candidate at or below the limit, and performs a bounded local/binary refinement without assuming perfect monotonicity. If quality alone is insufficient, it progressively reduces dimensions while preserving aspect ratio and never enlarging the source. PNG is first attempted as transparent PNG. If the target remains unreachable, the result explains that transparency and PNG encoding constrain size; any WebP conversion is an explicit user choice, never silent. Opaque formats may offer an explicit alternate output format.

Success means the blob is at or below the requested maximum. If practical limits are reached, the closest candidate is reported as a limitation, not as success. Outputs larger than the original are never presented as savings.

Browser decoding honors image orientation through modern image decoding behavior where supported. Canvas re-encoding may remove EXIF, ICC profiles, and other metadata; this is disclosed in the workspace and privacy copy.

## Batch processing and downloads

Single-file actions call the same scheduler used by batch compression. The scheduler processes at most two files concurrently, supports cancellation, and emits state transitions instead of fabricated percentages. Controls prevent conflicting operations while allowing completed items to remain downloadable.

Individual downloads use deterministic `-compressed` names and the actual output extension. Batch download creates a ZIP on demand from completed blobs, resolves duplicate names with numeric suffixes, and never triggers automatically. Adding, removing, retrying, recompressing, and resetting operate on explicit store actions. Resetting a non-empty batch requires confirmation.

## Experience and visual system

The visual language uses the specified zinc-black palette, Geist Sans and Mono, subtle one-pixel borders, compact controls, generous negative space, and white primary actions. Motion is limited to short opacity, border, and transform feedback and respects reduced-motion preferences. There are no gradients, glass effects, decorative illustrations, or ornamental dashboards.

Controls have visible focus states, descriptive labels, logical tab order, and adequate hit targets. Status changes use a polite live region. Error messages identify the affected file and a recovery action. Focus moves deliberately after navigation, destructive removal, and batch completion without disrupting pointer users.

## SEO, privacy, and security

The public origin comes from `NEXT_PUBLIC_SITE_URL`. Production builds document that it must be the assigned stable `vercel.app` or custom domain; development uses `http://localhost:3000`, and Vercel preview hostnames are never promoted to canonical URLs. Public pages define canonical URLs, Open Graph data, Twitter cards, semantic headings, internal links, and WebApplication structured data without unsupported ratings or claims. `/compress` is `noindex, nofollow` and absent from the sitemap.

No image bytes are sent over the network, logged, placed in URLs, or persisted. The project contains no API routes, analytics, authentication, database, or third-party processing. Security headers restrict framing, referrers, MIME sniffing, and unnecessary browser capabilities while preserving local blob/worker behavior.

## Error handling

Typed errors distinguish unsupported type, invalid signature, decode failure, resource limit, unsupported codec, cancellation, processing failure, and unreachable target. The interface keeps unaffected batch items usable. Worker initialization or operation failure falls back once to local processing when safe; it does not loop between execution paths.

## Testing and verification

Vitest covers validation, bounded candidate selection, target success rules, unreachable targets, cancellation, batch concurrency, naming collisions, and cleanup. Codec-facing tests use deterministic canvas/encoder adapters plus small real fixtures where the test browser environment is appropriate. This separates algorithm correctness from browser codec variability.

Playwright covers homepage loading, upload-to-workspace navigation, auto and target compression, individual download, batch compression and ZIP download, removal, and refresh empty state. Accessibility checks include keyboard upload and status messaging. Final verification runs ESLint, TypeScript checking, unit tests, end-to-end tests, and a production build.

## Deployment and documentation

The repository includes `.env.example` and a README with setup, development, test, build, and Vercel deployment instructions. Deployment requires no secrets or paid services. Known browser codec differences and metadata loss are documented. The initial implementation targets modern evergreen browsers and degrades to bounded main-thread processing when worker canvas APIs are unavailable.

## Acceptance boundaries

The first release does not include accounts, cloud storage, analytics, server processing, lossless-compression claims, HEIC/AVIF input, image editing, or per-image settings overrides. These exclusions protect bundle size, privacy, and the 20-second core workflow while leaving clear extension points for later versions.
