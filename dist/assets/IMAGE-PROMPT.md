# Botanical flower atlas

Generated with the built-in image generation tool. Final file: `flower-atlas.png`.

## Initial prompt

Use case: stylized-concept.
Asset type: a production transparent botanical sprite atlas for an elegant romantic bouquet website.
Primary request: create ONE square PNG atlas, ideally 2048 × 2048 or greater, arranged in EXACTLY three equal columns and two equal rows, six equal rectangular cells. Completely transparent background with genuine alpha, not a checkerboard or a painted white backdrop. No visible cell borders.
Subjects, reading left to right:
Top row cell 1: one lush blush-pink garden rose flower head, softly opened densely layered petals.
Top row cell 2: one ivory open lily flower head with six organically curved petals and delicate gold stamens.
Top row cell 3: one vermilion coral-red poppy flower head with crinkled thin petals and a dark botanical center.
Bottom row cell 1: one warm golden-yellow sunflower flower head with irregular natural petals and a textured brown center.
Bottom row cell 2: one white daisy flower head with a small golden center and softly curved individual petals.
Bottom row cell 3: one small lavender-purple violet flower cluster with delicate recognizable violet petals.
Style/medium: exquisite detailed botanical watercolor, nuanced fine pigment texture, lifelike dimensional petal anatomy, subtle translucent edges, a sophisticated antique botanical illustration refreshed for a modern romantic stationery brand. Natural, soft, lush and organic, never stiff. Soft neutral lighting and coherent natural color.
Composition: each flower centered exactly in its own grid cell. Heads only, at most a tiny neck, no long stem, no leaves. All flowers front-facing or very slightly tilted for bouquet composition. Each flower's full extent fits within the central 70% width and 70% height of its equal cell, leaving substantial empty transparent gutters on every side and between flowers. Keep every petal intact, no cropping or overlap between cells. Fill enough of each cell for detail but respect the gutters.
Constraints: exactly six subjects in the stated positions, equal-cell grid, all isolated on true transparent alpha; no text, no labels, no lettering, no logos, no watermarks, no opaque rectangles, no drop shadow beyond the flower, no stems spanning cells. Avoid cartoon styling, flat vector shapes, thick black outlines, geometric petals, overly desaturated colors, rigid symmetry, and painterly background washes.

## Spacing refinement prompt

Edit this flower atlas only to correct spacing. Preserve exactly the same six flower heads, details, watercolor texture, colors and botanical anatomy. Keep square canvas, exactly 3 equal columns by 2 equal rows, and true transparent background. Current flowers are too wide and almost touching. SCALE EACH OF THE SIX FLOWERS DOWN TO ABOUT 68% OF ITS CURRENT SIZE, individually, keeping the centers at the exact centers of the six equal grid cells. On a 1280×1280 canvas the centers are (213,320), (640,320), (1067,320), (213,960), (640,960), (1067,960). Every flower must have clear transparent space on all four sides within its own cell. No flower may touch a cell boundary. Target flower width roughly 285 pixels maximum for 1280 canvas. Keep order rose/lily/poppy across top and sunflower/daisy/violet across bottom. Do not add stems, borders, labels, background paint, ground, shadows, or checkerboard. Do not change flower appearance or colors. This is a transparent sprite atlas used by code to crop each equal cell, so generous invisible gutters are mandatory.

## Asset layout

Three equal columns × two equal rows. Index order: rose, lily, poppy, sunflower, daisy, violet. Transparent PNG; renderer should find nontransparent artwork bounds per cell before compositing.

## Additional flower atlas

Final file: `flower-atlas-extra.png`, generated using the built-in tool with the first atlas as a style reference.

Use case: stylized-concept.
Asset type: second production transparent botanical sprite atlas for the same romantic bouquet website.
Reference image: the attached flower atlas is a STYLE REFERENCE ONLY. Make a new complementary atlas with six different botanical subjects, preserving the reference's delicate realistic watercolor texture, nuanced warm natural colors, detailed organic anatomy and soft neutral lighting.
Layout: ONE square PNG, ideally 2048×2048 or highest useful available resolution. EXACTLY 3 equal columns and 2 equal rows, six equal rectangular cells, no visible borders. True transparent alpha background.
Subjects left to right:
Top-left: one blush pink tulip head, graceful cupped blossom, slightly open, recognizable tulip silhouette.
Top-middle: one lush pale blush pink peony head with many soft irregular ruffled petals.
Top-right: one powder-blue hydrangea cluster, a rounded cluster of small detailed four-petal florets.
Bottom-left: a small elegant ivory-white orchid spray with subtle pink centers, two or three recognizable orchid blooms.
Bottom-middle: one delicate lavender sprig cluster with fine purple flowers and short naturally curved stem, graceful and airy.
Bottom-right: one airy baby's-breath spray, many tiny ivory blossoms on short delicate branching stems.
Every subject is isolated, centered within its own equal grid cell, fitting the central 70% of cell width and 70% of cell height. Leave substantial clear transparent gutters around all four sides of each subject. Every petal and sprig fully visible. No overlap or bleed across equal cell boundaries. Heads and small flower clusters only; no long stems.
Style: lifelike botanical watercolor, intricate petal texture, delicate pigment gradation, rounded organic form, subtle dimensionality, refined romantic stationery quality. Same coherent illumination and visual finish as reference.
Constraints: exactly these six new subjects, no original rose/lily/poppy/sunflower/daisy/violet subjects. No labels, no text, no watermark, no border, no opaque white rectangles, no painted background, no checkerboard. Avoid cartoon, flat vector, thick outlines, stiff geometry, extremely pale invisible blossoms. True transparent background throughout.

### Spacing refinement

Keep the exact six botanical subjects in this atlas unchanged in style, color, details, and position order. Change ONLY their size and spacing: make all six flowers/clusters significantly smaller, about 65% of their current widths and heights. Place each subject centrally within its cell in an exactly 3-column by 2-row square atlas. At 1280px canvas width the invisible columns are x=0..426,426..853,853..1280 and the invisible rows are y=0..640 and y=640..1280. Subject centers should be (213,320),(640,320),(1067,320),(213,960),(640,960),(1067,960). Every subject maximum width 290 pixels on a 1280 canvas, with at least 50px completely transparent space between art and each side of every cell. This is essential because code crops each equal cell. Keep entire heads and short spray stems intact. TRUE TRANSPARENT background, no lines, no text, no background, no checkerboard. Top row pink tulip, pink peony, blue hydrangea. Bottom row ivory orchid spray, lavender spray, ivory baby's breath. Preserve natural watercolor detail and exact colors.

Layout: three equal columns × two equal rows; tulip, peony, hydrangea / orchid, lavender, baby's breath.

