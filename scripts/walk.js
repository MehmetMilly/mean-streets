// Walk one level and screenshot every distinct card.
// node scripts/walk.js <levelIdx> [viewportWidth] [scheme]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
fs.mkdirSync(OUT, { recursive: true });
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });

const kindOf = (p) => p.evaluate(() => {
  const c = document.querySelector('#cardhost .card');
  if (!c) return document.querySelector('#fin:not([hidden])') ? 'fin' : 'none';
  if (c.classList.contains('cover')) return 'cover';
  if (c.querySelector('.dtop')) return 'deck';
  if (c.querySelector('.opts')) return 'check';
  if (c.querySelector('.fields')) return 'prob';
  if (c.querySelector('#toyhost')) return 'toy';
  if (c.querySelector('.formula')) return 'learn-formula';
  return 'learn';
});

(async () => {
  const lvl = +(process.argv[2] || 0);
  const W = +(process.argv[3] || 400);
  const scheme = process.argv[4] || 'dark';
  const server = await serve();
  const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: 880 }, deviceScaleFactor: 2, colorScheme: scheme });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.evaluate(() => localStorage.setItem('ms2:unlockAll', 'true'));
  await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(() => document.fonts.ready);
  await p.locator(`.node[data-i="${lvl}"]`).click();
  await p.waitForTimeout(700);

  const seen = {}; let shot = 0;
  for (let i = 0; i < 90; i++) {
    const k = await kindOf(p);
    if (k === 'fin') { await p.waitForTimeout(1500); await p.screenshot({ path: path.join(OUT, `${scheme}-L${lvl}-${String(++shot).padStart(2, '0')}-fin.png`) }); console.log('reached fin'); break; }
    if (k === 'none') break;
    seen[k] = (seen[k] || 0) + 1;
    if (seen[k] <= 2) { await p.waitForTimeout(420); await p.screenshot({ path: path.join(OUT, `${scheme}-L${lvl}-${String(++shot).padStart(2, '0')}-${k}.png`) }); }
    // one step forward
    if (k === 'check') {
      const dis = await p.locator('.card .opt').first().isDisabled().catch(() => false);
      if (!dis) { await p.locator('.card .opt').first().click(); await p.waitForTimeout(220); }
      await p.locator('#next').click(); await p.waitForTimeout(380);
    } else if (k === 'deck') {
      const opt = p.locator('.card .opt').first();
      if (await opt.count() && await opt.isEnabled().catch(() => false)) { await opt.click(); await p.waitForTimeout(140); }
      const nb = p.locator('.card > .btn');
      if (await nb.count() && await nb.isEnabled().catch(() => false)) { await nb.click(); await p.waitForTimeout(160); }
      else if (await p.locator('#next').isEnabled().catch(() => false)) { await p.locator('#next').click(); await p.waitForTimeout(360); }
    } else if (k === 'prob') {
      const n = await p.locator('.card .field').count();
      for (let j = 0; j < n; j++) {
        const f = p.locator('.card .field').nth(j);
        if (await f.locator('input').count()) await f.locator('input').fill('1');
        else await f.locator('select').selectOption({ index: 1 });
      }
      await p.locator('.card [data-a=chk]').click(); await p.waitForTimeout(300);
      await p.locator('#next').click(); await p.waitForTimeout(380);
    } else {
      if (await p.locator('#next').isEnabled().catch(() => false)) { await p.locator('#next').click(); await p.waitForTimeout(400); }
      else break;
    }
  }
  console.log('kinds seen:', JSON.stringify(seen));
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
