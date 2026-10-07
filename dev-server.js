/* Локальный просмотр портфолио: node dev-server.js → http://localhost:8160
   Кроме самого портфолио отдаёт и сайты-работы: адрес /work/<slug>/ ведёт
   в соседнюю папку проекта (список берётся из assets/js/data.js), поэтому
   кнопки «Открыть сайт» работают уже сейчас, до публикации. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const PORT = process.env.PORT || 8160;
const ROOT = __dirname;
const PROJECTS = path.resolve(ROOT, '..');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.md': 'text/plain; charset=utf-8'
};

function folders() {                       // slug → папка проекта; читаем при каждом запросе, чтобы правки data.js подхватывались
  const box = { window: {} };
  try { vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'), box); } catch (e) { return {}; }
  const map = {};
  [...(box.window.SITE.projects || []), ...(box.window.SITE.charity || [])].forEach(p => { map[p.slug] = p.folder; });
  return map;
}

http.createServer((req, res) => {
  let rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let base = ROOT;
  const m = rel.match(/^\/work\/([^/]+)(\/.*)?$/);
  if (m) {
    const folder = folders()[m[1]];
    if (!folder) { res.writeHead(404); return res.end('Нет такого проекта'); }
    if (!m[2]) { res.writeHead(301, { Location: rel + '/' }); return res.end(); }
    base = path.join(PROJECTS, folder);
    rel = m[2];
  }
  if (rel.endsWith('/')) rel += 'index.html';
  const file = path.join(base, rel);
  if (!file.startsWith(base)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Не найдено'); }
    const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const [a, b] = range.replace('bytes=', '').split('-');
      const start = +a, end = b ? +b : st.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => console.log(`Портфолио: http://localhost:${PORT}`));

/* ---------- превью работ обновляются сами ----------
   Пока сервер запущен, он следит за папками сайтов из data.js. Поменяли
   что-то в сайте — через 20 секунд тишины tools/shots.mjs переснимет его
   скриншоты (по одному сайту за раз, в фоне). При запуске сервер сам
   переснимает сайты, которые менялись после прошлой съёмки.
   Отключить: node dev-server.js --no-shots */
if (!process.argv.includes('--no-shots')) {
  const { spawn } = require('child_process');
  const SKIP = /(^|[\\/])(node_modules|\.git|\.claude|\.vercel|_src|_full|dist|telegram)([\\/]|$)|data\.json$|\.log$/;
  const newest = dir => {
    let max = 0;
    (function walk(d) {
      let list = [];
      try { list = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
      for (const e of list) {
        const p = path.join(d, e.name);
        if (SKIP.test(p)) continue;
        if (e.isDirectory()) walk(p);
        else { try { max = Math.max(max, fs.statSync(p).mtimeMs); } catch (err) {} }
      }
    })(dir);
    return max;
  };
  const queue = [];
  let busy = false;
  const next = () => {
    if (busy || !queue.length) return;
    busy = true;
    const slug = queue.shift();
    console.log(`Переснимаю превью: ${slug}…`);
    const child = spawn(process.execPath, [path.join(ROOT, 'tools', 'shots.mjs'), slug], { stdio: 'inherit' });
    child.on('exit', () => { busy = false; next(); });
    child.on('error', () => { busy = false; next(); });
  };
  const enqueue = slug => { if (!queue.includes(slug)) queue.push(slug); next(); };

  setTimeout(() => {
    const box = { window: {} };
    try { vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/data.js'), 'utf8'), box); } catch (e) { return; }
    const timers = {};
    // время последнего снимка сайта
    const shotTime = slug => {
      const f = path.join(ROOT, 'assets', 'img', 'work', `${slug}-long.webp`);
      return fs.existsSync(f) ? fs.statSync(f).mtimeMs : 0;
    };
    for (const p of [...box.window.SITE.projects, ...(box.window.SITE.charity || [])].filter(x => !x.hidden && x.folder)) {
      const dir = path.join(PROJECTS, p.folder);
      if (!fs.existsSync(dir)) continue;
      if (newest(dir) > shotTime(p.slug)) enqueue(p.slug);
      try {
        fs.watch(dir, { recursive: true }, (ev, file) => {
          if (file && SKIP.test(file)) return;
          clearTimeout(timers[p.slug]);
          // Windows сообщает и о простом чтении файлов (съёмка сама читает сайт),
          // поэтому переснимаем, только если файлы правда новее последнего снимка
          timers[p.slug] = setTimeout(() => { if (newest(dir) > shotTime(p.slug)) enqueue(p.slug); }, 20000);
        });
      } catch (e) {}
    }
    console.log('Слежу за папками сайтов: изменения попадут в превью сами.');
  }, 1500);
}
