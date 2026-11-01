// Solve a problem correctly and verify XP + solved state.
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, '..', '.shots');
const T = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });
(async () => {
  const server = await serve(); const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 880 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(BASE + '/', { waitUntil: 'load' });
  await p.evaluate(() => { localStorage.setItem('ms2:unlockAll', 'true'); });
  await p.reload(); await p.waitForTimeout(400);
  // level 1 -> advance to the first problem (Late Ubers: mean 6, median 5, mode 3)
  await p.locator('.node[data-i="1"]').click(); await p.waitForTimeout(500);
  for (let i = 0; i < 12; i++) {
    if (await p.locator('.field').count()) break;
    await p.locator('#next').click(); await p.waitForTimeout(280);
    if (await p.locator('.card .opt').count()) { await p.locator('.card .opt').first().click(); await p.waitForTimeout(160); }
  }
  console.log('fields:', await p.locator('.field').count());
  const labels = await p.evaluate(() => [...document.querySelectorAll('.field label')].map(l => l.textContent));
  console.log('labels:', labels);
  await p.locator('.field').nth(0).locator('input').fill('6');
  await p.locator('.field').nth(1).locator('input').fill('5');
  await p.locator('.field').nth(2).locator('input').fill('3');
  await p.locator('[data-a=chk]').click(); await p.waitForTimeout(700);
  const r = await p.evaluate(() => ({
    pst: document.querySelector('.pst').textContent,
    ok: document.querySelectorAll('.field.ok').length,
    no: document.querySelectorAll('.field.no').length,
    stamp: !!document.querySelector('.stampc'),
    solved: JSON.parse(localStorage.getItem('ms2:solved') || '{}'),
    xp: localStorage.getItem('ms2:xp'),
    slips: JSON.parse(localStorage.getItem('ms2:slips') || '[]'),
  }));
  console.log(JSON.stringify(r, null, 1));
  await p.screenshot({ path: path.join(OUT, 'solved.png') });

  // now test a WRONG answer on the next problem to confirm slip logging
  await p.locator('#next').click(); await p.waitForTimeout(500);
  const fld = p.locator('.field').first().locator('input');
  if (await fld.count()) {
    await fld.fill('999');
    await p.locator('[data-a=chk]').click(); await p.waitForTimeout(500);
    console.log('after wrong:', await p.evaluate(() => ({ no: document.querySelectorAll('.field.no').length, slips: JSON.parse(localStorage.getItem('ms2:slips') || '[]').slice(-1) })));
  }
  console.log('ERRORS:', errs.length ? errs : 'none');
  await b.close(); server.close();
})();
