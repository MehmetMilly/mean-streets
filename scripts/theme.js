// Theme toggle correctness.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });
(async () => {
  const server = await serve(); const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.waitForTimeout(400);
  const read = () => p.evaluate(() => ({
    attr: document.documentElement.getAttribute('data-theme'),
    bg: getComputedStyle(document.body).backgroundColor,
    label: document.querySelector('.thm').getAttribute('aria-label'),
    meta: document.querySelector('meta[name=theme-color]').content,
  }));
  console.log('initial (os dark):', JSON.stringify(await read()));
  await p.locator('.thm').click(); await p.waitForTimeout(400);
  console.log('after toggle:', JSON.stringify(await read()));
  await p.screenshot({ path: path.join(OUT, 'theme-light-toggled.png') });
  await p.reload(); await p.waitForTimeout(500);
  console.log('after reload (persisted):', JSON.stringify(await read()));
  await p.locator('.thm').click(); await p.waitForTimeout(400);
  console.log('toggled back:', JSON.stringify(await read()));

  // a light-mode level must still be readable
  await p.locator('.node[data-i="0"]').click(); await p.waitForTimeout(600);
  await p.locator('#next').click(); await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(OUT, 'theme-stage.png') });
  console.log('ERR:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
