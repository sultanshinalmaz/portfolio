/* Снимает превью всех работ для портфолио.

   node tools/shots.mjs              — все проекты из data.js
   node tools/shots.mjs rahat sushi  — только перечисленные

   Для каждого проекта получается два файла в assets/img/work/:
     <slug>-pc.webp    первый экран на компьютере (1440×900, сохраняется 1080×675)
     <slug>-long.webp  страница на телефоне (390 px шириной, до 4400 px вниз)
   Для мини-аппов (раздел apps в data.js) — по экрану на каждую вкладку:
     <slug>-<экран>.webp  телефон 390×844; адрес — live, вкладки — shots.screens
   Скрытые работы (hidden: true) пропускаются, если не названы явно.

   Нужен установленный Chrome или Edge и Node 22+. npm не нужен.
   Скрипт сам поднимает статический сервер над папкой «Проекты», ждёт,
   пока у сайта доиграет заставка, прокручивает страницу (чтобы сработали
   анимации появления) и снимает. Запускайте после каждой доработки сайтов. */

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');               // папка портфолио
const PROJECTS = path.resolve(ROOT, '..');           // папка «Проекты»
const OUT = path.join(ROOT, 'assets', 'img', 'work');
const SERVER_PORT = 8199;
const DEBUG_PORT = 9337;
const INTRO_WAIT = 10500;   // дольше любой заставки (у всех аварийный выход ~10 с)
const LONG_LIMIT = 4400;    // сколько CSS-пикселей страницы снимать для телефона
const CONCURRENCY = 3;

const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- список проектов из data.js ---------- */
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'), sandbox);
let projects = sandbox.window.SITE.projects.concat(sandbox.window.SITE.charity || []);   // и сайты садака джария
let apps = sandbox.window.SITE.apps || [];
const only = process.argv.slice(2);
if (only.length) {
  projects = projects.filter(p => only.includes(p.slug));
  apps = apps.filter(a => only.includes(a.slug));
} else {
  projects = projects.filter(p => !p.hidden);
}
fs.mkdirSync(OUT, { recursive: true });

/* ---------- статический сервер над «Проекты» ---------- */
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml'
};
const server = http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(PROJECTS, rel);
  if (!file.startsWith(PROJECTS)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {                       // видео любит Range-запросы
      const [a, b] = range.replace('bytes=', '').split('-');
      const start = +a, end = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size });
    fs.createReadStream(file).pipe(res);
  });
});
await new Promise(r => server.listen(SERVER_PORT, '127.0.0.1', r));

/* ---------- браузер ---------- */
const candidates = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium'
];
const exe = candidates.find(p => fs.existsSync(p));
if (!exe) { console.error('Не нашёл Chrome или Edge'); process.exit(1); }
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'shots-'));
const browser = spawn(exe, [
  '--headless=new', `--remote-debugging-port=${DEBUG_PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--mute-audio',
  '--autoplay-policy=no-user-gesture-required', '--disable-background-timer-throttling',
  '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'
], { stdio: 'ignore' });

let wsUrl;
for (let i = 0; i < 50 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`)).json()).webSocketDebuggerUrl; }
  catch { await sleep(200); }
}
if (!wsUrl) { console.error('Браузер не ответил'); browser.kill(); process.exit(1); }

/* ---------- минимальный клиент DevTools-протокола ---------- */
const ws = new WebSocket(wsUrl);
await new Promise((ok, fail) => { ws.onopen = ok; ws.onerror = fail; });
let seq = 0;
const pending = new Map();
const listeners = new Set();
ws.onmessage = ev => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) listeners.forEach(fn => fn(msg));
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++seq;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, sessionId }));
});
const waitEvent = (sessionId, method, timeout) => new Promise(resolve => {
  const t = setTimeout(() => { listeners.delete(fn); resolve(false); }, timeout);
  const fn = m => { if (m.sessionId === sessionId && m.method === method) { clearTimeout(t); listeners.delete(fn); resolve(true); } };
  listeners.add(fn);
});

const UA_PHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';

async function shoot(project, mode) {
  const phone = mode === 'long';
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  try {
    await send('Page.enable', {}, s);
    await send('Runtime.enable', {}, s);
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, s);
    await send('Emulation.setDeviceMetricsOverride', phone
      ? { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }
      : { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false }, s);
    if (phone) {
      await send('Emulation.setUserAgentOverride', { userAgent: UA_PHONE }, s);
      await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, s);
    }
    const url = `http://127.0.0.1:${SERVER_PORT}/${encodeURIComponent(project.folder)}/${project.page || ''}`;
    const loaded = waitEvent(s, 'Page.loadEventFired', 30000);
    await send('Page.navigate', { url }, s);
    await loaded;
    await sleep(INTRO_WAIT);

    const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true }, s)).result.value;
    // прокрутка по странице — чтобы сработали появления секций и ленивые картинки
    const total = await ev('document.documentElement.scrollHeight');
    const limit = phone ? Math.min(total, LONG_LIMIT + 900) : Math.min(total, 2400);
    const step = phone ? 600 : 700;
    for (let y = 0; y <= limit; y += step) {
      await ev(`window.scrollTo({top:${y},behavior:'instant'})`);
      await sleep(170);
    }
    await ev(`window.scrollTo({top:0,behavior:'instant'})`);
    await sleep(1800);

    let shot;
    if (phone) {
      const h = Math.min(await ev('document.documentElement.scrollHeight'), LONG_LIMIT);
      shot = await send('Page.captureScreenshot', {
        format: 'webp', quality: 68, captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: 390, height: h, scale: 0.75 }
      }, s);
    } else {
      shot = await send('Page.captureScreenshot', {
        format: 'webp', quality: 80,
        clip: { x: 0, y: 0, width: 1440, height: 900, scale: 0.75 }
      }, s);
    }
    const file = path.join(OUT, `${project.slug}-${phone ? 'long' : 'pc'}.webp`);
    fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
    console.log(`✓ ${project.slug}-${phone ? 'long' : 'pc'}  ${(fs.statSync(file).size / 1024).toFixed(0)} КБ`);
  } catch (e) {
    console.log(`✗ ${project.slug} ${mode}: ${e.message}`);
  } finally {
    await send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

/* ---------- мини-апп: открыть, нажать подготовку, снять каждую вкладку ---------- */
async function shootApp(app) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true });
  const ev = async expr => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, s)).result.value;
  // честное нажатие по элементу с нужным текстом (сначала среди вкладок .tab)
  const tapText = async text => {
    const r = await ev(`(() => {
      const t = ${JSON.stringify(text)};
      const all = [...document.querySelectorAll('.tab, button, a, [role=tab]')];
      const el = all.find(e => e.classList.contains('tab') && e.textContent.trim().startsWith(t)) || all.find(e => e.textContent.trim().startsWith(t));
      if (!el) return null;
      el.scrollIntoView({ block: 'center', behavior: 'instant' });
      const b = el.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
    })()`);
    if (!r) { console.log(`  ! ${app.slug}: не нашёл «${text}»`); return false; }
    for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 }, s);
    return true;
  };
  try {
    await send('Page.enable', {}, s);
    await send('Runtime.enable', {}, s);
    await send('Emulation.setFocusEmulationEnabled', { enabled: true }, s);
    await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true }, s);
    await send('Emulation.setUserAgentOverride', { userAgent: UA_PHONE }, s);
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }, s);
    const loaded = waitEvent(s, 'Page.loadEventFired', 30000);
    await send('Page.navigate', { url: (app.shots && app.shots.url) || app.live }, s);
    await loaded;
    await sleep(5000);
    for (const t of (app.shots.prepare || [])) { await tapText(t); await sleep(1800); }
    for (const sc of app.shots.screens) {
      if (sc.tab) { await tapText(sc.tab); await sleep(2200); }
      await ev('document.querySelectorAll("*").forEach(e => { if (e.scrollTop) e.scrollTop = 0 })');
      await sleep(600);
      const shot = await send('Page.captureScreenshot', {
        format: 'webp', quality: 78, clip: { x: 0, y: 0, width: 390, height: 844, scale: 0.75 }
      }, s);
      const file = path.join(OUT, `${app.slug}-${sc.name}.webp`);
      fs.writeFileSync(file, Buffer.from(shot.data, 'base64'));
      console.log(`✓ ${app.slug}-${sc.name}  ${(fs.statSync(file).size / 1024).toFixed(0)} КБ`);
    }
  } catch (e) {
    console.log(`✗ ${app.slug}: ${e.message}`);
  } finally {
    await send('Target.closeTarget', { targetId }).catch(() => {});
  }
}

const jobs = projects.flatMap(p => [[p, 'pc'], [p, 'long']]).concat(apps.filter(a => a.shots).map(a => [a, 'app']));
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (jobs.length) { const [p, m] = jobs.shift(); await (m === 'app' ? shootApp(p) : shoot(p, m)); }
}));

ws.close();
browser.kill();
server.close();
setTimeout(() => { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} process.exit(0); }, 800);
