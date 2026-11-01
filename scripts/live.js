// Smoke-test the LIVE deployment: assets, fonts, gameplay, no errors.
const { chromium } = require('playwright');
const URL = process.argv[2] || 'https://mean-streets-stat1050.vercel.app';
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 400, height: 860 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  const errs = [], failed = [], statuses = {};
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
  p.on('requestfailed', r => failed.push(r.url() + ' :: ' + r.failure()?.errorText));
  p.on('response', r => { try { statuses[new (require('url').URL)(r.url()).pathname] = r.status(); } catch (e) {} });

  const t0 = Date.now();
  await p.goto(URL, { waitUntil: 'networkidle' });
  const loadMs = Date.now() - t0;
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(500);

  const info = await p.evaluate(() => ({
    title: document.title,
    fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ':' + f.weight),
    h1: getComputedStyle(document.querySelector('.hero h1')).fontFamily,
    pixels: getComputedStyle(document.querySelector('#brand')).fontFamily,
    nodes: document.querySelectorAll('.node').length,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    cssLoaded: getComputedStyle(document.body).backgroundColor,
  }));
  console.log('title:', info.title);
  console.log('load(ms):', loadMs);
  console.log('fonts:', info.fonts.join(', '));
  console.log('h1 font:', info.h1);
  console.log('brand font:', info.pixels);
  console.log('nodes:', info.nodes, '| overflow:', info.overflow, '| body bg:', info.cssLoaded);
  console.log('statuses:', JSON.stringify(statuses));

  // play the first level a bit
  await p.locator('.node[data-i="0"]').click();
  await p.waitForTimeout(900);
  console.log('cover shown:', await p.locator('.card.cover').count() > 0, '| start btn:', await p.locator('#next').textContent());
  for (let i = 0; i < 4; i++) {
    await p.locator('#next').click(); await p.waitForTimeout(700);
    const deck = await p.locator('.card .dtop').count() > 0;
    console.log(`  step ${i + 1}: deck=${deck} question="${(await p.locator('.card .dq').first().textContent().catch(() => '') || '').slice(0, 46)}"`);
    if (deck) break;
  }
  await p.screenshot({ path: require('path').join(__dirname, '..', '.shots', 'live.png') });

  console.log('pageerrors:', errs.length ? errs : 'none');
  console.log('failed requests:', failed.length ? failed : 'none');
  await b.close();
})();
