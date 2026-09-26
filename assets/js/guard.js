/* ==========================================================================
   Защита от копирования. Включается и выключается в data.js → protect.

   Честно о пределах: запретить скриншот или запись экрана сайт не может —
   снимок делает сам телефон или компьютер, и браузер об этом не узнаёт;
   а экран можно снять и вторым телефоном. Здесь всё, что сайту доступно:
   • нельзя выделить и скопировать текст — в буфер попадает строка с автором;
   • нет меню по правой кнопке и долгому нажатию, картинки не перетаскиваются
     и не сохраняются;
   • не срабатывают Ctrl/⌘+S (сохранить), P (печать), U (код страницы),
     F12 и Ctrl+Shift+I / J / C (инструменты разработчика);
   • печать и «Сохранить как PDF» дают пустую страницу с подписью;
   • на компьютере системные скриншоты начинаются с ⌘+Shift (Mac: ⌘⇧3/4/5)
     и Win+Shift (Windows: Win+Shift+S): как только эти клавиши зажаты,
     страницу закрывает щит, и в снимок попадает он, а не сайт. Щит уходит,
     когда человек снова двигает мышью или трогает экран;
   • клавиша PrintScreen показывает щит и стирает снимок из буфера обмена
     (там, где браузер это разрешает);
   • видеоотзывы нельзя скачать через меню плеера (атрибуты в app.js).
   Файл подключается в <head> сразу после data.js — запреты действуют с первого кадра.
   ========================================================================== */
(function () {
  'use strict';

  var S = window.SITE || {};
  var P = S.protect || {};
  if (P.enabled === false) return;

  var root = document.documentElement, doc = document;
  var notice = P.notice || '© Копирование запрещено';
  root.classList.add('protect');
  root.setAttribute('data-protect-notice', notice);

  /* --- выделение, копирование, меню, перетаскивание --- */
  var stop = function (e) { e.preventDefault(); };
  doc.addEventListener('contextmenu', stop);
  doc.addEventListener('dragstart', stop);
  doc.addEventListener('selectstart', stop);
  ['copy', 'cut'].forEach(function (t) {
    doc.addEventListener(t, function (e) {
      e.preventDefault();
      try { e.clipboardData.setData('text/plain', notice); } catch (err) {}
    });
  });

  /* --- щит: тёмный экран со знаком и подписью --- */
  var guard = null, releaseAt = 0, safetyT = 0;
  function makeGuard() {
    if (guard || !doc.body) return;
    guard = doc.createElement('div');
    guard.className = 'guard';
    guard.setAttribute('aria-hidden', 'true');
    guard.innerHTML = '<i></i><b></b><span></span>';
    guard.querySelector('b').textContent = (S.brand && S.brand.name) || '';
    guard.querySelector('span').textContent = notice;
    doc.body.appendChild(guard);
  }
  function shieldOn() {
    makeGuard();
    root.classList.add('is-shielded');
    releaseAt = Infinity;                       // держим, пока человек не вернётся к странице
    clearTimeout(safetyT);
  }
  function shieldOff() {
    root.classList.remove('is-shielded');
    releaseAt = 0;
    clearTimeout(safetyT);
  }
  function shieldRelease(minMs) {               // снять при первом движении мыши или касании
    if (!root.classList.contains('is-shielded')) return;
    releaseAt = Date.now() + (minMs || 500);
    clearTimeout(safetyT);
    safetyT = setTimeout(shieldOff, 8000);      // и в любом случае через 8 секунд
  }
  function activity() { if (releaseAt && Date.now() >= releaseAt) shieldOff(); }
  ['mousemove', 'pointerdown', 'wheel', 'touchstart'].forEach(function (t) {
    window.addEventListener(t, activity, { passive: true });
  });

  /* --- клавиши --- */
  doc.addEventListener('keydown', function (e) {
    var k = (e.key || '').toLowerCase(), mod = e.ctrlKey || e.metaKey;
    // ⌘+Shift / Win+Shift — начало системного скриншота: закрываем экран заранее
    if (e.metaKey && e.shiftKey) shieldOn();
    if (k === 'f12' ||
        (mod && (k === 's' || k === 'p' || k === 'u')) ||
        (mod && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) ||
        (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c' || k === 'u'))) {
      e.preventDefault();
    }
  }, true);
  doc.addEventListener('keyup', function (e) {
    if (e.key === 'PrintScreen') {
      shieldOn();
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(notice).catch(function () {});
      } catch (err) {}
      shieldRelease(1200);
      return;
    }
    if (root.classList.contains('is-shielded') && !(e.metaKey && e.shiftKey)) shieldRelease(500);
  }, true);

  // открылся инструмент снимка экрана — окно потеряло фокус: щит держим до возвращения
  window.addEventListener('blur', function () {
    if (root.classList.contains('is-shielded')) { releaseAt = Infinity; clearTimeout(safetyT); }
  });
  window.addEventListener('focus', function () { shieldRelease(500); });

  // печать и «Сохранить как PDF»: в CSS страница пустая, а на экране — щит
  window.addEventListener('beforeprint', shieldOn);
  window.addEventListener('afterprint', shieldOff);
})();
