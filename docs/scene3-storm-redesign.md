# Scene 3 — storm and family breakthrough

Scene 3 represents Pastel's difficult period as a physical journey through a
violent open sea. The large whale repeatedly tries to swim from the lower left
toward the light at the upper right, but hostile currents and submerged
fragments force it back. The slower pacing leaves room for the whale's fatigue
and sadness to register before Family Nhà Cá arrives, forms a protective school
and helps carry the journey through the storm.

## Timeline

The 24-second sequence is deterministic and divided into eight phases:

| Progress | Time | Story beat |
| --- | --- | --- |
| `0–.08` | `0–1.92s` | The whale settles into the lower-left storm entry |
| `.08–.225` | `1.92–5.4s` | First advance, impact and recoil |
| `.225–.37` | `5.4–8.88s` | Second advance, impact and recoil |
| `.37–.52` | `8.88–12.48s` | Third advance and deepest recoil |
| `.52–.585` | `12.48–14.04s` | Fatigue trough; the whale visibly droops and grieves |
| `.585–.735` | `14.04–17.64s` | Eighteen family whales swim in from the left and assemble in three waves |
| `.735–.95` | `17.64–22.8s` | The formation advances and expels every obstacle |
| `.95–1` | `22.8–24s` | Contact with the destination immediately triggers the light wipe |

Six obstacles turn online pressure into large extruded words floating directly
in the sea: `TOXIC`, `ÁP LỰC`, `BẾU`, `MỆT MỎI`, `SO SÁNH` and `TỰ NGHI NGỜ`.
There are no backing cards or captions. The words travel against the whale,
lock into its route during the struggle, then break apart and leave the viewport
after the family formation reaches them. Desktop renders all 18 companions around
and behind the protagonist; mobile keeps the first 12 visible to preserve the
diagonal route and legibility. Every companion enters from outside the left edge,
follows a curved lane into formation and carries a staggered “Hu raaaaa” speech
bubble until the protagonist touches the light.

## Whale renderer and expression

The storm whale no longer advances a GIF-like sprite sheet. It samples the
existing static transparent whale still onto a `58 × 36` WebGL mesh. The vertex
shader sends an asymmetric travelling wave through the body, folds the flukes,
delays the pectoral-fin beat and changes posture for effort, impact, fatigue and
hope. The fragment shader adds a restrained downturned brow, half-lidded eye and
tear during the lonely section, then dissolves those marks into a soft cyan aura
as the family arrives. Browsers without WebGL use a Canvas 2D fallback based on
the same still and emotional pose values; neither path requests the storm sprite.

## Layered storm

`public/assets/scene/storm-ocean-v2.webp` is the AI-generated base environment,
optimized as a 1672 × 941 WebP. It shows the underside of a violently churning
ocean surface, with a dark but readable lower-left start and a pale cyan opening
at the upper right. Two offset background echoes, surface churn, five cloud
masses and five rough-water contours create parallax depth around that route.

The weather remains code-native and independently controllable: far, mid and
near rain planes; foreground spray; distant and near branching lightning;
full-field sheet flashes; foam, currents and debris. Storm intensity gradually
clears during the breakthrough while impact pulses add short camera shake. This
separation keeps the narrative timing deterministic and lets reduced-motion
render a complete, calm end state without decorative weather animation.

## Scene handoffs

The scene-2 handoff preserves one continuous animal. Its final journey pose is
animated for 1.6 seconds toward the storm entry pose while a circular current
reveals the actual storm texture. There is no black veil or full-screen darkening.
The procedural storm whale is snapped to the same destination before the
renderers swap, avoiding a visible jump in position, size or heading. The reveal
current then fades over 0.72 seconds. Mobile uses a slightly deeper, safer entry
and a tighter diagonal route.

At the destination, a cyan-white beacon expands from the upper right into a
`175vmax` light field. Its easing is front-loaded at the contact frame, removing
the former pause between arrival and glare. The wipe remains above both scenes
while scene 4 opens, then fades away there, so the bright ending of the storm
becomes the first light of the finale instead of a hard cut.
