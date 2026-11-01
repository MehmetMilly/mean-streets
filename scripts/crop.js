// Element crops for detail review. node scripts/crop.js <selector> <name>
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });

(async () => {
  const sel = process.argv[2] || '.hero';
  const name = process.argv[3] || 'crop';
  const width = +(process.argv[4] || 400);
  const scheme = process.argv[5] || 'dark';
  const server = await serve();
  const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 3, colorScheme: scheme });
  const p = await ctx.newPage();
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  for (const s of sel.split('|')) {
    const n = name + (sel.includes('|') ? '-' + s.replace(/[^a-z0-9]/gi, '') : '');
    const el = await p.locator(s).first();
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(200);
    await el.screenshot({ path: path.join(OUT, n + '.png') });
    console.log('wrote', n);
  }
  await b.close(); server.close();
})();
