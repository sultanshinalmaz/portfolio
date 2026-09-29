// Обработка ролика кадр за кадром: убрать значок Gemini, поправить луну, собрать заново.
//   node process.js <вход.mp4> <выход.mp4> <sunrise|dayloop|dusk|nightloop> [crf]
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const L = require('./wmlib');
const FF = 'C:/Users/user/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe';
const [,, IN, OUT, KIND, CRF = '17'] = process.argv;
const W = 1280, H = 720, FS = W * H * 3, FPS = 24;
const KEY = { sunrise: 'video1_sunrise_1', dayloop: 'video2_day_loop', dusk: 'gemini_generated_video_cd9ad8ba', nightloop: 'video4_night_loop' }[KIND];
const P = L.PER[KEY], OPT = L.build(2.0, .02, .98, 1);
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const lum = (b, i) => .299 * b[i] + .587 * b[i + 1] + .114 * b[i + 2];

/* ---------- луна: неподвижная, как в первом кадре ночного ролика ---------- */
const NIGHT = 'C:/Users/user/Downloads/video4_night_loop.mp4';
const ref = execFileSync(FF, ['-loglevel', 'error', '-i', NIGHT, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 26 });
// ночь по кругу: во все кадры — кусок неба с луной из первого кадра (мягкий край 10 px)
const MP = { x: 136, y: 41, w: 92, h: 91, f: 10 };
function pasteMoon(buf) {
  for (let y = 0; y < MP.h; y++) for (let x = 0; x < MP.w; x++) {
    const d = Math.min(x, y, MP.w - 1 - x, MP.h - 1 - y), wt = smooth(d / MP.f);
    if (!wt) continue;
    const i = ((MP.y + y) * W + MP.x + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(ref[i + c] * wt + buf[i + c] * (1 - wt));
  }
}
// закат: луна-«наклейка» из того же кадра — прозрачность по яркости над уровнем неба
const SP = { x: 153, y: 55, w: 70, h: 70 };
const sprite = (() => {
  const border = [];
  for (let y = 0; y < SP.h; y++) for (let x = 0; x < SP.w; x++) if (!x || !y || x === SP.w - 1 || y === SP.h - 1) border.push(lum(ref, ((SP.y + y) * W + SP.x + x) * 3));
  border.sort((a, b) => a - b); const sky = border[border.length >> 1];
  const a = new Float32Array(SP.w * SP.h);
  for (let y = 0; y < SP.h; y++) for (let x = 0; x < SP.w; x++) { const i = ((SP.y + y) * W + SP.x + x) * 3; a[y * SP.w + x] = smooth((lum(ref, i) - sky - 6) / 70); }
  return a;
})();
function putSprite(buf, k) {
  if (k <= 0) return;
  for (let y = 0; y < SP.h; y++) for (let x = 0; x < SP.w; x++) {
    const a = sprite[y * SP.w + x] * k; if (!a) continue;
    const i = ((SP.y + y) * W + SP.x + x) * 3;
    for (let c = 0; c < 3; c++) buf[i + c] = Math.round(ref[i + c] * a + buf[i + c] * (1 - a));
  }
}
// закат: найти влетающую луну (яркое пятно в левом верхнем углу неба) и закрасить небом
function findMoon(buf) {
  let sx = 0, sy = 0, s = 0, n = 0;
  for (let y = 0; y < 120; y++) for (let x = 0; x < 236; x++) {
    const v = lum(buf, (y * W + x) * 3); if (v > 140) { const w = v - 140; sx += x * w; sy += y * w; s += w; n++; }
  }
  return n >= 12 ? [sx / s, sy / s] : null;
}
function eraseMoon(buf, cx, cy, R = 36, F = 7) {
  // заливка ровным градиентом неба: плоскость по краю окна (без звёзд — самые яркие отброшены)
  const x0 = Math.max(0, Math.round(cx - R)), x1 = Math.min(W - 1, Math.round(cx + R)), y0 = Math.max(0, Math.round(cy - R)), y1 = Math.min(H - 1, Math.round(cy + R));
  const ring = [];
  for (let y = Math.max(0, y0 - 3); y <= Math.min(H - 1, y1 + 3); y++) for (let x = Math.max(0, x0 - 3); x <= Math.min(W - 1, x1 + 3); x++) {
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) continue;
    const i = (y * W + x) * 3; ring.push([x, y, buf[i], buf[i + 1], buf[i + 2], lum(buf, i)]);
  }
  const ls = ring.map(r => r[5]).sort((a, b) => a - b), med = ls[ls.length >> 1];
  const pts = ring.filter(r => r[5] < med + 14);
  const plane = [0, 1, 2].map(ch => {                   // МНК: v = a + b·x + c·y
    let n = 0, sx = 0, sy = 0, sv = 0, sxx = 0, syy = 0, sxy = 0, sxv = 0, syv = 0;
    for (const r of pts) { const x = r[0] - cx, y = r[1] - cy, v = r[2 + ch]; n++; sx += x; sy += y; sv += v; sxx += x * x; syy += y * y; sxy += x * y; sxv += x * v; syv += y * v; }
    const M = [[n, sx, sy], [sx, sxx, sxy], [sy, sxy, syy]], V = [sv, sxv, syv];
    const d = m => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = d(M); if (Math.abs(D) < 1e-6) return [sv / n, 0, 0];
    return [0, 1, 2].map(k => d(M.map((row, i) => row.map((val, j) => j === k ? V[i] : val))) / D);
  });
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const d = Math.min(x0 > 0 ? x - x0 : 99, x1 < W - 1 ? x1 - x : 99, y0 > 0 ? y - y0 : 99, y1 < H - 1 ? y1 - y : 99), wt = smooth((d + 1) / F);
    const i = (y * W + x) * 3;
    for (let ch = 0; ch < 3; ch++) { const [a, b, cc] = plane[ch], v = a + b * (x - cx) + cc * (y - cy); buf[i + ch] = Math.round(Math.max(0, Math.min(255, v)) * wt + buf[i + ch] * (1 - wt)); }
  }
}

/* ---------- кадр ---------- */
let n = 0;
function frame(buf) {
  L.cleanFrame(buf, W, P, OPT);                   // значок
  const t = n / FPS;
  if (KIND === 'nightloop') pasteMoon(buf);
  if (KIND === 'dusk' && t >= 7.6) {
    for (let k = 0; k < 2; k++) { const m = findMoon(buf); if (!m) break; eraseMoon(buf, m[0], m[1]); }
    putSprite(buf, smooth((t - 8.4) / 1.4));        // луна проявляется на своём месте к концу
  }
  n++;
}

/* ---------- поток: декодер → обработка → кодер ---------- */
const dec = spawn(FF, ['-loglevel', 'error', '-i', IN, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
const enc = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', CRF, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', OUT]);
let acc = Buffer.alloc(0);
dec.stdout.on('data', chunk => {
  acc = acc.length ? Buffer.concat([acc, chunk]) : chunk;
  while (acc.length >= FS) {
    const f = Buffer.from(acc.subarray(0, FS)); acc = acc.subarray(FS);
    frame(f);
    if (!enc.stdin.write(f)) { dec.stdout.pause(); enc.stdin.once('drain', () => dec.stdout.resume()); }
  }
});
dec.stdout.on('end', () => enc.stdin.end());
dec.stderr.on('data', d => process.stderr.write(d)); enc.stderr.on('data', d => process.stderr.write(d));
enc.on('close', code => { console.log(KIND, 'кадров', n, code === 0 ? 'готово' : 'ошибка ' + code, OUT, (fs.statSync(OUT).size / 1048576).toFixed(2) + ' МБ'); });
