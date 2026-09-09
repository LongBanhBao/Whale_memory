# Scene 2 — memory-current redesign

Scene 2 now treats each gate as one chapter of the journey rather than a
central vortex surrounded by four detached cards. The four photographs are
small, borderless memory silhouettes embedded directly in the outer current.
Their shared orbit, restrained water rim and chapter
label make each group read as a single passage through remembered moments.

The portrait frames are removed completely. Every portal loads four curated
Pastel sources directly from `Picture/`: `[p01,p13,p03,p14]`,
`[p15,p16,p07,p08]` and `[p17,p19,p11,p12]`. Sources with a hidden face,
rectangular crop or edge-heavy composition are excluded. Original aspect ratios
are preserved with `object-fit: contain`. Intersecting vertical and horizontal
fades keep the complete head in the clear core, dissolve side cuts, and make
feet/lower body disappear before a source edge can show. No ring-wide mask or
half-plane clip is allowed to cut a portrait.

The four asymmetric anchors share the radius of the drawn current. Their
positions inherit the gate perspective, while a local inverse transform keeps
faces upright and restores their natural width after the oval projection.
Subtle phase-offset floating and breathing prevent the arrangement from feeling
static. Curved pearl/teal ripples
are masked inside each photograph, while a restrained foreground copy of the
real current crosses it and remains clipped by the vortex alpha. Each memory
therefore surfaces from the water without an oval plate or independent halo.
The two far-side memories sit behind the whale while the two near-side memories
share the foreground rim, so
all four feel printed into one volume of moving water. There is no independent
ring, border, plate or numbered marker around a memory.

The new `public/assets/scene/memory-vortex-v2.webp` texture uses a transparent
center and exterior, layered navy/teal water and quieter cyan highlights. It was
created with the built-in image generation tool, then optimized to 1024 × 1024
WebP with alpha preserved. The previous texture remains available and unchanged.

Final prompt:

> Use case: style-transfer. Asset type: transparent circular water-vortex
> texture for scene 2 of an immersive tribute website. Redesign the referenced
> bright vortex into a refined underwater memory-current ring that visually
> belongs in a deep cinematic ocean. Preserve a large fully open transparent
> center so a whale can swim through it. Use layered translucent water ribbons,
> fine foam, tiny bubbles, soft caustic glints and faint pearl-like memory
> sparks. Use midnight navy, petrol blue, muted cyan and pale aqua highlights;
> substantially less electric-blue saturation. The mood is calm, nostalgic and
> hopeful. Actual transparent background and center; no people, photographs,
> animals, architecture, text, symbols or watermark.

Whale motion follows a continuous sine path. The three upper bounds meet the
vortexes at 4, 12 and 20 seconds; the lower bounds settle at 8, 16 and 24
seconds. From the third lower bound, the last quarter-wave rises to the exact
final pose of scene 1 at 28 seconds. Rotation, bend, effort and wake derive
from sine velocity, so each ascent, crest, dive and recovery flows without an
artificial hold. Tests cover all extrema and path continuity.
