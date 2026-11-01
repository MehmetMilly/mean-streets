// Robust playthrough + screenshots.
// node scripts/play.js <levelIdx> [stepsToTake] [tag]
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
fs.mkdirSync(OUT, { recursive: true });
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });

async function advance(p, limit = 60) {
  // take one step forward; returns the step type we landed on
  for (let i = 0; i < limit; i++) {
    if (await p.locator('#fin:not([hidden])').count()) return 'fin';
    const kind = await p.evaluate(() => {
      const c = document.querySelector('#cardhost .card');
      if (!c) return 'none';
      if (c.classList.contains('cover')) return 'cover';
      if (c.querySelector('.opts')) return c.querySelector('.dtop') ? 'deck' : 'check';
      if (c.querySelector('.fields')) return 'prob';
      if (c.querySelector('#toyhost')) return 'toy';
      return 'learn';
    });
    if (kind === 'check') {
      if (!(await p.locator('.card .expl').first().innerHTML().catch(() => ''))) {
        // answer if not yet answered
        const answered = await p.evaluate(() => document.querySelector('.card .opt')?.disabled);
        if (!answered) { await p.locator('.card .opt').first().click(); await p.waitForTimeout(180); }
      }
      await p.locator('#next').click(); await p.waitForTimeout(320); continue;
    }
    if (kind === 'deck') {
      // click through the whole deck
      for (let k = 0; k < 40; k++) {
        const opt = p.locator('.card .opt').first();
        if (!(await opt.count())) break;
        if (!(await opt.isEnabled().catch(() => false))) break;
        await opt.click(); await p.waitForTimeout(110);
        const nb = p.locator('.card > .btn');
        if (await nb.count()) { await nb.click(); await p.waitForTimeout(130); }
      }
      // deck end screen: "Run it again" is present; Next should now be enabled
      await p.waitForTimeout(250);
      if (await p.locator('#next').isEnabled().catch(() => false)) { await p.locator('#next').click(); await p.waitForTimeout(350); }
      continue;
    }
    if (kind === 'prob') {
      // fill plausible garbage so fields get marked, then press Check, then next
      const n = await p.locator('.card .field').count();
      for (let k = 0; k < n; k++) {
        const f = p.locator('.card .field').nth(k);
        if (await f.locator('input').count()) await f.locator('input').fill('1');
        else await f.locator('select').selectOption({ index: 1 });
      }
      await p.locator('.card [data-a=chk]').click(); await p.waitForTimeout(260);
      await p.locator('#next').click(); await p.waitForTimeout(320); continue;
    }
    // cover / learn / toy -> just next
    if (await p.locator('#next').isEnabled().catch(() => false)) { await p.locator('#next').click(); await p.waitForTimeout(340); }
    else { await p.locator('#skip').click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(320); }
  }
  return 'limit';
}

(async () => {
  const lvl = +(process.argv[2] || 0);
  const shots = +(process.argv[3] || 0);
  const server = await serve();
  const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 880 }, deviceScaleFactor: 2, colorScheme: 'dark' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.setItem('ms2:unlockAll', 'true'); localStorage.setItem('ms2:resetOnce', '1'); });
  await p.reload(); await p.waitForTimeout(400);
  await p.evaluate(() => document.fonts.ready);
  await p.locator(`.node[data-i="${lvl}"]`).click();
  await p.waitForTimeout(600);
  await p.screenshot({ path: path.join(OUT, `L${lvl}-00.png`) });
  for (let s = 1; s <= shots; s++) {
    const at = await advance(p);
    await p.waitForTimeout(450);
    await p.screenshot({ path: path.join(OUT, `L${lvl}-${String(s).padStart(2, '0')}.png`) });
    console.log(`step ${s} -> ${at}`);
    if (at === 'fin') break;
  }
  console.log('ERRORS', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
