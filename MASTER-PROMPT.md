# Master prompt: Petal & Ink bouquet studio

Act as a senior product designer, creative frontend engineer, and graphics engineer. Redesign and implement this bouquet builder as a polished, romantic experience: https://build-a-bouquet.vercel.app/builder.html. The finished website should feel like making a personal gift at a boutique florist: thoughtful, tactile, quiet, and beautiful enough to share. Deliver a working website and verify its actual downloaded output.

**Start with the existing project.**

Inspect the repository, its instructions, the live interface, source artwork, and image-export pipeline before editing. Preserve useful existing behavior and the deployment setup. If source is unavailable, create a self-contained replacement and say so clearly. Do not claim to have updated the original deployment unless you actually have access and verify publication.

The original site has used tiny, precomposed bouquet PNGs, approximately 168–181 × 243–249 pixels; one poppies-and-daisies combination was missing. Its export code has also changed backgrounds to white and removed visual effects before taking a screenshot. Recheck these findings rather than assuming the implementation is unchanged. Separate confirmed causes from hypotheses: stripping styles changes appearance, but a specific saturation or color-profile defect needs a reproduced comparison.

**Create a coherent visual identity.**

Use the working name “Petal & Ink” and the line “A little love, in bloom.” Establish warm ivory paper, deep wine text, restrained dusty rose accents, sage greenery, and occasional lavender ink. Give the page generous breathing room, fine borders, subtle paper texture, and carefully balanced typography. Pair a characterful editorial serif with an exceptionally readable interface font. Reserve delicate handwriting for decorative notes and personal touches.

The bouquet is the visual centerpiece. On desktop, arrange clear customization controls beside a large portrait keepsake preview. On mobile, use a comfortable single-column flow with an easily reachable preview and download action. Avoid oversized empty cards, excessive shadows, generic dashboard styling, and tiny previews. Every screen size must retain legible labels and useful touch targets.

**Make the background quietly write love notes.**

Create a subtle ambient layer that keeps writing short romantic phrases, little hearts, loops, and botanical flourishes in very thin strokes. Example phrases: “always, in all ways,” “you make ordinary days bloom,” “a little love for you,” and “with all my heart.” Use several harmonious inks: muted burgundy, dusty pink, lavender, and sage. Vary position, slight rotation, timing, and phrasing without producing visual clutter.

Animate actual handwriting paths with progressive stroke reveal so marks appear to be drawn by a pen. Do not substitute a typewriter effect or simply fade in a script font. Keep the active artwork bounded and recycle completed notes rather than accumulating DOM elements indefinitely. Keep animation behind content, non-interactive, and hidden from assistive technology. Protect text contrast and input focus. Include a clearly labeled motion toggle, honor reduced-motion preferences, and pause unnecessary animation when the page is hidden. The static state must still look intentional.

**Rebuild bouquet artwork with natural form and depth.**

Use original, sufficiently detailed transparent botanical artwork with coherent lighting and style. Favor rich, organic petals, subtle pigment and texture, and recognizable flower anatomy. Main flowers must no longer look like rigid cartoon symbols. Never upscale the old thumbnail assets and call that a quality fix.

Compose selected main flowers and supporting flowers or greenery into one arrangement. Use gently curved Bézier stems, tapered leaves, varied bloom angles and sizes, natural overlaps, and restrained depth shading. Preserve the identity and color character of the selected species. Avoid obvious repeated stamps, perfect symmetry, straight radiating sticks, thick outlines, and an angular wrapper that dominates the flowers. Add softly folded wrapping paper and a flowing ribbon in matching colors.

Make composition deterministic from saved state and a seed. “Rearrange” changes the seed deliberately; typing a message, resizing the window, or downloading must not randomly change the bouquet. Use the same artwork source for choice thumbnails and the final composition so selections match what visitors receive.

**Deliver a complete, focused customization flow.**

Provide main-flower and support choices, a small curated palette selection, wrapping styles, recipient name, personal message, and sender name. Updates should appear promptly in the preview. Include rearrange, reset, local draft persistence, and a high-resolution PNG download. Restore valid drafts after refresh and recover gracefully from missing, malformed, or unavailable browser storage. Give reset a clear effect without losing the ability to keep working.

Offer eight main flowers: garden roses, lilies, poppies, sunflowers, tulips, peonies, hydrangeas, and orchids. Offer five supporting choices: daisies, violets, greenery, lavender, and baby's breath. Give every choice its own botanical artwork and accessible label. The expanded selection must remain comfortable to browse on a phone.

Use native buttons and form controls, visible focus indicators, descriptive selected states, and keyboard navigation. Apply sensible text limits, show a message counter, and handle long names, punctuation, emoji, line breaks, and empty optional fields. Treat all visitor text as text, never executable markup. Keep the experience usable without accounts, payments, a server-side database, or invented sharing services. Show actionable loading and error states; do not leave silent failures or decorative buttons that do nothing.

**Let visitors add their own stickers.**

Provide a file picker for up to six PNG, WebP, JPEG, or GIF sticker images, with a 5 MB limit per file. Explain that visitors must first save or export their sticker from WhatsApp or another app; the website does not directly access accounts or sticker libraries. Validate the selected files and decode them safely, report unsupported, oversized, unreadable, or excess files clearly, and keep the existing bouquet intact when an upload fails. Preserve transparency in PNG and WebP images. Do not imply that JPEG backgrounds will be removed automatically.

Process sticker images locally without a server upload. Offer move, size, rotation, selection, and removal controls that work with touch, a mouse, and a keyboard. Keep sticker positioning usable within the keepsake, show the selected sticker clearly, and prevent sticker gestures from accidentally changing unrelated bouquet controls. Maintain each sticker's placement, size, rotation, and stacking order in the saved scene. Persist image data in IndexedDB and restore it with the corresponding local draft after refresh. Handle unavailable storage or missing image records with a useful message and a usable draft. Revoke temporary object URLs and remove obsolete stored sticker records as appropriate.

Normalize animated GIF or WebP stickers to a stable still image before using them in the shared scene. Explain that the PNG download is still, not animated. The same image frame and transformations must appear in the preview and export. Uploaded stickers are part of the keepsake, while editor handles and selection outlines are not.

**Make the saved image faithful to the preview.**

Maintain one composition model and one rendering function for preview and export. Export a declared 2400 × 3000 PNG from the underlying scene, independent of screen size and device pixel ratio. Use a consistent sRGB rendering path where supported, and retain the exact intended background, opacity, shadows, texture, message, spacing, and flower arrangement. Do not strip styles, apply a different color treatment, or capture unrelated page controls and ambient animation.

Await image decoding and font readiness before rendering or exporting. Use same-origin bundled assets or verified export-safe sources. Bound memory use, prevent duplicate export requests, show progress, and surface failures with a retry action. PNG compression settings are not a solution to color mismatch. Check the actual saved image against an equivalent-size preview in the same color-managed browser; document any remaining limitations honestly.

**Verify the finished experience and deliver it.**

Test all 360 combinations of eight main flowers, five support choices, three wrapping styles, and three accent palettes, along with rearrange, reset, draft restoration, and download. Confirm there are no missing assets or console errors. Test narrow mobile and desktop layouts, keyboard-only use, reduced motion, rapid changes, empty text, maximum-length messages, and delayed or failed assets. Exercise each supported sticker format, transparency, the six-file and 5 MB limits, invalid files, move/resize/rotate/remove controls, IndexedDB restoration and failure handling, and animation becoming a consistent still frame. Open a downloaded PNG and verify dimensions, text, composition, sharpness, colors, and sticker fidelity. Confirm downloading never changes the arrangement or sticker placement and never exports editor controls.

Deliver organized source files, bundled assets, run and deployment instructions, a short explanation of the improvements, and the checks actually performed. Make implementation decisions independently when the brief is sufficient. Complete the functional experience; clearly identify any unresolved issue instead of presenting it as finished.

Deploy the finished site to Vercel using the authorized account and verify the resulting production URL. Use the existing Vercel project only when it is available and identified as the intended target; otherwise create a separate project. Do not claim to replace the original URL without verifying that deployment.
