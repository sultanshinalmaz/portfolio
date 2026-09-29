/* ==========================================================================
   Заставка: ролик с печатью SAUDI MADE (папка intro/, вставка сразу после <body>).
   Играть ли, решает <head> (data.js → intro.everyVisit, ?nointro, «без анимаций»):
   если играет — на <html> класс is-intro, он прячет шапку и текст первого экрана.
   Когда печать начинает растворяться (событие sm-intro:finish), сайт открывается:
   is-intro снимается — шапка и текст поднимаются на место, — и приходит событие
   intro:done (по нему, например, начинается рассвет). Страховка — 15 с.
   Пришли по ссылке на раздел (сайт/#contact) — после заставки плавно едем к нему.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var host = document.getElementById('heroScene');
  var playing = root.classList.contains('is-intro');
  // рисованная сцена первого экрана — сразу готовая (её закрывает ролик)
  var scene = window.Scene.mount(host, { lit: true });
  window.heroScene = scene;
  ['is-dug', 'is-grown', 'is-wet'].forEach(function (c) { host.classList.add(c); });
  root.classList.add('is-lit');
  if (!playing) return;

  try { history.scrollRestoration = 'manual'; } catch (e) {}
  window.scrollTo(0, 0);

  var finished = false;
  function finish() {
    if (finished) return;
    finished = true;
    try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
    root.classList.remove('is-intro');
    document.dispatchEvent(new CustomEvent('intro:done'));
    var target = null;
    try { target = window.introTarget && document.querySelector(window.introTarget); } catch (e) {}
    if (target) setTimeout(function () { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 900);
  }
  document.addEventListener('sm-intro:finish', finish);
  // заставка уже закончилась (или её нет) до того, как сюда дошла очередь
  if (window.smIntroDone || !document.getElementById('sm-intro')) finish();
  setTimeout(finish, 15000);
})();
