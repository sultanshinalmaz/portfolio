// Логотип SAUDI MADE → файлы для сайта.
// Находит круг знака (по тёмно-зелёным пикселям), вырезает его — снаружи прозрачно —
// и пишет размеры для шапки, подвала и значка вкладки:
//   node tools/logo.mjs [исходник]      (по умолчанию assets/img/logo/logo-original.jpg)
// Нужен ffmpeg: путь — в переменной FFMPEG или ниже.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const FF = process.env.FFMPEG || 'C:/Users/user/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe';
const SRC = process.argv[2] || 'assets/img/logo/logo-original.jpg';
const OUT = 'assets/img/logo/';
const ff = (...a) => execFileSync(FF, ['-y', '-loglevel', 'error', ...a], { maxBuffer: 1 << 28 });

// размеры исходника
const FP = FF.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const [W, H] = execFileSync(FP, ['-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0', SRC], { encoding: 'utf8' }).trim().split(',').map(Number);
const px = ff('-i', SRC, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1');

// круг: рамка тёмных пикселей (кольцо знака), цвет кольца — средний по ним
let x0 = W, x1 = 0, y0 = H, y1 = 0, n = 0, sr = 0, sg = 0, sb = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 3, r = px[i], g = px[i + 1], b = px[i + 2];
  if (0.299 * r + 0.587 * g + 0.114 * b < 95) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    n++; sr += r; sg += g; sb += b;
  }
}
const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = ((x1 - x0) + (y1 - y0)) / 4;
const ring = [sr / n, sg / n, sb / n].map(Math.round);
console.log(`круг: центр ${cx}×${cy}, радиус ${R.toFixed(1)}, кольцо rgb(${ring})`);

// квадрат вокруг круга; снаружи прозрачно, а цвет прозрачных пикселей — как у кольца,
// чтобы при уменьшении по краю не было светлой каймы
const S = Math.ceil(R + 2) * 2, left = Math.round(cx - S / 2), top = Math.round(cy - S / 2);
const c = S / 2 + (cx - S / 2 - left), d = S / 2 + (cy - S / 2 - top), r0 = (R - 0.5).toFixed(2);
const inside = `lte(hypot(X-${c},Y-${d}),${r0})`;
const master = 'logo-master.png';
ff('-i', SRC, '-vf', `crop=${S}:${S}:${left}:${top},format=rgba,geq=` +
  `r='if(${inside},r(X,Y),${ring[0]})':g='if(${inside},g(X,Y),${ring[1]})':b='if(${inside},b(X,Y),${ring[2]})':` +
  `a='255*clip(${r0}+0.5-hypot(X-${c},Y-${d}),0,1)'`, OUT + master);

const webp = (size, name) => ff('-i', OUT + master, '-vf', `scale=${size}:${size}:flags=lanczos`, '-c:v', 'libwebp', '-quality', '92', OUT + name);
const png = (size, name) => ff('-i', OUT + master, '-vf', `scale=${size}:${size}:flags=lanczos`, OUT + name);
webp(96, 'logo-96.webp');           // шапка (44 px на обычном экране)
webp(192, 'logo-192.webp');         // шапка на чётких экранах
webp(512, 'logo-512.webp');         // знак качества внизу
webp(800, 'logo-800.webp');         // знак качества на чётких экранах
png(32, 'favicon-32.png');          // значок вкладки
png(192, 'favicon-192.png');        // значок на Android
// значок на iPhone: без прозрачности — знак на ночном фоне сайта
ff('-f', 'lavfi', '-i', 'color=c=0x070d1c:s=180x180', '-i', OUT + master, '-filter_complex',
  '[1]scale=164:164:flags=lanczos[l];[0][l]overlay=8:8:format=auto,format=rgb24', '-frames:v', '1', OUT + 'apple-touch-icon.png');
fs.unlinkSync(OUT + master);
for (const f of fs.readdirSync(OUT)) console.log(f.padEnd(24), (fs.statSync(OUT + f).size / 1024).toFixed(1) + ' КБ');
