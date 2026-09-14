# DESIGN.md — DocLens landing

## Visual world (niche: archival darkroom)
Warm archival paper (`#FAF6EF`/`#F3EDE1`), deep espresso ink (`#1C1410`
family), single burnt-orange scan-lamp accent (`#C2410C`). Georgia display,
system sans body, mono for real measurements only. Paper-sheet cards with
stacked edges, stamp badges, lamp hairline rules. Single light theme.

## Landing composition
1. Sticky archival top bar (64px) with aperture mark and lamp gradient hairline.
2. Asymmetric split hero: headline with lamp highlight mark, 19-word subtext,
   one primary plus one anchor CTA. Right: 3D-tilting scan photograph with the
   lamp scanbeam sweeping the real photo (the authored moment) and a
   functional caption below.
3. Glance strip: three hairline-divided facts.
4. Features bento (6 cells): wide photo cell, standard cells, wide export
   cell with photo. Lamp hairline rules divide sections.
5. Pipeline as a connected six-stage filmstrip (distinct family, sequence
   numbers carry real order information).
6. FAQ, paper final CTA, archival footer.

## Motion (one authored moment)
The scanbeam over the hero photograph. Supporting: pointer tilt, lamp orb
drift. Scroll reveal elsewhere. All gated by `prefers-reduced-motion`.

## Hard rules honored
Zero em/en dashes. No kickers, eyebrows, or poetic section labels. No fake
scan UI, no faux text lines, no pills overlaid on images. Content-matched
photography (signing documents, desk pages, archive shelves) with captions.
