// Бумага вокруг заставки → intro/paper.jpg.
// Ролик с печатью показываем на четверть меньше экрана, а вокруг него — продолжение того же листа.
// Берём последний кадр ролика, убираем свет (остаётся ровная текстура волокон яркостью K),
// заклеиваем оттиск и затёртый уголок справа внизу бумагой из соседних мест кадра и делаем
// текстуру бесшовной: плитки встают встык без швов и без зеркальных узоров.
// Свет страница рисует сама — градиентом по модели c0 + cx·x + cy·y (x, y — доли кадра);
// коэффициенты скрипт печатает: LIGHT (последний кадр) и LIGHT0 (постер — первый кадр),
// их место — в заставке в index.html.
//   node tools/intro-paper.mjs
// Нужен ffmpeg: путь — в переменной FFMPEG или ниже.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const FF = process.env.FFMPEG || 'C:/Users/user/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-9.0.1-full_build/bin/ffmpeg.exe';
const SRC = 'intro/intro.mp4', POSTER = 'intro/poster.jpg', OUT = 'intro/paper.jpg';
const W = 1280, H = 720, K = 240;
const T = '6.36';                        // последний кадр: печать стоит, штампа и тени уже нет
const CX = 638.5, CY = 365.5, R = 260;   // оттиск: центр и радиус в кадре (по зелёной краске)
const SPOT = [1113, 548, 1197, 627];     // затёртый уголок в ролике (прямоугольник-мозаика)
const ff = (a, input) => execFileSync(FF, ['-y', '-loglevel', 'error', ...a], { maxBuffer: 1 << 28, input });
const smooth = t => t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t);
const seal = (x, y) => Math.hypot(x - CX, y - CY) < R + 24;
const spot = (x, y, m = 0) => x >= SPOT[0] - m && x <= SPOT[2] + m && y >= SPOT[1] - m && y <= SPOT[3] + m;

// свет: МНК по бумаге (кроме skip), отдельно для R, G, B
function fitLight(px, skip) {
  return [0, 1, 2].map(ch => {
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], b = [0, 0, 0];
    for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
      if (skip(x, y)) continue;
      const v = [1, (x + .5) / W, (y + .5) / H], c = px[(y * W + x) * 3 + ch];
      for (let i = 0; i < 3; i++) { b[i] += v[i] * c; for (let j = 0; j < 3; j++) A[i][j] += v[i] * v[j]; }
    }
    for (let i = 0; i < 3; i++) for (let k = i + 1; k < 3; k++) {
      const f = A[k][i] / A[i][i]; for (let j = i; j < 3; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i];
    }
    const m = [0, 0, 0];
    for (let i = 2; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < 3; j++) s -= A[i][j] * m[j]; m[i] = s / A[i][i]; }
    return m;
  });
}

// кадр в RGB — той же матрицей, что браузер (BT.709)
const px = ff(['-ss', T, '-i', SRC, '-frames:v', '1', '-vf', 'scale=in_color_matrix=bt709:in_range=tv', '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']);
const model = fitLight(px, (x, y) => seal(x, y) || spot(x, y, 10));
const light = (x, y, ch) => model[ch][0] + model[ch][1] * (x + .5) / W + model[ch][2] * (y + .5) / H;
// свет первого кадра (постер): камера ещё не «села», лист светлее
const model0 = fitLight(ff(['-i', POSTER, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1']), () => false);

// 1) без света: c · K / свет;  2) остаток неровного света (лёгкая виньетка) — делением на среднее
// по окрестности 97×97 без оттиска и уголка: по всему листу волокна на одной яркости K
const flat = new Float32Array(W * H * 3), mask = new Uint8Array(W * H);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  mask[y * W + x] = seal(x, y) || spot(x, y, 6) ? 0 : 1;
  for (let ch = 0; ch < 3; ch++) { const i = (y * W + x) * 3 + ch; flat[i] = px[i] * K / light(x, y, ch); }
}
const RB = 48, S = new Float64Array((W + 1) * (H + 1) * 4);   // интегральные суммы: R, G, B, маска
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const m = mask[y * W + x], o = ((y + 1) * (W + 1) + x + 1) * 4, l = ((y + 1) * (W + 1) + x) * 4, u = (y * (W + 1) + x + 1) * 4, ul = (y * (W + 1) + x) * 4;
  for (let k = 0; k < 4; k++) S[o + k] = (k < 3 ? flat[(y * W + x) * 3 + k] * m : m) + S[l + k] + S[u + k] - S[ul + k];
}
const eq = new Float32Array(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const x0 = Math.max(0, x - RB), x1 = Math.min(W, x + RB + 1), y0 = Math.max(0, y - RB), y1 = Math.min(H, y + RB + 1);
  const box = k => S[(y1 * (W + 1) + x1) * 4 + k] - S[(y0 * (W + 1) + x1) * 4 + k] - S[(y1 * (W + 1) + x0) * 4 + k] + S[(y0 * (W + 1) + x0) * 4 + k];
  const n = box(3);
  for (let ch = 0; ch < 3; ch++) { const i = (y * W + x) * 3 + ch; eq[i] = n > 50 ? flat[i] * K / (box(ch) / n) : flat[i]; }
}

// 3) заплатки. Оттиск: левую половину — из того же ряда на 300 px левее, правую — на 300 px правее;
// по средней линии и по краю круга — плавный переход. Уголок — из места на 110 px выше.
const tex = new Float32Array(W * H * 3);
const R0 = R + 6, R1 = R + 22, SHIFT = 300, SEAM = 24, UP = 110, FE = 8;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const keep = smooth((Math.hypot(x - CX, y - CY) - R0) / (R1 - R0));
  const wr = smooth((x - CX + SEAM) / (2 * SEAM));          // 0 — берём слева, 1 — справа
  const inSpot = Math.min(x - SPOT[0], SPOT[2] - x, y - SPOT[1], SPOT[3] - y);   // >0 — внутри уголка
  const keepSpot = 1 - smooth((inSpot + FE) / (2 * FE));
  for (let ch = 0; ch < 3; ch++) {
    const i = (y * W + x) * 3 + ch;
    let v = eq[i];
    if (keep < 1) {
      const l = eq[(y * W + x - SHIFT) * 3 + ch], r = eq[(y * W + x + SHIFT) * 3 + ch];
      v = v * keep + (l * (1 - wr) + r * wr) * (1 - keep);
    }
    if (keepSpot < 1) v = v * keepSpot + eq[((y - UP) * W + x) * 3 + ch] * (1 - keepSpot);
    tex[i] = v;
  }
}

// 4) бесшовность: у краёв плитки подмешиваем ту же текстуру, сдвинутую на полплитки (её края
// сходятся встык), и возвращаем смеси контраст; середина плитки — ровно бумага из ролика
const BW = 150, BH = 90, out = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const m = Math.max(smooth(1 - Math.min(x, W - 1 - x) / BW), smooth(1 - Math.min(y, H - 1 - y) / BH));
  const o = (((y + H / 2) % H) * W + (x + W / 2) % W) * 3, gain = 1 / Math.hypot(1 - m, m);
  for (let ch = 0; ch < 3; ch++) {
    const i = (y * W + x) * 3 + ch, v = tex[i] * (1 - m) + tex[o + ch] * m;
    out[i] = Math.max(0, Math.min(255, Math.round(K + (v - K) * gain)));
  }
}
ff(['-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-i', 'pipe:0', '-q:v', '4', OUT], out);

const r = m => JSON.stringify(m.map(c => c.map(v => +v.toFixed(1))));
console.log('LIGHT  (последний кадр):', r(model), ' K =', K);
console.log('LIGHT0 (постер):        ', r(model0));
console.log(OUT, (fs.statSync(OUT).size / 1024).toFixed(1), 'КБ');
