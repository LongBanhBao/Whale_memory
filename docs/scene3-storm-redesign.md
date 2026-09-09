# Scene 3 — storm and family breakthrough

Scene 3 represents Pastel's difficult period as a physical journey through a
dark, turbulent sea. The large whale repeatedly tries to swim from the lower
left toward the light at the upper right, but hostile currents and submerged
fragments force it back. Family Nhà Cá then arrives as nine smaller whales,
forms a protective school and helps carry the journey through the storm.

The 14-second sequence is deterministic and divided into six phases:

| Progress | Time | Story beat |
| --- | --- | --- |
| `0–.20` | `0–2.8s` | First advance, impact and recoil |
| `.20–.38` | `2.8–5.32s` | Second advance, impact and recoil |
| `.38–.54` | `5.32–7.56s` | Third advance and deepest recoil |
| `.54–.64` | `7.56–8.96s` | Nine family whales converge around the protagonist |
| `.64–.88` | `8.96–12.32s` | The formation advances and expels every obstacle |
| `.88–1` | `12.32–14s` | The destination opens into a full-screen light wipe |

Six obstacles turn online pressure into visible pieces of the sea: `LỜI NÓI TOXIC`,
`ÁP LỰC`, `SO SÁNH`, `TIN ĐỒN`, `MỆT MỎI` and `TỰ NGHI NGỜ`. They travel
against the whale, lock into its route during the struggle, then break apart
and leave the viewport after the family formation reaches them. Rain,
lightning, rough wave contours, foam, drifting debris and changing color grade
support the action without replacing its narrative beats.

The scene-2 handoff preserves one continuous animal. Its final journey pose is
animated for 1.35 seconds toward the storm entry pose at the lower left while a
dark water veil rises. The storm sprite is snapped to the same destination
before the renderers swap, avoiding a visible jump in position, size or heading.
Mobile uses a slightly deeper, safer entry and a tighter diagonal route.

At the destination, a cyan-white beacon expands from the upper right into a
`175vmax` light field. The wipe remains above both scenes while scene 4 opens,
then fades away there, so the bright ending of the storm becomes the first
light of the finale instead of a hard cut.

`public/assets/scene/storm-ocean-v1.webp` is the AI-generated background for
this scene, optimized as a 1672 × 941 WebP. Its direction is a cinematic
underwater storm with deep navy water, layered cloud and wave depth, restrained
violet-cyan light and a clear diagonal route for the whale. Lightning, rain,
obstacles, family whales and the final beacon remain code-native layers so their
timing, responsive layout and reduced-motion state stay controllable.
