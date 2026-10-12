# ImageLab

ImageLab is a fast, privacy-first image compressor for JPEG, PNG, and WebP files. Compression happens entirely in your browser: images are never uploaded, no account is required, and there is no backend to maintain.

## Features

- Compress one image or a batch of up to 40 files
- Use balanced automatic compression or set a maximum output size
- Keep the original format or convert to JPEG, PNG, or WebP
- Preview results and download files individually or as a ZIP
- Preserve transparent pixels when using PNG or WebP
- Process files locally with a two-job concurrency limit
- Use dedicated, indexable pages for common 20–500 KB targets

Target sizes are maximums, not exact-size guarantees. Very small targets may require substantial resizing, and lossless PNG files may not reach them. See [known limitations](docs/limitations.md) for details.

## Getting started

You need a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

No environment variables are required for local development. For deployed metadata, copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to the public production URL.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm run test:run` | Run the Vitest unit suite once |
| `npm run test:e2e` | Run Playwright browser tests |
| `npm run verify` | Run lint, type-checking, unit tests, and a production build |

Install Playwright's Chromium browser once before running end-to-end tests:

```bash
npx playwright install chromium
```

## How it works

The Next.js App Router provides the public pages and metadata. The compression workspace keeps original `File` objects in memory, so navigating inside the app preserves a session while refreshing clears it.

Compression is isolated from React. Browser Canvas APIs perform the encoding, a bounded search adjusts quality and dimensions for target-size jobs, and JSZip packages completed batch results locally. Image data is not stored in cookies, local storage, or a database.

## Project limits

| Limit | Value |
| --- | ---: |
| Files per batch | 40 |
| Maximum file size | 30 MB |
| Maximum batch size | 250 MB |
| Maximum image dimensions | 40 megapixels |
| Concurrent compression jobs | 2 |

Supported inputs are JPEG, PNG, and WebP. HEIC, AVIF input, animated images, and metadata preservation are not currently supported.

## Deployment

The project can be deployed as a standard Next.js application. On Vercel:

1. Import the repository.
2. Keep the default `npm run build` command.
3. Set `NEXT_PUBLIC_SITE_URL` to the stable production domain.
4. Redeploy so canonical URLs, `robots.txt`, and the sitemap use that domain.

No API keys, database, or paid infrastructure are required.
