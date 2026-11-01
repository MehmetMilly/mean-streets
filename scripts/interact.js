// Resize + interaction sanity checks.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });
(async () => {
  const server = await serve(); const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(400);

  // 1. resize re-lays the map without overflow
  for (const w of [400, 900, 340, 1280, 400]) {
    await p.setViewportSize({ width: w, height: 860 });
    await p.waitForTimeout(320);
    const r = await p.evaluate(() => {
      const de = document.documentElement, map = document.querySelector('#map');
      const svg = map.querySelector('svg');
      const firstNode = map.querySelector('.node');
      return { over: de.scrollWidth - de.clientWidth, svgW: svg ? svg.getBoundingClientRect().width : 0, mapW: map.clientWidth, nodeL: firstNode ? Math.round(firstNode.getBoundingClientRect().left) : -1 };
    });
    console.log(`resize ${w}: overflow=${r.over} svgW=${Math.round(r.svgW)} mapW=${Math.round(r.mapW)} nodeL=${r.nodeL}`);
  }

  // 2. logo easter egg still works (5 taps) and doesn't break layout
  for (let i = 0; i < 5; i++) { await p.locator('#brand').click(); await p.waitForTimeout(80); }
  const egg = await p.evaluate(() => ({ eggs: JSON.parse(localStorage.getItem('ms2:eggs') || '{}'), ach: document.querySelectorAll('#ach .got').length }));
  console.log('logo egg:', JSON.stringify(egg));

  // 3. konami easter egg
  await p.evaluate(() => { for (const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a']) window.dispatchEvent(new KeyboardEvent('keydown', { key: k })); });
  await p.waitForTimeout(300);
  console.log('konami:', await p.evaluate(() => ({ outlier: document.body.classList.contains('outlier'), eggs: Object.keys(JSON.parse(localStorage.getItem('ms2:eggs') || '{}')) })));

  // 4. unlock-all then open/close a level, progress persists
  await p.locator('#unlock').click(); await p.waitForTimeout(200);
  await p.locator('.node[data-i="2"]').click(); await p.waitForTimeout(500);
  await p.locator('#tomap').click(); await p.waitForTimeout(400);
  console.log('roundtrip map visible:', await p.locator('#mapv').isVisible(), 'stage hidden:', await p.locator('#stagev').isHidden());

  // 5. reset works
  await p.locator('#reset').click(); await p.waitForTimeout(100);
  await p.locator('#reset').click(); await p.waitForTimeout(900);
  console.log('after reset xp:', await p.evaluate(() => localStorage.getItem('ms2:xp')));
  console.log('ERRORS:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
