# Verification — 28 October 2026

## Production deployment

- Published to https://petal-and-ink.vercel.app on Vercel.
- Production deployment: `dpl_82a2ePUjbn3CnLhsgpYXu3zACaQP` (READY).
- Anonymous HTTP checks returned 200 for the page, both flower atlases, the local serif font, the renderer module, and `/builder.html`.
- The published page contains all eight main flower controls and five supporting choices, and was opened and visually checked in the browser.
- `vercel.json` explicitly disables framework detection and builds so Vercel serves the static `dist/` output.

## Browser checks completed

- 360 combinations: eight main flowers × five support choices × three wraps × three palettes.
- 40 flower/support pairs produce distinct rendered images.
- 13 flower and greenery thumbnails contain artwork.
- Repeated rendering of the same saved seed produces identical pixels; rearranging changes them.
- Six difficult text cases, including blank notes, paragraph breaks, emoji, long text, and unbroken strings.
- PNG output is exactly 2400 × 3000 pixels.
- Decoding the exported PNG preserves every pixel of the full-resolution renderer (matching checksums 4114390411).
- Comparing the downsampled export to the 800 × 1000 preview produced a mean RGB difference of 0.767 out of 255. Small differences occur at resampled edges; no separate export color treatment is applied.
- Actual download button saved a PNG, which was reopened and inspected visually.
- Main/support selections, wrap/ribbon controls, recipient/sender, local draft restoration, and loading completion were exercised in the live browser.
- Desktop and 390px / 320px phone layouts inspected. No horizontal document overflow at the measured phone widths.
- No warnings or errors reported in the inspected browser console.
- JavaScript syntax checks pass.

## Files and reproduction

Run `node server.mjs`, then visit `/tests/renderer-check.html` for the automated rendering checks. This verification page is excluded from Vercel uploads. Screenshots are in `test-results/`.

## Limits

The exported scene uses sRGB canvases where supported. Image viewers, displays, and operating-system color settings can still produce viewing differences. Cross-browser Safari/Firefox testing and a physical-device reduced-motion test were not performed here; reduced-motion CSS and pause/hidden-tab handling are implemented. Generated flower heads are composited from bundled transparent artwork, with vector stems, foliage, wrapping, and ribbon; the output is a botanical illustration.
