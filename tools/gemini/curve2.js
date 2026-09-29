// Для одного ролика: по каждому цвету — снаружи → внутри (ровные пары), МНК: внутри = k·снаружи + c
const { execFileSync } = require('child_process');
const lib = require('./wmlib');
const FF = process.argv[2], v = process.argv[3];
const X0 = 1100, Y0 = 550, S = 100;
const buf = execFileSync(FF, ['-loglevel', 'error', '-i', v, '-vf', `crop=${S}:${S}:${X0}:${Y0}`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 30 });
const fsz = S * S * 3, pts = [[], [], []];
for (let o = 0; o + fsz <= buf.length; o += fsz * 2) {
  const f = buf.subarray(o, o + fsz);
  const C = (x, y, ch) => { const u = x - X0 - .5, w = y - Y0 - .5, i = Math.floor(u), j = Math.floor(w), a = u - i, b = w - j;
    const g = (ii, jj) => f[(jj * S + ii) * 3 + ch]; return (1 - a) * (1 - b) * g(i, j) + a * (1 - b) * g(i + 1, j) + (1 - a) * b * g(i, j + 1) + a * b * g(i + 1, j + 1); };
  for (let deg = 0; deg < 360; deg += 1.5) {
    let tt = ((deg % 90) + 90) % 90; if (tt > 45) tt = 90 - tt; const ff = tt / lib.M.step, i = Math.floor(ff), k = ff - i, r = lib.M.rho;
    const e = (r[i] + (r[Math.min(i + 1, r.length - 1)] - r[i]) * k) * lib.M.k; if (e < 14) continue;
    const t = deg * Math.PI / 180, ux = Math.cos(t), uy = -Math.sin(t), P = s => [lib.M.cx + ux * s, lib.M.cy + uy * s];
    const Y = (p) => .299 * C(...p, 0) + .587 * C(...p, 1) + .114 * C(...p, 2);
    const a1 = P(e - 2.2), a2 = P(e - 4.2), c1 = P(e + 2.2), c2 = P(e + 4.2);
    if (Math.abs(Y(a1) - Y(a2)) < 5 && Math.abs(Y(c1) - Y(c2)) < 5)
      for (let ch = 0; ch < 3; ch++) pts[ch].push([(C(...c1, ch) + C(...c2, ch)) / 2, (C(...a1, ch) + C(...a2, ch)) / 2]);
  }
}
const names = ['R', 'G', 'B'];
for (let ch = 0; ch < 3; ch++) {
  let p = pts[ch], s;
  for (let it = 0; it < 4; it++) {
    let n = 0, sx = 0, sy = 0, sxx = 0, sxy = 0; for (const [x, y] of p) { n++; sx += x; sy += y; sxx += x * x; sxy += x * y; }
    const k = (n * sxy - sx * sy) / (n * sxx - sx * sx), c = (sy - k * sx) / n; s = { k, c, n };
    const res = p.map(([x, y]) => Math.abs(y - (k * x + c))).sort((a, b) => a - b), cut = res[Math.floor(res.length * .7)] + .5;
    p = p.filter(([x, y]) => Math.abs(y - (k * x + c)) <= cut);
  }
  const lo = Math.min(...p.map(q => q[0])), hi = Math.max(...p.map(q => q[0]));
  console.log(v.split('/').pop().padEnd(40), names[ch], 'A', (1 - s.k).toFixed(3), 'цвет знака', (s.c / (1 - s.k)).toFixed(0), '| фон от', lo.toFixed(0), 'до', hi.toFixed(0), '| пар', s.n);
}
