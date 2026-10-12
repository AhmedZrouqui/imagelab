# ImageLab

ImageLab is a free, privacy-first image compressor for JPG, PNG, and WebP files. Every image is decoded and encoded in the browser. There is no backend, account, database, upload service, or required API key.

## Local development

Requirements: a current Node.js LTS release and npm.

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. Set `NEXT_PUBLIC_SITE_URL` to the stable public URL when checking production metadata.

## Quality commands

```bash
npm run lint
npm run typecheck
npm run test:run
npm run test:e2e
npm run build
```

`npm run verify` runs linting, TypeScript, unit tests, and the production build. Install Playwright's Chromium browser once with `npx playwright install chromium` before the end-to-end suite.

## Architecture

Static App Router pages provide public content and metadata. Client components own the file picker and compression workspace. Original `File` objects remain in an in-memory external store, so route navigation works without persistence and a refresh intentionally clears the session.

The compression engine is separate from React. Automatic mode uses a conservative native re-encode. Target mode uses bounded quality samples and progressive dimension reduction, preserves aspect ratio, and accepts only blobs below the selected maximum. Browser Canvas codecs do the actual work. A two-job scheduler limits batch concurrency, and JSZip assembles completed results locally.

## Deploy to Vercel

1. Import this repository into Vercel.
2. Keep the default Next.js build command (`npm run build`).
3. Add `NEXT_PUBLIC_SITE_URL` with the stable assigned `https://…vercel.app` domain.
4. Deploy again after the domain is assigned so canonical URLs, the sitemap, and robots metadata use the stable host.

No paid infrastructure or secrets are required. Do not set `NEXT_PUBLIC_SITE_URL` to a preview deployment URL.

## Privacy and browser support

Image bytes are not sent over the network or placed in web storage. Object URLs are released when items are removed, replaced, or reset. The app targets current evergreen browsers with Canvas, `createImageBitmap`, Blob, and download support. See [known limitations](docs/limitations.md).
