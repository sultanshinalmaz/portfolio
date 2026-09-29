// Вычитание значка Gemini (белая заливка с непрозрачностью A в форме, снятой с данных)
// и маска для него. Используется и для проверки, и при сборке роликов.
const fs = require('fs');
const M = JSON.parse(fs.readFileSync(__dirname + '/wm-model.json', 'utf8'));
function rhoAt(thDeg) {
  let t = ((thDeg % 90) + 90) % 90; if (t > 45) t = 90 - t;
  const f = t / M.step, i = Math.floor(f), k = f - i, r = M.rho;
  return (r[i] + (r[Math.min(i + 1, r.length - 1)] - r[i]) * k) * M.k;
}
// α для пикселя (центр пикселя x+.5, y+.5), мягкий край ~1,2 px
function alphaAt(x, y, ramp = 1.2) {
  const dx = x + .5 - M.cx, dy = y + .5 - M.cy, d = Math.hypot(dx, dy);
  if (d > 30) return 0;
  const e = rhoAt(Math.atan2(-dy, dx) * 180 / Math.PI);
  const m = Math.max(0, Math.min(1, (e - d) / ramp + .5));
  return M.A * m;
}
// окно, в котором есть значок
const BOX = { x: 1128, y: 568, w: 64, h: 64 };
const AL = new Float32Array(BOX.w * BOX.h);
for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) AL[y * BOX.w + x] = alphaAt(BOX.x + x, BOX.y + y);
// кадр rgb24 (ширина W): вычитаем значок на месте
function cleanRGB(buf, W) {
  for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) {
    const a = AL[y * BOX.w + x]; if (!a) continue;
    const i = ((BOX.y + y) * W + BOX.x + x) * 3;
    for (let c = 0; c < 3; c++) { const v = (buf[i + c] - a * 255) / (1 - a); buf[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }
  }
}
module.exports = { M, BOX, AL, alphaAt, cleanRGB };

// Значок светлит по-разному в разных кадрах: для кадра подбираем p_in = (1−A)·p_out + B
// по парам «2,5 px внутри края / 2,5 px снаружи» по лучам через 2° (яркость rgb → Y)
const PAIRS = [];
for (let deg = 0; deg < 360; deg += 2) {
  const t = deg * Math.PI / 180, e = rhoAt(deg), ux = Math.cos(t), uy = -Math.sin(t);
  if (e < 14.5) continue;                       // у самых острых вогнутых мест мало места — не берём
  PAIRS.push([M.cx + ux * (e - 2.5), M.cy + uy * (e - 2.5), M.cx + ux * (e + 2.5), M.cy + uy * (e + 2.5)]);
}
function lumaAt(buf, W, x, y) {
  const u = x - .5, v = y - .5, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
  const g = (ii, jj) => { const k = (jj * W + ii) * 3; return .299 * buf[k] + .587 * buf[k + 1] + .114 * buf[k + 2]; };
  return (1 - a) * (1 - b) * g(i, j) + a * (1 - b) * g(i + 1, j) + (1 - a) * b * g(i, j + 1) + a * b * g(i + 1, j + 1);
}
function fitFrame(buf, W) {
  let pts = PAIRS.map(([xi, yi, xo, yo]) => [lumaAt(buf, W, xo, yo), lumaAt(buf, W, xi, yi)]);
  let s = null;
  for (let it = 0; it < 3; it++) {              // МНК с отбрасыванием выбросов
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of pts) { n++; sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const k = (n * sxy - sx * sy) / (n * sxx - sx * sx), c = (sy - k * sx) / n;
    s = { A: Math.max(0, Math.min(.6, 1 - k)), B: c };
    const res = pts.map(([x, y]) => Math.abs(y - (k * x + c))).sort((a, b) => a - b), cut = res[Math.floor(res.length * .8)] + 1;
    pts = pts.filter(([x, y]) => Math.abs(y - (k * x + c)) <= cut);
  }
  return s;
}
// вычитание с подобранными для кадра A и B (B = A·W): s = (p − m·B)/(1 − m·A)
function cleanRGBfit(buf, W, A, B) {
  for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) {
    const m = AL[y * BOX.w + x] / M.A; if (!m) continue;
    const i = ((BOX.y + y) * W + BOX.x + x) * 3, a = m * A, b = m * B;
    for (let c = 0; c < 3; c++) { const v = (buf[i + c] - b) / (1 - a); buf[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }
  }
}
module.exports.fitFrame = fitFrame;
module.exports.cleanRGBfit = cleanRGBfit;

// Надёжнее: пары только там, где по обе стороны края ровный фон (без стыков стены/столба/пола)
const PAIRS2 = [];
for (let deg = 0; deg < 360; deg += 1.5) {
  const t = deg * Math.PI / 180, e = rhoAt(deg), ux = Math.cos(t), uy = -Math.sin(t);
  if (e < 14) continue;
  const P = s => [M.cx + ux * s, M.cy + uy * s];
  PAIRS2.push([P(e - 2.2), P(e - 4.2), P(e + 2.2), P(e + 4.2)]);
}
function fitFrame2(buf, W) {
  const L = (p) => lumaAt(buf, W, p[0], p[1]);
  let pts = [];
  for (const [i1, i2, o1, o2] of PAIRS2) {
    const a = L(i1), b = L(i2), c = L(o1), d = L(o2);
    if (Math.abs(a - b) < 6 && Math.abs(c - d) < 6) pts.push([(c + d) / 2, (a + b) / 2]);
  }
  if (pts.length < 20) return null;
  let s = null;
  for (let it = 0; it < 4; it++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0;
    for (const [x, y] of pts) { n++; sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const den = n * sxx - sx * sx; if (den < 1e-6) return null;
    const k = (n * sxy - sx * sy) / den, c = (sy - k * sx) / n;
    s = { A: 1 - k, B: c, n };
    const res = pts.map(([x, y]) => Math.abs(y - (k * x + c))).sort((a, b) => a - b), cut = res[Math.floor(res.length * .75)] + .5;
    pts = pts.filter(([x, y]) => Math.abs(y - (k * x + c)) <= cut);
  }
  return s;
}
// после вычитания — заглаживаем тонкую полосу у края (там, где маска 0.08…0.92): среднее по соседям вне полосы
const EDGE = [];
for (let y = 1; y < BOX.h - 1; y++) for (let x = 1; x < BOX.w - 1; x++) { const m = AL[y * BOX.w + x] / M.A; if (m > .08 && m < .92) EDGE.push([x, y]); }
function healEdge(buf, W) {
  const isEdge = new Uint8Array(BOX.w * BOX.h); for (const [x, y] of EDGE) isEdge[y * BOX.w + x] = 1;
  const src = Buffer.from(buf);
  for (const [x, y] of EDGE) {
    let s = [0, 0, 0], w = 0;
    for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
      const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= BOX.w || yy >= BOX.h || isEdge[yy * BOX.w + xx]) continue;
      const k = ((BOX.y + yy) * W + BOX.x + xx) * 3, wt = 1 / (i * i + j * j);
      for (let c = 0; c < 3; c++) s[c] += src[k + c] * wt; w += wt;
    }
    if (!w) continue;
    const k = ((BOX.y + y) * W + BOX.x + x) * 3;
    for (let c = 0; c < 3; c++) buf[k + c] = Math.round(s[c] / w);
  }
}
module.exports.fitFrame2 = fitFrame2;
module.exports.healEdge = healEdge;

// Параметры значка по ролику и цвету (A — непрозрачность, W — цвет), сняты по тысячам пар
const PER = {
  'video1_sunrise_1': [[.282, 255], [.278, 255], [.278, 255]],
  'video2_day_loop': [[.610, 217], [.615, 217], [.670, 203]],
  'gemini_generated_video_cd9ad8ba': [[.285, 255], [.286, 255], [.281, 255]],
  'video4_night_loop': [[.588, 231], [.586, 235], [.569, 240]]
};
function cleanRGBper(buf, W, P) {
  for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) {
    const m = AL[y * BOX.w + x] / M.A; if (!m) continue;
    const i = ((BOX.y + y) * W + BOX.x + x) * 3;
    for (let c = 0; c < 3; c++) { const a = m * P[c][0], v = (buf[i + c] - a * P[c][1]) / (1 - a); buf[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }
  }
}
module.exports.PER = PER;
module.exports.cleanRGBper = cleanRGBper;

// Вариант для плотного значка: край-переход шире (ramp) и полоса заглаживания шире (lo…hi, +1 px вокруг)
function build(ramp, lo, hi, grow) {
  const al = new Float32Array(BOX.w * BOX.h);
  for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) al[y * BOX.w + x] = alphaAt(BOX.x + x, BOX.y + y, ramp) / M.A;
  const band = new Uint8Array(BOX.w * BOX.h);
  for (let i = 0; i < al.length; i++) if (al[i] > lo && al[i] < hi) band[i] = 1;
  for (let g = 0; g < grow; g++) { const b2 = Uint8Array.from(band); for (let y = 1; y < BOX.h - 1; y++) for (let x = 1; x < BOX.w - 1; x++) { const i = y * BOX.w + x; if (band[i - 1] || band[i + 1] || band[i - BOX.w] || band[i + BOX.w]) b2[i] = 1; } band.set(b2); }
  return { al, band };
}
function cleanFrame(buf, W, P, opt) {
  const { al, band } = opt;
  for (let y = 0; y < BOX.h; y++) for (let x = 0; x < BOX.w; x++) {
    const m = al[y * BOX.w + x]; if (!m) continue;
    const i = ((BOX.y + y) * W + BOX.x + x) * 3;
    for (let c = 0; c < 3; c++) { const a = m * P[c][0], v = (buf[i + c] - a * P[c][1]) / (1 - a); buf[i + c] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v); }
  }
  // полосу у края заполняем от соседей вне полосы (несколько проходов — изнутри к середине)
  const src = Buffer.from(buf), done = Uint8Array.from(band, b => b ? 0 : 1);
  for (let pass = 0; pass < 4; pass++) for (let y = 2; y < BOX.h - 2; y++) for (let x = 2; x < BOX.w - 2; x++) {
    const bi = y * BOX.w + x; if (done[bi]) continue;
    let s = [0, 0, 0], w = 0;
    for (let j = -2; j <= 2; j++) for (let ii = -2; ii <= 2; ii++) {
      const bj = (y + j) * BOX.w + x + ii; if (!done[bj] || (!ii && !j)) continue;
      const k = ((BOX.y + y + j) * W + BOX.x + x + ii) * 3, wt = 1 / (ii * ii + j * j);
      for (let c = 0; c < 3; c++) s[c] += src[k + c] * wt; w += wt;
    }
    if (w < .6) continue;
    const k = ((BOX.y + y) * W + BOX.x + x) * 3;
    for (let c = 0; c < 3; c++) { buf[k + c] = Math.round(s[c] / w); src[k + c] = buf[k + c]; }
    done[bi] = 1;
  }
}
module.exports.build = build;
module.exports.cleanFrame = cleanFrame;
