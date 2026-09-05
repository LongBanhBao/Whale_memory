# Scene 2 — water-memory journey

Reference: `../LK/RingWater.png` (unchanged). Its blue underwater ruins,
surface rays and receding whirlpool tunnel guide the scene. The whale in the
reference is removed from the background to avoid a second, static animal.

Background generated with the built-in imagegen tool, then converted with Sharp
to `public/assets/scene/journey-background.webp` (1536 × 1024). Original generated
PNG remains in Codex's generated_images directory; no user source is overwritten.

Final prompt:

> Use case: precise-object-edit. Edit target: attached RingWater.png. Create a clean background plate for an animated underwater website. Remove the whale and ALL bright circular water vortex rings in the center, seamlessly reconstruct the blue underwater canyon behind them. Preserve the original luminous turquoise surface light rays, ancient submerged stone ruins along both sides and bottom, deep cobalt and cyan palette, dreamy detailed illustrated style. Keep the middle as open blue water with subtle distant particles so a separately animated whale and portals can be composited there. No animals, no rings, no text, no new objects. Landscape 1536x1024 composition extending the existing underwater environment to the sides.

The three water gates are code-native animated filaments, split into rear and
foreground lips. Each carries four different existing optimized Picture assets:
p01–p04, p05–p08, p09–p12. No dates or new narrative copy are added.

The existing scene-1 WebGL whale stays mounted during the 2.5-second retreat and
background dissolve, then moves into scene 2 without restarting its swim phase.
Steering adds a tail-weighted bend while preserving scene 1's default deformation.
The 24-second journey finishes at x55%, y49%, scale1, rotation−9°, matching scene 1.
Reduced-motion mode goes directly to the resting pose; the next button remains
the only way to switch scenes. Replay cancels both scene and transition timelines.

## Water-ring refinement

The ring now uses 28 curved SVG currents and 40 small foam droplets, with
refraction and translucent water shading instead of concentric CSS borders.
The perspective plane stays at −22° / 0.62 horizontal scale throughout passage.
Complementary near/far halves use the same progress-driven current angle and
opacity, so the foreground no longer disappears early and reverses the apparent
entrance. Camera depth follows a continuous exponential scale; the entire ring
drifts left/down and dissolves without reversing. Photos sit on the projected rim
with soft water masks and highlights, without rectangular card backgrounds.
No additional raster generation was used for this refinement.
