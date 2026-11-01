// Capture cover + level-clear in both schemes, plus deck end screen.
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
    p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await p.goto(BASE + '/', { waitUntil: 'load' });
    await p.evaluate(() => localStorage.setItem('ms2:unlockAll', 'true'));
    await p.reload(); await p.waitForTimeout(400);
    // cover for the spread level (pink world)
    await p.locator('.node[data-i="4"]').click(); await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(OUT, `final-cover-${scheme}.png`) });
    await p.locator('#tomap').click(); await p.waitForTimeout(300);
    // boss cover
    await p.locator('.node[data-i="6"]').click(); await p.waitForTimeout(800);
    await p.screenshot({ path: path.join(OUT, `final-boss-${scheme}.png`) });
    // clear screen via warm-up
    await p.locator('#tomap').click(); await p.waitForTimeout(300);
    await p.locator('.node[data-i="0"]').click(); await p.waitForTimeout(500);
    for (let i = 0; i < 30; i++) {
      if (await p.locator('#fin:not([hidden])').count()) break;
      const opt = p.locator('.card .opt').first();
      if (await opt.count() && await opt.isEnabled().catch(() => false)) { await opt.click(); await p.waitForTimeout(130); }
      const nb = p.locator('.card > .btn');
      if (await nb.count() && await nb.isEnabled().catch(() => false)) { await nb.click(); await p.waitForTimeout(150); continue; }
      if (await p.locator('#next').isEnabled().catch(() => false)) { await p.locator('#next').click(); await p.waitForTimeout(200); }
      if (await p.locator('.card .field').count()) { await p.locator('#skip').click({ timeout: 1500 }).catch(() => {}); await p.waitForTimeout(200); }
    }
    await p.waitForTimeout(1700);
    await p.screenshot({ path: path.join(OUT, `final-clear-${scheme}.png`) });
    console.log(scheme, 'fin=', await p.locator('#fin:not([hidden])').count(), 'errs=', errs.length);
    await ctx.close();
  }
  await b.close(); server.close();
})();
