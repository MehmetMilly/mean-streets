// Screenshot harness: node scripts/shoot.js [scenario...]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

function serve(port) {
  return new Promise(res => {
    const s = http.createServer((req, rp) => {
      let f = req.url.split('?')[0];
      if (f === '/') f = '/index.html';
      const fp = path.join(ROOT, f);
      fs.readFile(fp, (e, d) => {
        if (e) { rp.writeHead(404); return rp.end('nope'); }
        rp.writeHead(200, { 'content-type': TYPES[path.extname(fp)] || 'application/octet-stream' });
        rp.end(d);
      });
    }).listen(port, () => res(s));
  });
}

const OUT = path.join(__dirname, '..', '.shots');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const server = await serve();
  const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const errs = [];

  async function mk(opts = {}) {
    const ctx = await b.newContext({
      viewport: opts.viewport || { width: 400, height: 860 },
      deviceScaleFactor: 2,
      colorScheme: opts.scheme || 'dark',
      reducedMotion: opts.rm ? 'reduce' : 'no-preference',
    });
    const p = await ctx.newPage();
    p.on('console', m => { if (m.type() === 'error') errs.push(opts.tag + ' :: ' + m.text()); });
    p.on('pageerror', e => errs.push(opts.tag + ' :: PAGEERROR ' + e.message));
    await p.goto(BASE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(450);
    return p;
  }

  const want = process.argv.slice(2);
  const on = (n) => !want.length || want.includes(n);

  if (on('map4')) {
    const p = await mk({ tag: 'map4' });
    await p.screenshot({ path: path.join(OUT, 'map-400.png'), fullPage: false });
    await p.screenshot({ path: path.join(OUT, 'map-400-full.png'), fullPage: true });
    console.log('map4 ok');
    await p.context().close();
  }

  if (on('mapd')) {
    const p = await mk({ tag: 'mapd', viewport: { width: 1280, height: 900 } });
    await p.screenshot({ path: path.join(OUT, 'map-1280.png') });
    await p.screenshot({ path: path.join(OUT, 'map-1280-full.png'), fullPage: true });
    console.log('mapd ok');
    await p.context().close();
  }

  if (on('light')) {
    const p = await mk({ tag: 'light', scheme: 'light' });
    await p.screenshot({ path: path.join(OUT, 'map-light.png') });
    await p.context().close();
  }

  if (on('cover')) {
    const p = await mk({ tag: 'cover' });
    await p.locator('.node[data-i="0"]').click();
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(OUT, 'cover.png') });
    console.log('cover ok');
    await p.context().close();
  }

  if (on('level')) {
    // walk the warm-up: cover -> deck
    const p = await mk({ tag: 'level' });
    await p.locator('.node[data-i="0"]').click();
    await p.waitForTimeout(600);
    await p.locator('#next').click();
    await p.waitForTimeout(700);
    await p.screenshot({ path: path.join(OUT, 'drill-card.png') });
    console.log('level ok');
    await p.context().close();
  }

  if (on('learn')) {
    const p = await mk({ tag: 'learn' });
    await p.evaluate(() => { localStorage.setItem('ms2:unlockAll', 'true'); });
    await p.reload(); await p.waitForTimeout(400);
    await p.locator('.node[data-i="1"]').click(); // The 3 averages
    await p.waitForTimeout(500);
    await p.locator('#next').click(); // past cover
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(OUT, 'learn-formula.png') });
    await p.locator('#next').click();
    await p.waitForTimeout(600);
    await p.screenshot({ path: path.join(OUT, 'learn-table.png') });
    console.log('learn ok');
    await p.context().close();
  }

  if (on('prob')) {
    const p = await mk({ tag: 'prob' });
    await p.evaluate(() => localStorage.setItem('ms2:unlockAll', 'true'));
    await p.reload(); await p.waitForTimeout(400);
    await p.locator('.node[data-i="1"]').click();
    await p.waitForTimeout(400);
    // advance until a solo problem card is showing
    for (let i = 0; i < 14; i++) {
      if (await p.locator('.field').count()) break;
      if (await p.locator('#next').isDisabled()) break;
      await p.locator('#next').click(); await p.waitForTimeout(300);
    }
    await p.screenshot({ path: path.join(OUT, 'prob.png') });
    console.log('prob ok, fields=', await p.locator('.field').count());
    await p.context().close();
  }

  if (on('clear')) {
    const p = await mk({ tag: 'clear' });
    await p.evaluate(() => localStorage.setItem('ms2:unlockAll', 'true'));
    await p.reload(); await p.waitForTimeout(400);
    await p.locator('.node[data-i="0"]').click();
    await p.waitForTimeout(500);
    // warm-up = cover + deck(6). Answer every question then land on the clear screen.
    for (let i = 0; i < 20; i++) {
      if (await p.locator('#fin:not([hidden])').count()) break;
      const opt = p.locator('.opt').first();
      if (await opt.count()) { await opt.click(); await p.waitForTimeout(200); }
      const nb = p.locator('.card > .btn').last();
      if (await nb.count() && await nb.isEnabled().catch(() => false)) { await nb.click(); await p.waitForTimeout(240); continue; }
      if (await p.locator('#next').isEnabled().catch(() => false)) { await p.locator('#next').click(); await p.waitForTimeout(240); }
    }
    await p.waitForTimeout(1500);
    await p.screenshot({ path: path.join(OUT, 'clear.png') });
    console.log('clear ok, fin visible=', await p.locator('#fin:not([hidden])').count());
    await p.context().close();
  }

  console.log('\nERRORS:', errs.length ? '\n' + errs.join('\n') : 'none');
  await b.close(); server.close();
})();
