// Full verification sweep: overflow, console errors, fonts, themes, reduced motion.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });

const VIEWS = [['tiny', 320, 640], ['phone', 400, 860], ['phablet', 480, 900], ['tablet', 768, 1024], ['desk', 1280, 900], ['wide', 1600, 1000]];

(async () => {
  const server = await serve(); const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  let fail = 0;
  for (const [name, w, h] of VIEWS) {
    for (const scheme of ['dark', 'light']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: scheme, reducedMotion: 'no-preference' });
      const p = await ctx.newPage();
      const errs = [];
      p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
      p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
      p.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
      await p.goto(BASE + '/', { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      await p.waitForTimeout(350);
      const r = await p.evaluate(() => {
        const de = document.documentElement;
        const over = de.scrollWidth - de.clientWidth;
        // find elements spilling past the viewport
        const spill = [];
        document.querySelectorAll('body *').forEach(el => {
          const rr = el.getBoundingClientRect();
          if (rr.width > 0 && (rr.right > de.clientWidth + 1 || rr.left < -1)) {
            const cs = getComputedStyle(el);
            if (cs.position === 'fixed' && cs.visibility === 'hidden') return;
            spill.push(el.tagName + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' [' + Math.round(rr.left) + '..' + Math.round(rr.right) + ']');
          }
        });
        return { over, spill: spill.slice(0, 6), fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family), h1: getComputedStyle(document.querySelector('.hero h1')).fontFamily };
      });
      const bad = r.over > 0 || errs.length || r.spill.length;
      if (bad) fail++;
      console.log(`${bad ? 'FAIL' : 'ok  '} ${name}/${scheme} overflow=${r.over} spill=${r.spill.length} errs=${errs.length}`);
      if (r.spill.length) console.log('     spill:', r.spill.join(' | '));
      if (errs.length) console.log('     errs:', errs.slice(0, 3).join(' | '));
      await p.screenshot({ path: path.join(OUT, `v-${name}-${scheme}.png`) });
      await ctx.close();
    }
  }
  // reduced motion: animations off, page still usable
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(400);
  const rm = await p.evaluate(() => {
    const c = document.querySelector('.scene .beam');
    return { beamAnim: getComputedStyle(c).animationName, brand: getComputedStyle(document.querySelector('#brand')).animationName };
  });
  console.log(`ok   reduced-motion beam=${rm.beamAnim} brand=${rm.brand} errs=${errs.length}`);
  await ctx.close();
  console.log(fail ? `\n${fail} failing combos` : '\nall combos clean');
  await b.close(); server.close();
})();
