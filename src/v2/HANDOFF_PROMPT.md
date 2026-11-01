# Prompt: finish and publish v3 of "Mean Streets"

You're picking up a half-finished redesign of "Mean Streets", an interactive STAT 1050 (Lectures 4+5: mean/median/mode, grouped tables, range/variance/SD/CV) study game for Mohammad. He's cramming for a midterm tomorrow, so be fast and precise. Tone with him: casual, friendly, a bit of light roasting. Be straight when he's wrong.

## What he said (this is the brief)
- v1 was a risograph zine page; he hated the font, the "sloppy dark purple" look, the crammed layout and that it was static.
- v2 (the current live version) is a game with a level map, one card at a time and a level-clear screen. His latest reaction: "this looks so ass, tf is this classic ass font ... make the entire thing even more polished with more care and custom designs ... an amazing experience."
- He also screenshotted a bug: on the map, the finished Warm-up node renders as a tall dark panel stretched over the page header. Cause: the node state class `done` collides with the full-screen overlay class `.done`. Rename them (see step 2).
- He suspects the page wasn't using Vercel's Geist font at all. Whether or not it loaded on his device, the plan is to move off Geist Sans. Do NOT use Geist Sans or Inter-like fonts. NO purple anywhere.
- He loves: animations, game feel, sound, visuals, easter eggs, ADHD-friendly pacing, premium craft. He is detail-obsessed about design.

## Files (all in /home/claude/stat/l45/, attached to this message if the container is gone)
- `v2_template.html`: HTML + CSS skeleton with `/*__FONTS__*/` and `/*__JS__*/` placeholders.
- `v2.js`: all game logic and the VERIFIED content (problems, decks, levels). Do not change any answers, numbers or question content. They are code-checked (`calc.py`).
- `mean-streets.html`: the built v2 (live).
- `v3_add.css`: new design layer, already written, not yet wired in. Append it before `</style>`.
- `v3_add.js`: WORLD colours, ARTS emblems, ARTSVG(), LOCK, setWorld(), coverCard(). Insert it into v2.js right before the `/* ---------- map ---------- */` comment (after `const L=[...]`).
- Live artifact URL (republish to the SAME url): https://claude.ai/artifact/TUbpZAhirnpsBt8nDTtYLJ. If the local files are missing, fetch the page with the Artifact tool's read action and work from that.

## Fonts (embed as base64 @font-face, because the artifact CSP only allows Google Fonts stylesheets and inline data)
- Display + body: Bricolage Grotesque variable. `npm i @fontsource-variable/bricolage-grotesque`, then use `files/bricolage-grotesque-latin-standard-normal.woff2` (axes opsz 12-96, wght 200-800, wdth 75-100). Declare `font-family:"Bricolage Grotesque"; font-weight:200 800; font-stretch:75% 100%`. Headlines use `font-variation-settings:"wdth" 78-86,"opsz" 80-96` and weight 800.
- Numbers/labels: Geist Pixel VARIABLE (`GeistPixelVF.woff2` from npm package `geist` 1.9.0, in dist/fonts/geist-pixel/). It has an ELSH axis (0-100) that morphs the pixel shape (square -> round). The v3 CSS animates it on the wordmark, level labels and "LEVEL CLEAR". Check in a screenshot that it looks good; if the morph looks bad, pin it to a fixed value.
- Formulas: Geist Mono variable (`GeistMono-Variable.woff2`).
- The Bricolage "latin" subset lacks Greek and some symbols (σ Σ x̄ √ →). They fall back to system fonts, which is fine, but check that nothing looks broken.

## Steps
1. Build `v3_template.html` from `v2_template.html`:
   - Set `--sans:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif`; `--pixel:"Geist Pixel","Geist Mono",monospace`; keep `--mono`.
   - In the CSS only, replace `var(--gold-2)` with `var(--w2)`, `var(--gold)` with `var(--w)`, `var(--gold-soft)` with `var(--w-soft)`. (v3_add.css defines `--w` etc. per element from `--wh`, and re-asserts true gold for stars/XP/mean-colour: `.pill .g`, `.stars`, `.g`, `.combo`, `.st.m b`, `.bigstars`.)
   - Append `v3_add.css` before `</style>`.
2. Fix the class collision. CSS: `.node.done` becomes `.node.won`; `.done{position:fixed...}` becomes `.fin{...}`; `.done-in` becomes `.fin-in`. HTML: `<div class="done" id="done" hidden>` becomes `<div class="fin" id="fin" hidden>`. JS: node class `'done'` becomes `'won'`; both `$('#done')` become `$('#fin')`; `class="done-in"` becomes `class="fin-in"`. NOTE: the JS variable `done` (the progress object) stays as is.
3. HTML additions:
   - Hero scene right after the `<h1>`: an inline `<svg class="scene" viewBox="0 0 400 140">` with a dotted ground line at y=112; a gold triangle fulcrum `200,88 184,112 216,112`; a `<g class="beam">` containing a rounded beam rect (x=40 y=80 w=320 h=8) and 8 dots r=9 sitting at y=71 with x = 60, 95, 130, 170, 230, 270, 305, 340 (their mean is exactly 200, i.e. balanced on the fulcrum; alternate ink and gold fills); and a small pixel-font `.cap` text "THE MEAN IS WHERE IT BALANCES" at y=134. CSS for `.scene .beam` rocking is already in v3_add.css.
   - In `.sbar-row`, before `.ttl`: `<span class="emb" id="sEmb"></span>`.
4. JS patches in v2.js (insert v3_add.js first):
   - `openLevel`: call `setWorld(L[i].id)`; set `$('#sEmb').innerHTML=ARTSVG(L[i].id)`; build the segs from `steps.slice(1)` (step 0 is the new cover).
   - `segs()`: use `c=SI-1` for on/now.
   - `renderStep`: add a branch before the learn/toy branch: `if(st.t==='cover'){coverCard(card,L[LV])} else if(...)`. On the cover set the next button text to "Start level".
   - `toMap`: call `setWorld(null)`.
   - `renderMap`: node html gets `style="--wh:${WORLD[l.id]};left:..;top:.."`; orb content `${unlocked(i)?ARTSVG(l.id):LOCK}<i class="no">${l.n}</i>`; the current node gets `<span class="flag">GO</span>`; add 6 decorative `<span class="gl">` glyphs (x̄ σ Σ s² % n) at left/right edges between the nodes; keep the existing progress path.
   - `complete()`: replace the old medal markup with a custom SVG medal (gradient circle in `--w2`/`--w`, dashed inner ring, the level's emblem inside via `<g>` with `color:#1A1206`) and add `<div class="rays"></div>` as the first child of `.fin-in`.
   - `cols()` (confetti colours): read `--wh` (plus a lightened variant), not `color-mix` values.
   - localStorage prefix stays `ms2:` so his progress, XP and slip report persist.
5. Fonts: build a Python script that base64-embeds the three fonts into `/*__FONTS__*/` and the JS into `/*__JS__*/`, writing `mean-streets.html`. Keep a backup of the v2 file as `mean-streets-v2.html`.
6. Test with Playwright (Chromium is preinstalled, `require('playwright')`): 400px phone width and desktop; dark and light themes; no horizontal overflow; no console errors; screenshot and LOOK at: map (check a finished node is a normal orb now, not a stretched panel), a level cover, a lesson card, a quick check, a solo problem, a level-clear screen. Update the old playthrough scripts (t2.js/t3.js/t4.js) for the extra cover step. Check the pixel-font morph, the emblems (the `throw` loop-arrow path may need tweaking), the hero beam animation, and that `prefers-reduced-motion` still works.
7. Republish to the same artifact URL (do not create a new one). Don't paste the URL in chat, since the app shows a card. Tell him in 1-2 sentences what changed. Mention that the box bug is fixed.

## Don't
- Don't touch problem content, answers or the 5 easter eggs (the logo tap is one; keep it working).
- Don't use purple, Inter, Geist Sans, or generic AI-looking gradients.
- Don't start unrequested rebuilds beyond this.

## After publishing
He'll play through and send notes + the in-app "report" (pasted slips). Log them in his Mistakes Log, then build weak-spot practice and the Sunday-night old-midterm mock exams (no hints, review mistakes only after).
