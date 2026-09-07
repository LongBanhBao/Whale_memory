# Memory frames and gate swimming

Reference: `../LK/XRW.png`, unchanged. The portrait rim is separate from the
central vortex, with an open center and thin foamy water ribbons matching the
four portrait borders in the reference.

Asset: `public/assets/scene/memory-water-rim.webp`, 768 × 768, real alpha verified.
Created with the built-in imagegen tool, converted to WebP with Sharp.
Original outputs remain in Codex generated_images; no source image is overwritten.

Generation prompt:

> Use case: stylized-concept. Reference image XRW.png: match ONLY the water borders surrounding its four portraits, not the central whirlpool. Create ONE empty round portrait frame made of flowing translucent turquoise and cobalt water, white delicate frothy edges, wispy splash ribbons curling clockwise and a few tiny bubbles. Huge clear empty center taking 76 percent of the outer diameter, narrow irregular watery rim. Absolutely no people, no portrait, no background scenery, no inward spiral filling the center, no text. Front-on centered circular frame fully visible, square composition, high-detail illustrated style matching XRW. Genuinely transparent alpha both in the empty center and outside the watery border. Soft luminous cyan edging, elegant organic water volume rather than a neon circle.

Final background-extraction prompt (the first output had a painted checkerboard):

> Use case: background-extraction. Edit target: the supplied single watery portrait frame. Remove ALL white and gray checkerboard background pixels inside and outside the ring. Deliver actual transparent alpha, NOT an illustration of transparency. Keep only the blue/cyan water, white foam edges attached to the water, and bubbles. Preserve exactly the existing ring design, clear center, composition and dimensions. No replacement background, no checkerboard, no new objects.

## Motion

Scene 2 lasts 27 seconds. Gate centers occur at 4.5, 13.5 and 22.5 seconds,
leaving nine seconds per swimming cycle. Cruise height is 64% from the top; crossing
height is 48%. The whale rises smoothly before each gate, crosses at the top of
one continuous arc, then starts diving as its body passes through. Steering
bends lag behind the head; the mesh adds a travelling body wave, stronger fluke strokes
and a delayed pectoral stroke during ascent/descent. Scene 1 retains its default
swim parameters, and reduced motion still bypasses the animated journey.

Every gate uses the same tail-clear delay and fade curve, including the last.
The final gate keeps travelling (no capped camera progress), clears at 24.9
seconds, then the final return ends at 27 seconds. The WebGL swim loop remains
active after the scene timeline completes. Tests cover phase continuity, three
low/high cycles, gate fade ordering, desktop/mobile and final live mesh.
