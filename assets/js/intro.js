/* ==========================================================================
   Заставка: печать SAUDI MADE над оазисом.
   Басмала → золотой циркуль чертит кольца печати → кольцо с надписями
   раскручивается и встаёт на место, мечеть в центре проявляется из дымки →
   удар печати: волна и золотые искры, по золоту пробегает блик.
   Тем временем внизу строится оазис: каналы, пальмы, вода и шатёр,
   затем зажигаются огни и рассвет → текст первого экрана поднимается на место.
   Файл печати выбирает <head> по размеру экрана (window.introSeal) и грузит
   заранее; старт ждёт, пока картинка готова, но не дольше 1,2 с.

   Правила, выстраданные на прошлых сайтах:
   • стартуем, только когда страница реально видна (visibilityState),
     по двойному кадру; запасной таймер тоже проверяет видимость;
   • время считаем от первого нарисованного кадра, а не от загрузки скрипта;
   • держим минимум 3,5 с, уходим по позднейшему из «доиграла» и window.load,
     но не позже 6,5 с; аварийный выход через 10 с — даже если вкладка
     так и не стала видимой (часть встроенных браузеров мессенджеров);
   • кнопка «Пропустить» всегда под рукой.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var host = document.getElementById('heroScene');
  var intro = document.getElementById('intro');
  var playing = root.classList.contains('is-intro');
  var scene = window.Scene.mount(host, { lit: !playing });
  window.heroScene = scene;
  var STAGES = ['is-dug', 'is-grown', 'is-wet'];

  if (!playing) {
    STAGES.forEach(function (c) { host.classList.add(c); });
    if (intro) intro.parentNode.removeChild(intro);
    return;
  }

  // Прокрутку держим наверху, пока идёт заставка
  try { history.scrollRestoration = 'manual'; } catch (e) {}
  window.scrollTo(0, 0);

  var STAGE_AT = [1080, 1640, 2100];      // каналы, пальмы, вода с шатром — в такт печати, мс
  var LIT_AT = 2600, DONE_AT = 4200, CAP_MS = 6500, SAFETY_MS = 10000;   // готовой печатью любуемся ещё ~1,5 с

  var t0 = 0, started = false, animDone = false, finished = false;
  var loaded = document.readyState === 'complete';
  var timers = [];
  var later = function (fn, ms) { timers.push(setTimeout(fn, ms)); };

  window.addEventListener('load', function () { loaded = true; maybeFinish(); });

  /* печать: три слоя одной картинки (центр, кольцо, блик) + золотые искры */
  var seal = document.getElementById('seal');
  var sealImgs = seal ? [].slice.call(seal.querySelectorAll('img')) : [];
  var sealSrc = window.introSeal || 'assets/img/intro/seal-1000.webp';
  sealImgs.forEach(function (im) { im.src = sealSrc; });
  var dust = document.getElementById('sealDust');
  if (dust) {
    var sparks = '';
    for (var i = 0; i < 22; i++) {
      var a = (i / 22 + Math.random() * 0.02) * Math.PI * 2, dist = 28 + Math.random() * 52;
      sparks += '<i style="--x:' + (50 + 46 * Math.cos(a)).toFixed(1) + '%;--y:' + (50 + 46 * Math.sin(a)).toFixed(1) + '%;--dx:' +
        (Math.cos(a) * dist).toFixed(0) + 'px;--dy:' + (Math.sin(a) * dist).toFixed(0) + 'px;--d:' + (Math.random() * 0.14).toFixed(2) + 's"></i>';
    }
    dust.innerHTML = sparks;
  }
  function whenSealReady(cb) {
    if (!sealImgs.length) return cb();
    var done = false, fire = function () { if (!done) { done = true; cb(); } };
    setTimeout(fire, 1200);                         // медленная сеть — дольше не ждём, печать догрузится по ходу
    var im = sealImgs[0];
    if (im.decode) im.decode().then(fire, fire);
    else if (im.complete) fire();
    else { im.onload = fire; im.onerror = fire; }
  }

  function tryStart() {
    if (started || finished || document.visibilityState !== 'visible') return;
    started = true;
    whenSealReady(function () {
      if (finished) return;
      requestAnimationFrame(function () { requestAnimationFrame(begin); });
      // кадры могут не прийти (фоновая вкладка) — страхуемся таймером, но только если страница видна
      later(function () { if (!t0 && document.visibilityState === 'visible') begin(performance.now()); }, 400);
    });
  }

  function begin(now) {
    if (t0 || finished) return;
    t0 = now || performance.now();
    root.classList.add('is-playing');
    STAGES.forEach(function (c, i) { later(function () { host.classList.add(c); }, STAGE_AT[i]); });
    later(function () { scene.lit(true); root.classList.add('is-lit'); }, LIT_AT);
    later(function () { animDone = true; maybeFinish(); }, DONE_AT);
    later(finish, CAP_MS);
  }

  function maybeFinish() { if (animDone && loaded) finish(); }

  function finish(skipped) {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    STAGES.forEach(function (c) { host.classList.add(c); });
    scene.lit(true);
    root.classList.add('is-lit', 'is-leaving');
    if (skipped) root.classList.add('is-skipped');
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    setTimeout(function () {
      root.classList.remove('is-intro');
      document.dispatchEvent(new CustomEvent('intro:done'));
      // пришли по ссылке на раздел (сайт.ру/#contact) — после заставки плавно едем к нему
      var target = null;
      try { target = window.introTarget && document.querySelector(window.introTarget); } catch (e) {}
      if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 700);
    }, skipped ? 0 : 320);
    setTimeout(function () {
      root.classList.remove('is-playing', 'is-leaving', 'is-skipped');
      if (intro && intro.parentNode) intro.parentNode.removeChild(intro);
    }, 1400);
  }

  var skip = document.getElementById('introSkip');
  if (skip) skip.addEventListener('click', function () { finish(true); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !finished) finish(true); });

  document.addEventListener('visibilitychange', tryStart);
  setTimeout(function () { if (!t0) finish(true); }, SAFETY_MS);   // аварийный выход, если так и не стартовали
  tryStart();
})();
