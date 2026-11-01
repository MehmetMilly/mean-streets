#!/usr/bin/env node
/* Assemble src/ into public/. Runs on Vercel's build image (node only, no python). */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'public');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');
const write = (f, s) => { const p = path.join(OUT, f); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };

const css = read('fonts.css') + '\n' + read('base.css').trimEnd() + '\n\n' + read('v3.css');
const js = read('game.js');

write('assets/app.css', css);
write('assets/app.js', js);

// index.html: src/page.html with a cache-busting hash on its two assets
const crypto = require('crypto');
const h = (s) => crypto.createHash('sha1').update(s).digest('hex').slice(0, 8);
write('index.html', read('page.html')
  .replace('/assets/app.css', `/assets/app.css?v=${h(css)}`)
  .replace('/assets/app.js', `/assets/app.js?v=${h(js)}`));

// static passthroughs
for (const f of ['icon.svg']) {
  const from = path.join(ROOT, 'assets', f);
  write('assets/' + f, fs.readFileSync(from));
}
for (const f of fs.readdirSync(path.join(ROOT, 'assets/fonts'))) {
  write('assets/fonts/' + f, fs.readFileSync(path.join(ROOT, 'assets/fonts', f)));
}

const kb = (f) => (fs.statSync(path.join(OUT, f)).size / 1024).toFixed(1) + 'kb';
console.log(`built: app.css ${kb('assets/app.css')} · app.js ${kb('assets/app.js')} · index.html ${kb('index.html')}`);
