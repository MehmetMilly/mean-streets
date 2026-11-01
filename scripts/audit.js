// Layout + font audit. node scripts/audit.js
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', 'public');
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const serve = () => new Promise(r => { const s = http.createServer((q, p) => { let f = q.url.split('?')[0]; if (f === '/') f = '/index.html'; fs.readFile(path.join(ROOT, f), (e, d) => { if (e) { p.writeHead(404); return p.end(); } p.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); p.end(d); }); }).listen(0, () => r(s)); });

(async () => {
  const server = await serve();
  const BASE = 'http://localhost:' + server.address().port;
  const b = await chromium.launch();
  for (const [tag, vp] of [['phone', { width: 400, height: 860 }], ['wide', { width: 1280, height: 900 }]]) {
    const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: 'dark' });
    const p = await ctx.newPage();
    await p.goto(BASE + '/', { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => {
      const out = {};
      const cs = s => getComputedStyle(document.querySelector(s));
      out.fontsLoaded = [...document.fonts].map(f => f.family + ' ' + f.status);
      out.h1font = cs('.hero h1').fontFamily;
      out.h1size = cs('.hero h1').fontSize;
      out.h1var = cs('.hero h1').fontVariationSettings;
      out.brandfont = cs('#brand').fontFamily;
      out.overflowX = document.documentElement.scrollWidth - document.documentElement.clientWidth;
      out.docH = document.documentElement.scrollHeight;
      out.mapH = document.querySelector('#map').getBoundingClientRect().height;
      const nodes = [...document.querySelectorAll('.node')].map(n => { const r = n.getBoundingClientRect(); return { t: Math.round(r.top), l: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), right: Math.round(r.right) }; });
      out.nodes = nodes;
      // widest child anywhere
      let worst = null;
      document.querySelectorAll('*').forEach(el => { const r = el.getBoundingClientRect(); if (r.right > (worst?.right || 0) && r.width > 0) worst = { tag: el.tagName + '.' + el.className, right: Math.round(r.right) }; });
      out.widest = worst;
      // is the pixel font actually painting? compare glyph advance vs fallback
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;font-size:40px;visibility:hidden';
      probe.textContent = 'MEAN';
      document.body.appendChild(probe);
      probe.style.fontFamily = '"Geist Pixel"'; const wp = probe.getBoundingClientRect().width;
      probe.style.fontFamily = 'monospace'; const wm = probe.getBoundingClientRect().width;
      probe.remove();
      out.pixelDiffers = Math.abs(wp - wm) > 1;
      return out;
    });
    console.log('\n=== ' + tag + ' ===');
    console.log(JSON.stringify(r, null, 1));
    await ctx.close();
  }
  await b.close(); server.close();
})();
