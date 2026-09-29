// Подбор прозрачности A, сдвига и масштаба k формы, снятой с данных (wm-shape.json).
// Шов: по лучам через 1° — значение в 2 px внутри края после вычитания против 2 px снаружи.
const { execFileSync } = require('child_process');
const fs = require('fs');
const FF = process.argv[2], vids = process.argv.slice(3);
const SH = JSON.parse(fs.readFileSync('wm-shape.json', 'utf8'));
const X0 = 1120, Y0 = 560, S = 80;
const frames = [];
for (const v of vids) {
  const buf = execFileSync(FF, ['-loglevel', 'error', '-i', v, '-vf', `select='not(mod(n\\,6))',crop=${S}:${S}:${X0}:${Y0},format=gray`, '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 30 });
  for (let i = 0; i + S * S <= buf.length; i += S * S) frames.push(buf.subarray(i, i + S * S));
}
const at = (f, x, y) => {
  const u = x - X0 - .5, v = y - Y0 - .5, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
  const g = (ii, jj) => f[Math.min(S - 1, Math.max(0, jj)) * S + Math.min(S - 1, Math.max(0, ii))];
  return (1 - a) * (1 - b) * g(i, j) + a * (1 - b) * g(i + 1, j) + (1 - a) * b * g(i, j + 1) + a * b * g(i + 1, j + 1);
};
function rhoAt(thDeg) {                      // θ в градусах, свёрнутый в 0…45
  let t = ((thDeg % 90) + 90) % 90; if (t > 45) t = 90 - t;
  const f = t / SH.step, i = Math.floor(f), k = f - i, r = SH.rho;
  return r[i] + (r[Math.min(i + 1, r.length - 1)] - r[i]) * k;
}
function seam(cx, cy, k, A, d = 2) {
  let tot = 0, n = 0;
  for (let deg = 0; deg < 360; deg += 1) {
    const t = deg * Math.PI / 180, e = rhoAt(deg) * k, ux = Math.cos(t), uy = -Math.sin(t);
    let s = 0;
    for (const f of frames) {
      const pin = at(f, cx + ux * (e - d), cy + uy * (e - d)), pout = at(f, cx + ux * (e + d), cy + uy * (e + d));
      s += (pin - A * 255) / (1 - A) - pout;
    }
    tot += Math.abs(s / frames.length); n++;
  }
  return tot / n;
}
let best = { cx: SH.cx, cy: SH.cy, k: 1, A: .33 }, bl = seam(best.cx, best.cy, best.k, best.A);
console.log('кадров', frames.length, '| шов без вычитания', seam(best.cx, best.cy, 1, 0).toFixed(2), '| с начальной моделью', bl.toFixed(2));
for (const step of [.5, .25, .1]) for (let it = 0; it < 8; it++) {
  let moved = false;
  for (const [key, dv] of [['cx', step], ['cx', -step], ['cy', step], ['cy', -step], ['k', step / 20], ['k', -step / 20], ['A', .01], ['A', -.01]]) {
    const t = { ...best, [key]: best[key] + dv }, l = seam(t.cx, t.cy, t.k, t.A);
    if (l < bl) { best = t; bl = l; moved = true; }
  }
  if (!moved) break;
}
console.log('итог', JSON.stringify(best), '| шов', bl.toFixed(2));
fs.writeFileSync('wm-model.json', JSON.stringify({ ...best, step: SH.step, rho: SH.rho }));
