# Petal & Ink

A romantic bouquet studio with botanical artwork, handwritten ambient notes, personal stickers, customizable keepsakes, and a shared preview/export renderer.

Live website: https://petal-and-ink.vercel.app

## Run locally

From this directory, run:

```sh
node server.mjs
```

Open the local URL printed by the server. Use the server rather than opening the HTML directly, because the application loads JavaScript modules and image assets.

## Files

- `dist/` contains the deployable static website.
- `dist/renderer.js` composes the bouquet and exports its PNG.
- `dist/app.js` manages selections, accessible controls, local drafts, and downloads.
- `dist/ink.js` draws the animated monoline handwriting.
- `dist/index.html` and `dist/styles.css` define the responsive studio.
- `dist/assets/flower-atlas.png` contains the generated botanical artwork.
- `dist/assets/flower-atlas-extra.png` adds tulips, peonies, hydrangeas, orchids, lavender, and baby's breath.
- `dist/assets/IMAGE-PROMPT.md` records the artwork generation prompt.
- `dist/assets/` also contains bundled fonts and their OFL licenses.
- `dist/tests/renderer-check.html` runs the browser rendering/export checks locally. Test pages are excluded from Vercel uploads.
- `MASTER-PROMPT.md` contains the reusable redesign brief.
- `server.mjs` runs the local static preview, and `vercel.json` configures Vercel.
- `.openai/` contains local Sites metadata and is excluded from this repository; this version is deployed with Vercel.

The browser retains a draft locally, with sticker images stored in IndexedDB on the same browser and device. There is no server-side application database or account system. A downloaded keepsake is rendered from the bouquet state rather than captured from a screenshot of the interface.

## Personal stickers

Save or export a sticker from WhatsApp or another app as an image file, then add it to the bouquet through the file picker. The website does not connect to those accounts or read their sticker libraries. It accepts up to six PNG, WebP, JPEG, or GIF files, each no larger than 5 MB. Transparent PNG and WebP files work well for cutout stickers; JPEG files retain their background.

Move, resize, rotate, or remove each sticker in the studio. Processing happens locally in the browser; sticker files are not uploaded to a server. The local draft stores the sticker images in IndexedDB so they can be restored after a refresh. Clearing site data, using a different browser or device, or unavailable browser storage can prevent restoration.

Stickers are included in the shared preview and PNG export scene, preserving their placement, size, rotation, and layering. Animated GIF or WebP stickers become still images in the downloaded PNG. Export does not preserve animation.

## Deploy to Vercel

This is a static application. Import the project into Vercel, choose the **Other** framework preset, leave the build command empty, and set the output directory to `dist`. Alternatively, publish the contents of `dist` with another static host. Keep all artwork and application files together so relative asset URLs continue to work.

Deploying this replacement does not automatically change `build-a-bouquet.vercel.app`; updating that address requires access to its existing Vercel project.

## Visual verification

Before release, exercise every selection, verify the mobile layout and keyboard controls, and open an exported PNG to compare it with the preview. Verify sticker uploads, limits, editing, removal, refresh restoration, and preview/export fidelity, including a transparent image and an animated image rendered as a still. The intended export size is 2400 × 3000 pixels. Review the accompanying delivery notes for the checks actually completed in this environment.

The collection includes eight main flowers and five supporting choices. The browser harness checks all 360 flower/support/wrap/palette combinations, 40 distinct flower pairs, deterministic arrangements, difficult text, export dimensions, and exact PNG pixel preservation. See `VERIFICATION.md` for recorded results.

