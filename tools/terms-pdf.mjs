/* Собирает PDF «Условия работы» из data.js → assets/docs/usloviya-raboty.pdf

   node tools/terms-pdf.mjs

   Текст берётся из SITE.terms — тот же, что показывается на сайте в окне
   «Условия работы». Поменяли условия в data.js — запустите скрипт ещё раз.
   Шрифты сайта (El Messiri, Manrope) встраиваются прямо в документ, поэтому
   PDF одинаково выглядит на любом телефоне и компьютере.
   Нужен установленный Chrome или Edge и Node 22+. npm не нужен. */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- условия из data.js ---------- */
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'), box);
const T = box.window.SITE.terms;
if (!T) { console.error('В data.js нет terms'); process.exit(1); }
const OUT = path.join(ROOT, T.pdf || 'assets/docs/usloviya-raboty.pdf');

/* ---------- шрифты сайта — внутрь документа ---------- */
const CYR = 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116';
const LAT = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const face = (family, file, weight, range) => {
  const b64 = fs.readFileSync(path.join(ROOT, 'assets/fonts', file)).toString('base64');
  return `@font-face{font-family:"${family}";font-weight:${weight};src:url(data:font/woff2;base64,${b64}) format("woff2");unicode-range:${range}}`;
};
const fonts = [
  face('El Messiri', 'elmessiri-cyrillic.woff2', '400 700', CYR), face('El Messiri', 'elmessiri-latin.woff2', '400 700', LAT),
  face('Manrope', 'manrope-cyrillic.woff2', '200 800', CYR), face('Manrope', 'manrope-latin.woff2', '200 800', LAT)
].join('\n');

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<title>${esc(T.title)} — ${esc(T.owner)}</title>
<style>
${fonts}
@page{size:A4;margin:18mm 18mm 22mm}
*{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#141a2b;font:400 10.5pt/1.55 "Manrope",sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;padding-bottom:12px;border-bottom:1.5pt solid #d6a44c}
.kicker{margin:0 0 4px;font:600 8pt/1.4 "Manrope",sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#9a6f22}
h1{margin:0;font:700 27pt/1.05 "El Messiri",serif;color:#0c1326}
.owner{margin:6px 0 0;font-size:9.5pt;color:#4f5769}
.date{flex:none;padding:6px 10px;border:1pt solid #e7d3a6;border-radius:6px;font-size:8.5pt;color:#6d5220;background:#fbf6ea}
.parties{margin:14px 0 6px;padding:10px 12px;border-radius:6px;background:#f5f1e8;font-size:10pt;color:#2b3244}
ol.sec{margin:14px 0 0;padding:0;list-style:none;counter-reset:s}
ol.sec>li{counter-increment:s;margin:0 0 12px;break-inside:avoid}
h2{display:flex;align-items:baseline;gap:8px;margin:0 0 5px;font:700 13.5pt/1.25 "El Messiri",serif;color:#0c1326}
h2::before{content:counter(s) ".";min-width:18px;color:#b07d25}
ol.items{margin:0;padding:0 0 0 26px;list-style:none;counter-reset:i}
ol.items li{counter-increment:i;position:relative;margin:0 0 4px}
ol.items li::before{content:counter(s) "." counter(i);position:absolute;left:-26px;top:0;font-size:8.5pt;line-height:1.9;color:#9a8a6a}
.foot{margin-top:18px;padding-top:10px;border-top:.8pt solid #e2dccd;display:flex;justify-content:space-between;gap:12px;font-size:9pt;color:#4f5769}
.foot b{color:#0c1326}
</style></head><body>
<div class="top">
  <div>
    <p class="kicker">Соглашение</p>
    <h1>${esc(T.title)}</h1>
    <p class="owner"><b>${esc(T.owner)}</b> · ${esc(T.about)}</p>
  </div>
  <div class="date">Редакция от ${esc(T.updated)}</div>
</div>
<p class="parties">${esc(T.parties)}</p>
<ol class="sec">${T.sections.map(s => `
  <li><h2>${esc(s.h)}</h2><ol class="items">${s.items.map(t => `<li>${esc(t)}</li>`).join('')}</ol></li>`).join('')}
</ol>
<div class="foot"><span>${esc(T.contacts)}</span><span>${esc(T.owner)}</span></div>
</body></html>`;

/* ---------- Chrome без окна → PDF ---------- */
const exe = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'
].find(p => fs.existsSync(p));
if (!exe) { console.error('Не нашёл Chrome или Edge'); process.exit(1); }

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'terms-'));
const page = path.join(tmp, 'terms.html');
fs.writeFileSync(page, html);
const port = 9380 + Math.floor(Math.random() * 60);
const browser = spawn(exe, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${path.join(tmp, 'profile')}`,
  '--no-first-run', 'about:blank'], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 60 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; } catch { await sleep(200); }
}
if (!wsUrl) { console.error('Chrome не ответил'); browser.kill(); process.exit(1); }
const ws = new WebSocket(wsUrl);
await new Promise(r => { ws.onopen = r; });
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); } };
const send = (method, params = {}, sessionId) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId })); });

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
await send('Page.enable', {}, sessionId);
await send('Page.navigate', { url: 'file:///' + page.replace(/\\/g, '/') }, sessionId);
await sleep(1200);
await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => 1)', awaitPromise: true }, sessionId);
const pdf = await send('Page.printToPDF', {
  printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
  headerTemplate: '<span></span>',
  footerTemplate: `<div style="width:100%;padding:0 18mm;font:7.5px sans-serif;color:#8a90a0;display:flex;justify-content:space-between">
    <span>${esc(T.title)} · ${esc(T.owner)} · редакция от ${esc(T.updated)}</span><span>стр. <span class="pageNumber"></span> из <span class="totalPages"></span></span></div>`
}, sessionId);
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, Buffer.from(pdf.data, 'base64'));
console.log('Готово:', path.relative(ROOT, OUT), Math.round(fs.statSync(OUT).size / 1024) + ' КБ');

ws.close();
browser.kill();
setTimeout(() => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {} process.exit(0); }, 600);
