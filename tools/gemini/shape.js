// Форма значка по данным: радиус края ρ(θ) через 2,5° (0…45°, звезда симметрична 8 раз),
// край — самый крутой спад яркости по лучу из центра; медиана по кадрам разных роликов.
const { execFileSync } = require('child_process');
const fs = require('fs');
const FF = process.argv[2], vids = process.argv.slice(3);
const X0 = 1120, Y0 = 560, S = 80, CX = 1159.6, CY = 600.2;
const imgs = [];
for (const v of vids) {
  // среднее по кускам в 12 кадров — меньше шума, но разные фоны
  const buf = execFileSync(FF, ['-loglevel', 'error', '-i', v, '-vf', `crop=${S}:${S}:${X0}:${Y0},format=gray,tmix=frames=12,select='not(mod(n\\,12))'`, '-fps_mode', 'passthrough', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 30 });
  for (let i = 0; i + S * S <= buf.length; i += S * S) imgs.push(buf.subarray(i, i + S * S));
}
const at = (f, x, y) => {
  const u = x - X0 - .5, v = y - Y0 - .5, i = Math.floor(u), j = Math.floor(v), a = u - i, b = v - j;
  const g = (ii, jj) => f[Math.min(S - 1, Math.max(0, jj)) * S + Math.min(S - 1, Math.max(0, ii))];
  return (1 - a) * (1 - b) * g(i, j) + a * (1 - b) * g(i + 1, j) + (1 - a) * b * g(i, j + 1) + a * b * g(i + 1, j + 1);
};
const rho = [];
for (let base = 0; base <= 45.001; base += 2.5) {
  const meas = [];
  for (const q of [0, 90, 180, 270]) for (const sgn of [1, -1]) {
    const deg = q + sgn * base, t = deg * Math.PI / 180;
    for (const f of imgs) {
      const prof = []; for (let s = 6; s <= 30; s += .25) prof.push([s, at(f, CX + Math.cos(t) * s, CY - Math.sin(t) * s)]);
      let bi = -1, bd = 0;
      for (let k = 2; k < prof.length - 2; k++) { const d = prof[k + 2][1] - prof[k - 2][1]; if (d < bd) { bd = d; bi = k; } }
      if (bi > 0 && bd < -12) meas.push(prof[bi][0]);           // заметный спад — край
    }
  }
  meas.sort((a, b) => a - b);
  rho.push(+meas[meas.length >> 1].toFixed(2));
}
console.log('кадров', imgs.length, '| ρ(θ) через 2,5°:', rho.join(' '));
fs.writeFileSync('wm-shape.json', JSON.stringify({ cx: CX, cy: CY, step: 2.5, rho }));
