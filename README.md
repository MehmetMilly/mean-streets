# Mean Streets

STAT 1050 (Lectures 4 + 5) as a game. Mean/median/mode, grouped tables, range/variance/SD, and CV — nine levels, one card at a time.

Live: https://mean-streets.vercel.app

## Shape

```
src/          hand-edited source
  fonts.css   @font-face for the three faces
  base.css    layout + game chrome (from v2)
  v3.css      the design layer (world colours, map road, covers, clear screen)
  game.js     all game logic + verified problem content
  page.html   the shell
scripts/
  build.js    assembles src/ -> public/ (node only, runs on Vercel)
  verify.js   overflow / console / theme / reduced-motion sweep
  walk.js     plays a level and screenshots every card type
  solve.js    answers a problem correctly and checks XP + slips
  interact.js resize, easter eggs, reset
public/       build output — do not edit by hand
```

`node scripts/build.js` then `npx serve public` (or `npm run shoot`) to look at it.

## Type

- **Bricolage Grotesque** — display and body. Headlines run `wdth 78–86, opsz 80–96` at weight 800.
- **Geist Pixel (variable, `ELSH` axis)** — the wordmark, level numbers, badges. The axis is a *loop*: 0 and 100 render identically, so a 0→100 animation cycles seamlessly.
- **Geist Mono** — numbers, formulas, and the Greek/math glyphs that Bricolage's latin subset lacks.

Fonts are self-hosted `woff2`, preloaded, and cached immutably. Nothing is fetched from Google.

## Content is checked, not written from memory

Every answer in `game.js` was verified against the lecture material. Don't retype numbers — if a problem needs to change, recompute it.

## Progress

`localStorage` under the `ms2:` prefix, so the v2 save (XP, stars, slip report) carries over. Nothing leaves the device.
