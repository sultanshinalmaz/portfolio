// Центр луны по кадрам: яркое пятно в окне x 100–280, y 20–140 (1280×720)
const { execFileSync } = require('child_process');
const FF = process.argv[2], V = process.argv[3], from = +(process.argv[4] || 0), dur = +(process.argv[5] || 99);
const W = 180, H = 120;
const buf = execFileSync(FF, ['-loglevel', 'error', '-ss', String(from), '-t', String(dur), '-i', V, '-vf', 'crop=180:120:100:20,format=gray', '-f', 'rawvideo', 'pipe:1'], { maxBuffer: 1 << 28 });
const n = buf.length / (W * H), out = [];
for (let f = 0; f < n; f++) {
  let sx = 0, sy = 0, s = 0, cnt = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const v = buf[f * W * H + y * W + x];
    if (v > 150) { const wgt = v - 150; sx += x * wgt; sy += y * wgt; s += wgt; cnt++; }
  }
  out.push(s ? [(100 + sx / s).toFixed(1), (20 + sy / s).toFixed(1), cnt] : [null, null, 0]);
}
const xs = out.filter(o => o[0]).map(o => +o[0]), ys = out.filter(o => o[1]).map(o => +o[1]);
console.log('кадров', n, '| x от', Math.min(...xs).toFixed(1), 'до', Math.max(...xs).toFixed(1), '| y от', Math.min(...ys).toFixed(1), 'до', Math.max(...ys).toFixed(1));
const step = Math.max(1, Math.floor(n / 24));
console.log(out.filter((_, i) => i % step === 0 || i === n - 1).map((o, i) => o[0] + ',' + o[1]).join('  '));
