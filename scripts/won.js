// Regression: a completed node must look like an orb, not a full-page panel.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });
(async () => {
  const server = await serve(); const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  for (const scheme of ['dark', 'light']) {
    const ctx = await b.newContext({ viewport: { width: 400, height: 880 }, deviceScaleFactor: 2, colorScheme: scheme });
    const p = await ctx.newPage();
    const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/', { waitUntil: 'load' });
    // simulate prior progress: warm-up + level 1 cleared
    await p.evaluate(() => {
      localStorage.setItem('ms2:done', JSON.stringify({ warm: { stars: 3 }, avg: { stars: 2 } }));
      localStorage.setItem('ms2:xp', '520');
    });
    await p.reload(); await p.waitForTimeout(700);
    const geo = await p.evaluate(() => {
      const n = document.querySelector('.node[data-i="0"]');
      const orb = n.querySelector('.orb').getBoundingClientRect();
      const cs = getComputedStyle(n.querySelector('.orb'));
      const tag = n.querySelector('.tag').getBoundingClientRect();
      return { cls: n.className, orbW: Math.round(orb.width), orbH: Math.round(orb.height), bg: cs.backgroundImage.slice(0, 40), tagW: Math.round(tag.width), pos: cs.position };
    });
    console.log(scheme, JSON.stringify(geo), 'errs', errs.length);
    // the old bug: node must not be position:fixed / full viewport
    const bad = geo.pos === 'fixed' || geo.orbW > 200;
    console.log(scheme, bad ? 'FAIL: won node is stretched' : 'ok: won node is a normal orb');
    await p.screenshot({ path: path.join(OUT, `won-${scheme}.png`) });
    await p.locator('.node[data-i="3"]').scrollIntoViewIfNeeded();
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(OUT, `won-${scheme}-mid.png`) });
    await ctx.close();
  }
  await b.close(); server.close();
})();
