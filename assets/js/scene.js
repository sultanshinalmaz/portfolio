/* ==========================================================================
   Сцена: оазис Медины.
   На горизонте — гора Ухуд, перед ней дюны. В центре — пруд оазиса,
   на дальнем берегу финиковые пальмы и чёрный шатёр бедуинов (бейт аш-шаар)
   с полосой ткачества саду. От пруда к зрителю веером расходятся
   каналы-фаладж — прямые, с изломами под 45° и «пятачками» на углах, как
   дорожки печатной платы от процессора: по ним к воде бегут огоньки —
   заявки клиентов. По дальним дюнам идёт караван.
   Всё нарисовано SVG-кодом, картинок нет.

   Scene.mount(контейнер, { lit: true|false }) → {
     lit(on)   свет в шатре, огни в каналах, блики в пруду, караван
     dig(p)    каналы проложены на долю p (0…1) — в подвале ведёт прокрутка
     fit()     пересчитать кадр
   }
   Этапы заставки — классы на контейнере: is-dug (каналы), is-grown (пальмы),
   is-wet (вода и шатёр); появление делают CSS-переходы.
   Кадр всегда вписан по высоте: на телефоне в кадре пруд и пальмы, на широком
   мониторе — вся панорама с горой. Ничего не растягивается и не обрезается сверху.
   Ночные цвета стоят в атрибутах, дневные — в day.css.
   ========================================================================== */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var VH = 700, CX = 800;                  // высота кадра; центр — пруд оазиса
  var HZ = 452;                            // подножие гор — линия горизонта
  var POOL = { cx: 800, cy: 520, rx: 232, ry: 26 };
  var X0 = -1000, X1 = 2600;               // запас по бокам — хватит и на 4K
  var uid = 0;

  function mk(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function f(n) { return Math.round(n * 10) / 10; }
  function rnd(seed) {                     // один и тот же «случайный» рельеф при каждой загрузке
    var s = seed;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  function line(pts) { return pts.map(function (p, i) { return (i ? 'L' : 'M') + f(p[0]) + ',' + f(p[1]); }).join(''); }
  function mirror(pts) { return pts.map(function (p) { return [2 * CX - p[0], p[1]]; }); }

  /* ---------- горы: гребень из «холмов» плюс изломы скал ---------- */
  function ridge(seed, peaks, base, jag, step) {
    var r = rnd(seed), d = 'M' + X0 + ',' + (base + 90);
    for (var x = X0; x <= X1; x += step) {
      var h = 0;
      for (var i = 0; i < peaks.length; i++) { var q = (x - peaks[i][0]) / peaks[i][2]; h += peaks[i][1] * Math.exp(-q * q); }
      h += (r() - 0.5) * jag * (0.45 + h / 170);            // чем выше, тем изрезаннее
      d += 'L' + x + ',' + f(base - Math.max(5, h));
    }
    return d + 'L' + X1 + ',' + (base + 90) + 'Z';
  }

  /* ---------- дюна: тело и теневой склон ----------
     Свет (луна, солнце) справа — теневой склон слева от гребня. */
  function dune(xl, xr, xp, yp, y0, k) {
    var body = 'M' + f(xl) + ',' + y0 +
      'C' + f(xl + (xp - xl) * 0.5) + ',' + y0 + ' ' + f(xp - (xp - xl) * 0.3) + ',' + f(yp) + ' ' + f(xp) + ',' + f(yp) +
      'C' + f(xp + (xr - xp) * 0.35) + ',' + f(yp) + ' ' + f(xr - (xr - xp) * 0.5) + ',' + y0 + ' ' + f(xr) + ',' + y0 + 'Z';
    var xs = xp - (xp - xl) * k;                               // где тень встречает подножие
    var lee = 'M' + f(xl) + ',' + y0 +
      'C' + f(xl + (xp - xl) * 0.5) + ',' + y0 + ' ' + f(xp - (xp - xl) * 0.3) + ',' + f(yp) + ' ' + f(xp) + ',' + f(yp) +
      'C' + f(xp - (xp - xs) * 0.15) + ',' + f(yp + (y0 - yp) * 0.45) + ' ' + f(xs + (xp - xs) * 0.25) + ',' + f(y0 - (y0 - yp) * 0.1) + ' ' + f(xs) + ',' + y0 + 'Z';
    return { body: body, lee: lee };
  }

  /* ---------- финиковая пальма ----------
     x, y — основание ствола; h — высота; lean — наклон кроны; s — масштаб */
  function palm(x, y, h, lean, s) {
    var tx = x + lean, ty = y - h;
    var wb = 6.5 * s, wt = 3.6 * s;
    var qx = x + lean * 0.12, qy = y - h * 0.55;               // изгиб ствола
    var trunk = 'M' + f(x - wb) + ',' + y + 'Q' + f(qx - (wb + wt) / 2) + ',' + f(qy) + ' ' + f(tx - wt) + ',' + f(ty) +
                'L' + f(tx + wt) + ',' + f(ty) + 'Q' + f(qx + (wb + wt) / 2) + ',' + f(qy) + ' ' + f(x + wb) + ',' + y + 'Z';
    // «чешуя» ствола — следы старых листьев
    var rings = '';
    for (var i = 1; i < 14; i++) {
      var t = i / 14, it = 1 - t;
      var px = it * it * x + 2 * it * t * qx + t * t * tx, py = it * it * y + 2 * it * t * qy + t * t * ty;
      var w = wb + (wt - wb) * t;
      rings += 'M' + f(px - w) + ',' + f(py) + 'q' + f(w) + ',' + f(-2.6 * s) + ' ' + f(2 * w) + ',0';
    }
    // крона: листья-вайи аркой вверх и вниз
    var fronds = '';
    [-172, -154, -134, -114, -96, -78, -60, -40, -20, -6, 10, 186].forEach(function (a, j) {
      var r = a * Math.PI / 180, len = (66 + (j % 3) * 11 + (j === 4 ? 10 : 0)) * s;
      var dx = Math.cos(r), dy = Math.sin(r);
      var ex = tx + dx * len, ey = ty + dy * len * 0.72 + len * 0.42 * (1 - Math.abs(dy));
      var mx = tx + dx * len * 0.55, my = ty + dy * len * 0.5 - len * 0.2;
      var nx = -dy * 5.5 * s, ny = dx * 5.5 * s;
      fronds += 'M' + f(tx) + ',' + f(ty) + 'Q' + f(mx + nx) + ',' + f(my + ny) + ' ' + f(ex) + ',' + f(ey) +
                'Q' + f(mx - nx) + ',' + f(my - ny) + ' ' + f(tx) + ',' + f(ty) + 'Z';
    });
    // грозди фиников под кроной
    var dates = '';
    [[-9, 10], [8, 12]].forEach(function (g) {
      var gx = tx + g[0] * s, gy = ty + g[1] * s;
      [[0, 0, 4.2], [-3.4, 3.6, 3.4], [3.2, 3.8, 3.4], [0, 6.4, 3]].forEach(function (c) {
        dates += 'M' + f(gx + c[0] * s - c[2] * s) + ',' + f(gy + c[1] * s) + 'a' + f(c[2] * s) + ',' + f(c[2] * s) + ' 0 1,0 ' + f(2 * c[2] * s) + ',0a' + f(c[2] * s) + ',' + f(c[2] * s) + ' 0 1,0 ' + f(-2 * c[2] * s) + ',0Z';
      });
    });
    return { trunk: trunk, rings: rings, fronds: fronds, dates: dates };
  }

  /* ---------- куст пустыни: три-четыре пучка ---------- */
  function shrub(x, y, s) {
    return [[-10, 0, 8], [0, -4, 10], [10, 0, 8], [3, 2, 7]].map(function (c) {
      var r = c[2] * s, cx = x + c[0] * s, cy = y + c[1] * s;
      return 'M' + f(cx - r) + ',' + f(y) + 'a' + f(r) + ',' + f(r * 0.9) + ' 0 0,1 ' + f(2 * r) + ',0Z';
    }).join('');
  }

  /* ---------- верблюд (дромадер) — силуэт, смотрит влево, ноги на y = 0 ---------- */
  var CAMEL = 'M0,-27L2,-30.5L6,-31L8.5,-28L10.5,-22.5L13.5,-20Q17,-22 19.5,-28Q23,-33.5 27,-28.5Q30,-23 34,-21.5' +
    'L39,-20.5Q41,-19.5 41.5,-16L42.5,-11L41,-11L40.2,-14.5L39.6,-8L39.4,0L37.2,0L37,-9L35.8,-12L35,-6L34.6,0L32.4,0' +
    'L32.6,-7L32,-13L18.5,-13.2L17.4,-8L16.8,0L14.6,0L14.8,-8L13.6,-11L12.8,-6L12.2,0L10,0L10.6,-8L10.4,-13L9.6,-16.5' +
    'L7.2,-20L4.6,-23.4L2,-24.6L0.4,-25.4Z';

  function mount(host, opts) {
    opts = opts || {};
    var id = 'sc' + (++uid);
    var svg = mk('svg', { viewBox: '0 0 1600 ' + VH, preserveAspectRatio: 'xMidYMax slice', 'aria-hidden': 'true', focusable: 'false' });
    var defs = mk('defs', {}, svg);
    function url(g) { return 'url(#' + id + g + ')'; }
    function grad(gid, cls, stops, radial) {
      var g = mk(radial ? 'radialGradient' : 'linearGradient', radial ? { id: id + gid } : { id: id + gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      stops.forEach(function (s, i) {
        mk('stop', { class: cls + i, offset: s[0], 'stop-color': s[1], 'stop-opacity': s[2] == null ? 1 : s[2] }, g);
      });
    }
    grad('ridge', 'gs-r', [[0, '#262b5c'], [1, '#12163a']]);
    grad('ground', 'gs-g', [[0, '#252463'], [1, '#131438']]);
    grad('water', 'gs-w', [[0, '#0a2a3a'], [0.55, '#0e4556'], [1, '#12606f']]);
    grad('door', 'gs-d', [[0, '#ffe2ae'], [0.55, '#ffb35c', 0.95], [1, '#ff8a3d', 0.2]], true);
    grad('spill', 'gs-s', [[0, '#ffb35c', 0.55], [1, '#ffb35c', 0]], true);
    // «пиксельный песок»: сетка точек, как растр экрана
    var pat = mk('pattern', { id: id + 'dots', width: 9, height: 9, patternUnits: 'userSpaceOnUse' }, defs);
    mk('rect', { class: 'sc-dot', x: 3.5, y: 3.5, width: 1.7, height: 1.7, fill: '#ffffff', 'fill-opacity': 0.06 }, pat);

    /* --- дальние горы Хиджаза в дымке --- */
    var back = mk('g', { class: 'sc-back' }, svg);
    mk('path', { class: 'bp sc-range', style: '--n:0', pathLength: 1, fill: '#161b40',
      d: ridge(11, [[-600, 64, 320], [260, 96, 280], [880, 78, 300], [1480, 100, 280], [2200, 70, 320]], HZ + 4, 7, 40) }, back);

    /* --- гора Ухуд: длинный скалистый массив к северу от Медины --- */
    var uhud = ridge(5, [[-700, 70, 200], [-250, 96, 160], [140, 138, 150], [380, 166, 118], [610, 100, 140], [800, 60, 170],
                         [1010, 112, 130], [1250, 172, 122], [1480, 128, 150], [1900, 106, 190], [2300, 80, 200]], HZ, 18, 18);
    mk('path', { class: 'bp sc-ridge', style: '--n:1', pathLength: 1, fill: url('ridge'), d: uhud }, back);

    /* --- дальние дюны --- */
    var far = mk('g', { class: 'sc-far' }, svg);
    var r = rnd(7), x = X0, n = 0;
    while (x < X1) {
      var w = 180 + r() * 170, hh = 16 + r() * 22;
      var dn = dune(x, x + w, x + w * (0.45 + r() * 0.22), 482 - hh, 486, 0.55 + r() * 0.25);
      var g1 = mk('g', { style: '--n:' + (2 + (n++ % 6)) }, far);
      mk('path', { class: 'bp sc-fd', pathLength: 1, fill: '#21245c', d: dn.body }, g1);
      mk('path', { class: 'sc-fd-lee', fill: '#181a47', d: dn.lee }, g1);
      x += w * (0.55 + r() * 0.2);
    }

    /* --- караван на дальних дюнах: клиенты идут к оазису --- */
    var walk = mk('g', { class: 'sc-walk' }, mk('g', { transform: 'translate(' + CX + ',484)' }, svg));
    mk('path', { class: 'sc-rope', d: 'M-21,-17Q-11,-15 0.6,-26' }, walk);
    mk('path', { class: 'sc-camel', style: '--c:0', d: 'M-24,-30.5a3.6,3.6 0 1,1 .1,0ZM-28.6,-24.8L-19.4,-24.8L-18.4,0L-29.6,0Z' }, walk);
    [0, 50, 100].forEach(function (cx, i) {           // CSS качает силуэт — позиция в отдельной обёртке
      mk('path', { class: 'sc-camel', style: '--c:' + (i + 1), d: CAMEL }, mk('g', { transform: 'translate(' + cx + ',0)' }, walk));
    });

    /* --- средние дюны по краям: оазис лежит в ложбине между ними --- */
    var mid = mk('g', { class: 'sc-mid' }, svg);
    [[-1180, -150, -640, 430, 584, 0.7], [-560, 660, 210, 396, 586, 0.66], [940, 2160, 1440, 402, 586, 0.62], [1740, 2860, 2260, 432, 584, 0.7]]
      .forEach(function (m, i) {
        var dm = dune(m[0], m[1], m[2], m[3], m[4], m[5]);
        var g2 = mk('g', { style: '--n:' + (5 + i) }, mid);
        mk('path', { class: 'bp sc-md', pathLength: 1, fill: '#2b2a6c', d: dm.body }, g2);
        mk('path', { class: 'sc-md-lee', fill: '#1c1d50', d: dm.lee }, g2);
      });

    /* --- песок оазиса: по краям ближе к зрителю, в центре ложбина уходит вдаль --- */
    var gd = 'M' + X0 + ',564L180,564C420,564 560,476 800,472C1040,476 1180,564 1420,564L' + X1 + ',564L' + X1 + ',760L' + X0 + ',760Z';
    mk('path', { class: 'bp sc-ground', style: '--n:9', pathLength: 1, fill: url('ground'), d: gd }, svg);
    mk('path', { class: 'sc-dots', fill: url('dots'), d: gd }, svg);

    /* --- пальмы --- */
    function addPalm(parent, p, i, sway) {
      var pl = palm(p[0], p[1], p[2], p[3], p[4]);
      var g = mk('g', { class: 'sc-palm' + (sway ? ' sc-palm--sway' : ''), style: '--p:' + i }, parent);
      mk('path', { class: 'sc-trunk', fill: '#0c1024', d: pl.trunk }, g);
      mk('path', { class: 'sc-rings', d: pl.rings }, g);
      var crown = mk('g', { class: 'sc-crown' }, g);
      mk('path', { class: 'sc-dates', fill: '#24170e', d: pl.dates }, crown);
      mk('path', { class: 'sc-frond', fill: '#0e1826', d: pl.fronds }, crown);
    }
    // по краям, на песке перед дюнами (видно на широком экране)
    var side = mk('g', { class: 'sc-palms' }, svg);
    [[330, 566, 196, 10, 1.05], [1270, 566, 186, -8, 1], [120, 566, 150, 4, 0.82], [1480, 566, 156, -4, 0.84],
     [-80, 566, 176, 6, 0.92], [1690, 566, 170, -6, 0.9]]
      .forEach(function (p, i) { addPalm(side, p, i, false); });
    // дальний берег пруда
    var bank = mk('g', { class: 'sc-palms' }, svg);
    [[600, 500, 252, -14, 1.2], [664, 496, 318, 10, 1.36], [728, 494, 240, -6, 1.12], [858, 494, 296, 12, 1.3], [1072, 502, 266, -10, 1.22]]
      .forEach(function (p, i) { addPalm(bank, p, 6 + i, true); });

    /* --- шатёр бедуинов на дальнем берегу: чёрная козья шерсть, полоса саду, свет у входа --- */
    var tent = mk('g', { class: 'sc-tent-g' }, mk('g', { transform: 'translate(972,500) scale(.74)' }, svg));
    mk('ellipse', { class: 'sc-spill', fill: url('spill'), cx: 0, cy: 5, rx: 76, ry: 10 }, tent);
    mk('path', { class: 'sc-rope', d: 'M-64,-51L-98,0M60,-51L98,0' }, tent);
    mk('path', { class: 'sc-tentwall', fill: '#0b0c18', d: 'M-73,-34L-73,0L73,0L73,-32Z' }, tent);
    mk('path', { class: 'sc-door', fill: url('door'), d: 'M-20,0L-18,-30L18,-30L20,0Z' }, tent);
    mk('path', { class: 'sc-tent', fill: '#07080f', d: 'M-78,-30L-64,-52Q-48,-43 -34,-58Q-18,-45 -2,-61Q14,-46 30,-58Q46,-45 60,-52L78,-28Z' }, tent);
    var sadu = '', sadu2 = '';
    for (var sx = -70; sx < 70; sx += 8) {
      sadu += 'M' + sx + ',-28l4,-5l4,5z';
      sadu2 += 'M' + (sx + 4) + ',-33l4,5l-8,0z';
    }
    mk('path', { class: 'sc-sadu sc-sadu--r', fill: '#6d2020', d: sadu }, tent);
    mk('path', { class: 'sc-sadu sc-sadu--w', fill: '#3a3230', d: sadu2 }, tent);

    /* --- каналы-фаладж: от пруда к зрителю веером, как дорожки платы от процессора ---
       Изломы под 45°, «пятачки» на углах. Путь задан от края к воде — огоньки бегут к пруду. */
    var fan = [
      [[742, 712], [742, 642], [766, 618], [766, 530]],
      [[650, 712], [650, 648], [706, 592], [706, 530]],
      [[540, 712], [540, 676], [640, 576], [640, 530]]
    ];
    var sideCh = [
      [[X0, 622], [330, 622], [376, 576], [640, 576]],          // вливается в угол крайнего канала
      [[X0, 666], [250, 666], [282, 634], [420, 634]]           // ветка к «узлу» с саженцем
    ];
    var chans = fan.concat(fan.map(mirror), [[[800, 712], [800, 530]]], sideCh, sideCh.map(mirror));
    var pads = [];
    fan.concat(sideCh).forEach(function (c) { for (var i = 1; i < c.length - 1; i++) pads.push(c[i]); });
    var nodes = [[420, 634]];
    var ch = mk('g', { class: 'sc-ch' }, svg);
    ['ch-bed', 'ch-glow', 'ch-core'].forEach(function (cls) {
      chans.forEach(function (c) { mk('path', { class: cls, pathLength: 1, d: line(c) }, ch); });
    });
    chans.forEach(function (c) { mk('path', { class: 'ch-flow', pathLength: 1, d: line(c) }, ch); });
    pads.concat(mirror(pads)).forEach(function (p) { mk('circle', { class: 'ch-pad', cx: p[0], cy: p[1], r: 4.6 }, ch); });
    nodes.concat(mirror(nodes)).forEach(function (p) { mk('circle', { class: 'ch-pad ch-node', cx: p[0], cy: p[1], r: 6 }, ch); });

    /* --- пруд оазиса: закрывает концы каналов и основания пальм --- */
    var pool = mk('g', { class: 'sc-pool' }, svg);
    mk('ellipse', { class: 'bp sc-poolrim', style: '--n:10', pathLength: 1, fill: '#10123a', cx: POOL.cx, cy: POOL.cy + 3, rx: POOL.rx + 11, ry: POOL.ry + 8 }, pool);
    var water = mk('g', { class: 'sc-water' }, pool);
    mk('ellipse', { fill: url('water'), cx: POOL.cx, cy: POOL.cy, rx: POOL.rx, ry: POOL.ry }, water);
    mk('ellipse', { class: 'sc-refl', fill: url('door'), cx: 972, cy: 512, rx: 15, ry: 12 }, water);
    mk('path', { class: 'sc-glint', d: 'M846,508h44M884,517h60M826,528h30M902,530h24M700,514h26' }, water);

    /* --- кусты, саженцы на «узлах» и большие пальмы на переднем плане --- */
    var near = mk('g', { class: 'sc-palms sc-palms--front' }, svg);
    mk('path', { class: 'sc-frond sc-shrub', fill: '#0e1826', d: shrub(250, 596, 1.1) + shrub(1356, 600, 1.2) + shrub(470, 566, 0.8) + shrub(1150, 566, 0.85) }, near);
    [[420, 632, 46, 3, 0.4], [1180, 632, 46, -3, 0.4],
     [452, 694, 330, 18, 1.62], [1150, 698, 312, -16, 1.55]]
      .forEach(function (p, i) { addPalm(near, p, 11 + i, i >= 2); });

    host.appendChild(svg);

    /* --- кадр по высоте: ширина viewBox = ширина экрана в масштабе высоты --- */
    function fit() {
      var w = host.clientWidth, h = host.clientHeight;
      if (!w || !h) return;
      var vw = VH * w / h;
      svg.setAttribute('viewBox', f(CX - vw / 2) + ' 0 ' + f(vw) + ' ' + VH);
    }
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(host);
    else window.addEventListener('resize', fit);

    // пока сцена не на экране, огоньки, караван и пальмы стоят — телефон не греется зря
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { host.classList.toggle('is-paused', !es[0].isIntersecting); }).observe(host);
    }

    function lit(on) { host.classList.toggle('is-lit', !!on); }
    function dig(p) { host.style.setProperty('--dig', Math.max(0, Math.min(1, p)).toFixed(3)); }

    lit(opts.lit !== false);
    return { lit: lit, dig: dig, fit: fit, host: host };
  }

  window.Scene = { mount: mount };
})();
