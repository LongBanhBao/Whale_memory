# Unobscured portrait composition

The approved PRW artwork, common −22° / 0.62 perspective, 30-second journey,
whale animation and scene controls are unchanged.

The previous portrait orbit was nested inside the rear portal layer (z8),
below both the whale (z30) and every near water lip (z35). A dedicated memory
layer (z36) now holds one synchronized portrait plane per gate. Its position,
scale, fade, recall and current remain tied to that gate, while the original
rear/whale/near ordering still makes the whale pass through the water.

Portrait centers sit at radius56 rather than51, with slightly smaller frames.
This reserves the middle for swimming and lets only the outer water edges meet.
The foreground PRW mask has a wider clear opening so it does not wash over faces.
Mobile gate width is78vw (previously86vw), leaving room for the outer portraits.

Browser tests check all four portrait centers at each of the three passages,
including viewport bounds, real hit-test occlusion against the near water lip
and whale, and synchronized transforms on desktop and mobile.
