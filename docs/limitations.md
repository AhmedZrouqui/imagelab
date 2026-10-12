# Known limitations

- Native codecs vary slightly across browsers, so two browsers can produce different byte sizes from the same settings.
- A requested size is a maximum, not an exact output promise. Detailed or very small images may require substantial dimension reduction, and some targets remain impractical.
- PNG does not expose JPEG-style quality control. ImageLab preserves transparency and reports a limitation instead of silently filling transparent pixels.
- Canvas re-encoding usually removes EXIF, GPS, camera data, embedded thumbnails, and color profiles. Orientation follows modern browser decoding where supported.
- The session is deliberately memory-only. Refreshing or closing the tab discards originals and results.
- Each file is limited to 30 MB and 40 megapixels. A batch is limited to 40 files and 250 MB, with two simultaneous compression jobs.
- HEIC, AVIF input, animated images, metadata preservation, and per-image compression settings are not included in the first release.

## Possible version 2 work

- Opt-in AVIF and HEIC support where browser decoding is reliable.
- A dedicated worker codec path for browsers with complete OffscreenCanvas support.
- Visual quality comparison controls and per-image overrides for advanced users.
- Optional metadata preservation with explicit privacy warnings.
