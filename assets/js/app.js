/* ==========================================================================
   SAUDI MADE — поведение страницы. Весь текст берётся из data.js.
   ========================================================================== */
(function () {
  'use strict';

  const S = window.SITE;
  const root = document.documentElement;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const plural = (n, f) => f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2];
  const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
  const icon = id => `<svg aria-hidden="true"><use href="#${id}"/></svg>`;
  const lowerFirst = s => /^[А-ЯЁ](?![А-ЯЁA-Z])/.test(s) ? s[0].toLowerCase() + s.slice(1) : s;

  const C = S.contacts;
  const tgUrl = t => 'https://t.me/' + C.telegram + (t ? '?text=' + encodeURIComponent(t) : '');
  const waUrl = t => 'https://wa.me/' + C.whatsapp + (t ? '?text=' + encodeURIComponent(t) : '');

  /* ---------- простые подстановки ---------- */
  $$('[data-bind]').forEach(el => { const v = get(S, el.dataset.bind); if (v != null) el.textContent = v; });
  const title = $('[data-hero-title]');
  if (title) title.innerHTML = S.hero.title.map((t, i, a) => `<span${i === a.length - 1 ? ' class="accent"' : ''}>${esc(t)}</span>`).join('');
  $$('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ---------- первый экран ровно в экран телефона ----------
     Сцена занимает всё, что осталось под текстом, — от 200 до 440 px.
     Высоту берём как 100svh (экран с видимыми панелями браузера), поэтому
     в Safari на iPhone оазис не уходит под нижнюю панель. */
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:100vh;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  const heroContent = $('.hero__content');
  let heroW = 0;
  function fitHero(force) {
    const w = window.innerWidth;
    if (!force && w === heroW) return;          // панель браузера прячется при прокрутке — не дёргаем сцену
    heroW = w;
    const vh = probe.offsetHeight || window.innerHeight;
    const kids = heroContent.children, cs = getComputedStyle(heroContent);
    const first = kids[0], last = kids[kids.length - 1];
    const natural = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + (last.offsetTop + last.offsetHeight - first.offsetTop);
    const desk = w >= 900;
    let h = Math.floor((vh - natural) / 0.86);
    h = clamp(h, desk ? 280 : 200, desk ? Math.min(560, w * 0.36) : 440);
    root.style.setProperty('--scene-h', h + 'px');
  }
  fitHero(true);
  window.addEventListener('resize', () => fitHero());
  window.addEventListener('orientationchange', () => setTimeout(() => fitHero(true), 300));
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitHero(true));
  window.addEventListener('load', () => fitHero(true));

  const projects = S.projects.filter(p => !p.hidden);

  /* Куда ведёт «Открыть сайт».
     На вашем компьютере — свежая версия из папки проекта: сразу видно всё, что вы
     поменяли. Открыли портфолио файлом — ссылка ../Папка/index.html, через
     node dev-server.js — адрес work/<slug>/. В интернете — опубликованный адрес
     (live в data.js). Нет адреса — вместо кнопки пометка «скоро онлайн». */
  const isLocal = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  function siteHref(p) {
    if (isLocal && p.folder) {
      if (location.protocol === 'file:') return '../' + encodeURIComponent(p.folder) + '/' + (p.page || 'index.html');
      return 'work/' + p.slug + '/';
    }
    return p.live || '';
  }
  const openBtn = (p, cls) => siteHref(p)
    ? `<a class="btn ${cls}" href="${esc(siteHref(p))}" target="_blank" rel="noopener">Открыть сайт${icon('i-ext')}</a>`
    : '<span class="btn btn--soon">Скоро онлайн</span>';
  $$('[data-count]').forEach(el => { el.textContent = projects.length; });

  /* ---------- звёзды над Мединой ---------- */
  const stars = $('#stars');
  if (stars) {
    let html = '';
    for (let i = 0; i < 70; i++) {
      const s = (Math.random() * 1.4 + .8).toFixed(1);
      html += `<i style="left:${(Math.random() * 100).toFixed(2)}%;top:${(Math.random() * 100).toFixed(2)}%;width:${s}px;height:${s}px;--tw:${(3 + Math.random() * 4).toFixed(1)}s;--td:${(-Math.random() * 6).toFixed(1)}s"></i>`;
    }
    stars.innerHTML = html;
  }

  /* ---------- бегущая строка ----------
     Дорожка — две одинаковые половины, едет на −50 % и незаметно начинается
     заново. Каждая половина обязана быть шире экрана, иначе на широком
     мониторе справа появляется пустой хвост. Поэтому набор слов повторяем
     столько раз, сколько нужно под текущую ширину, а скорость держим ровной. */
  const ribbon = $('#ribbon');
  if (ribbon) {
    const items = ['Сайты', '<i lang="ar">مواقع</i>', 'Мобильные приложения', '<i lang="ar">تطبيقات</i>', 'Telegram-боты',
      'Mini Apps', '<i lang="ar">تصميم</i>', 'Веб-приложения', 'Дизайн', 'Поддержка', '<i lang="ar">المدينة</i>'];
    const set = items.map(t => t + icon('i-mark')).join('');
    let ribbonW = -1;
    const fillRibbon = force => {
      const vw = Math.max(window.innerWidth, document.documentElement.clientWidth, 320);
      if (!force && vw === ribbonW) return;
      ribbonW = vw;
      ribbon.innerHTML = '<span>' + set + '</span>';
      const one = ribbon.firstElementChild.getBoundingClientRect().width || 1200;
      const n = Math.max(1, Math.ceil((vw + 80) / one));
      const half = '<span>' + set.repeat(n) + '</span>';
      ribbon.innerHTML = half + half;
      ribbon.style.animationDuration = Math.round(one * n / 60) + 's';   // ~60 px в секунду на любом экране
    };
    fillRibbon(true);
    window.addEventListener('resize', () => fillRibbon());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fillRibbon(true));
  }

  /* ---------- шапка ---------- */
  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // подсветка текущего раздела в меню
  if ('IntersectionObserver' in window) {
    const links = $$('.nav a');
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) links.forEach(a => a.classList.toggle('is-cur', a.getAttribute('href') === '#' + e.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(a => { const s = $(a.getAttribute('href')); if (s) io.observe(s); });
  }

  /* ---------- ссылки на разделы: плавно и без #якоря в адресе ----------
     Якорь в адресе ни к чему: после обновления страница снова начинается
     с заставки и первого экрана, а не прыгает к разделу. */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    let t = null;
    try { t = document.querySelector(id); } catch (err) {}
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  });

  /* ---------- день и ночь ----------
     Переключатель — «небесное колесо»: при каждом нажатии диск поворачивается
     дальше по кругу, солнце садится за дюну, восходит полумесяц (и наоборот).
     Новая тема раскрывается кругом от переключателя (View Transitions);
     где это не поддерживается — цвета просто плавно меняются.
     Выбор запоминается на устройстве; тема до первой отрисовки ставится в <head>. */
  const themeBtn = $('#themeSwitch'), themeMeta = $('#themeColor');
  const isDay = () => root.dataset.theme === 'day';
  let dnRot = isDay() ? 360 : 180;
  function paintSwitch() {
    themeBtn.style.setProperty('--dn-rot', dnRot + 'deg');
    themeBtn.setAttribute('aria-pressed', String(isDay()));
    themeBtn.setAttribute('aria-label', isDay() ? 'Включить ночную тему' : 'Включить дневную тему');
  }
  function applyTheme(day) {
    if (day) root.dataset.theme = 'day'; else delete root.dataset.theme;
    if (themeMeta) themeMeta.setAttribute('content', day ? '#f4ead8' : '#070d1c');
    try { localStorage.setItem('site-theme', day ? 'day' : 'night'); } catch (e) {}
    paintSwitch();
    document.dispatchEvent(new CustomEvent('theme:change', { detail: { theme: day ? 'day' : 'night' } }));
  }
  if (themeBtn) {
    paintSwitch();
    themeBtn.addEventListener('click', () => {
      if (themeLocked) return nudgeLocked();
      const day = !isDay();
      dnRot += 180;                                     // колесо всегда крутится вперёд
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || calm) {
        root.classList.add('theme-fade');
        applyTheme(day);
        setTimeout(() => root.classList.remove('theme-fade'), 700);
        return;
      }
      const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const R = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      // внутри круга сразу готовая тема: на время перехода отключаем плавные задержки слоёв
      const vt = document.startViewTransition(() => { root.classList.add('theme-switching'); applyTheme(day); });
      vt.finished.finally(() => root.classList.remove('theme-switching'));
      vt.ready.then(() => root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${R}px at ${x}px ${y}px)`] },
        { duration: 900, easing: 'cubic-bezier(.4,0,.2,1)', pseudoElement: '::view-transition-new(root)' }
      )).catch(() => {});
    });
  }

  /* ---------- видео на первом экране ----------
     Одна камера над двором Мечети Пророка ﷺ. У каждой темы — переход и фон:
     день — рассвет (day: ночь → восход, зонты раскрываются) и день по кругу (dayLoop);
     ночь — закат (night: день → закат, зонты складываются, зажигаются огни) и ночь
     по кругу (nightLoop). Переключили тему — её переход играет один раз от начала
     до конца; пока он идёт, переключатель заблокирован, по его низу бежит золотая
     полоска. Под самый конец переход плавно сменяется фоном по кругу, а если фона
     нет — замирает на последнем кадре. Открыли сайт днём — после заставки сначала
     рассвет, потом день по кругу (dayOnLoad); ночью — сразу ночь по кругу.
     Кадр — целиком, как в самом видео: без обрезки, прижат к низу первого экрана;
     свободное место заполняет продолжение кадра (см. ниже). Фон крутится, только
     пока первый экран на виду. Пути — data.js → heroVideo. */
  const HV = S.heroVideo || {};
  const heroEl = $('.hero'), vBox = $('#heroVideo');
  const small = window.innerWidth < 820;
  const pick = k => (small && HV[k + 'Mobile']) || HV[k] || '';
  const still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SWAP_AT = 0.75;                         // за сколько секунд до конца перехода проявляется фон
  const THEMES = ['day', 'night'];
  let heroVisible = true, themeLocked = false;

  function makeVideo(src, loop, poster) {
    if (!vBox || !src) return null;
    const v = document.createElement('video');
    v.muted = true; v.loop = !!loop; v.playsInline = true; v.preload = 'none';
    ['muted', 'playsinline', 'disablepictureinpicture'].forEach(x => v.setAttribute(x, ''));
    v.setAttribute('aria-hidden', 'true');
    v.className = 'hero__vid--cam';
    if (poster) v.poster = poster;
    v.src = src;
    vBox.appendChild(v);
    return v;
  }
  // у каждой темы: intro — переход (играет один раз), loop — фон по кругу
  // (лежит над переходом и при смене проявляется поверх)
  const TH = {};
  THEMES.forEach(k => {
    TH[k] = { intro: makeVideo(pick(k), false, pick(k + 'Start')), loop: makeVideo(pick(k + 'Loop'), true, pick(k + 'LoopPoster')) };
  });
  const allVideos = THEMES.flatMap(k => [TH[k].intro, TH[k].loop]).filter(Boolean);
  const anyVideo = allVideos.length > 0;
  if (anyVideo) vBox.classList.add('has-video');

  let cur = isDay() ? 'day' : 'night';
  // фаза текущей темы: 'intro' — идёт переход; 'swap' — фон запущен и ждёт первого кадра;
  // 'fade' — фон проявляется поверх перехода; 'loop' — фон (или последний кадр перехода)
  let phase = 'loop';
  let played = false;                           // переход темы уже сыгран: без фона стоит его последний кадр

  /* кадр целиком: ролик вписан в первый экран без обрезки и прижат к низу (размер — --cam-w/-h).
     Свободное место над роликом (телефон, обычный монитор) заполняет продолжение кадра:
     его верхний край, растянутый и размытый, — небо тянется вверх. На экране шире кадра
     ролик во всю ширину и прижат к верху.
     Рисуется в маленький canvas под роликом и меняется вместе с кадром. */
  const RATIO = HV.ratio || 16 / 9;
  const amb = document.createElement('canvas');
  amb.className = 'hero__amb';
  amb.setAttribute('aria-hidden', 'true');
  const actx = anyVideo ? amb.getContext('2d') : null;
  if (anyVideo) vBox.prepend(amb);
  const box = { W: 0, H: 0, x: 0, y: 0, w: 0, h: 0 };
  function fitVideo() {
    if (!anyVideo) return;
    const W = vBox.clientWidth, H = vBox.clientHeight;
    if (!W || !H) return;
    // экран уже кадра — ролик целиком по ширине, прижат к низу, сверху продолжение неба;
    // экран шире кадра — ролик во всю ширину, прижат к верху (луна и солнце целы), снизу
    // срезается немного двора — без полос по бокам
    const w = W, h = W / RATIO, wide = h > H;
    Object.assign(box, { W, H, w, h, x: 0, y: wide ? 0 : H - h });
    vBox.classList.toggle('fit-wide', wide);
    vBox.style.setProperty('--cam-w', w.toFixed(1) + 'px');
    vBox.style.setProperty('--cam-h', h.toFixed(1) + 'px');
    vBox.classList.toggle('fit-top', box.y > 2);
    amb.width = 96; amb.height = Math.max(8, Math.round(96 * H / W));
    drawAmb();
  }
  const posters = new Map();                    // кадр-заставка ролика — пока тот не пошёл
  function frameOf(v) {
    if (v.readyState >= 2 && v.videoWidth) return [v, v.videoWidth, v.videoHeight];
    let im = posters.get(v);
    if (!im && v.poster) { im = new Image(); im.onload = () => drawAmb(); im.src = v.poster; posters.set(v, im); }
    return im && im.complete && im.naturalWidth ? [im, im.naturalWidth, im.naturalHeight] : null;
  }
  function onScreen() {
    const t = TH[cur];
    if (t.loop && t.loop.classList.contains('is-on')) return t.loop;
    if (t.intro && t.intro.classList.contains('is-on')) return t.intro;
    return null;
  }
  function drawAmb() {
    if (!actx || !box.W) return;
    const v = onScreen(), f = v && frameOf(v);
    if (!f) return;
    const [src, sw, sh] = f, k = amb.width / box.W;
    const x = box.x * k, y = box.y * k, w = box.w * k, h = box.h * k;
    try {
      actx.drawImage(src, 0, 0, sw, sh, x, y, w, h);
      if (y > 0) actx.drawImage(src, 0, 0, sw, sh * 0.05, x, 0, w, y + 1);                          // небо — вверх
    } catch (e) {}
  }
  // пока ролик идёт и первый экран на виду — продолжение кадра обновляется ~15 раз в секунду
  let ambRaf = 0, ambT = 0;
  function ambTick(ts) {
    ambRaf = 0;
    if (!heroVisible || document.hidden) return;
    if (ts - ambT > 66) { ambT = ts; drawAmb(); }
    const v = onScreen();
    if (v && !v.paused) ambRaf = requestAnimationFrame(ambTick);
  }
  const ambKick = () => { if (!ambRaf) ambRaf = requestAnimationFrame(ambTick); };
  allVideos.forEach(v => {
    v.addEventListener('playing', ambKick);
    ['loadeddata', 'seeked'].forEach(t => v.addEventListener(t, () => drawAmb()));
  });

  function markHero() {
    let on = false;
    THEMES.forEach(k => {
      const t = TH[k], here = k === cur;
      const loopOn = !!t.loop && here && (phase === 'fade' || phase === 'loop');
      // переход уходит, только когда фон проявился целиком — без просвета между ними
      const introOn = !!t.intro && here && (phase === 'intro' || phase === 'swap' || phase === 'fade' || (!t.loop && played));
      if (t.intro) t.intro.classList.toggle('is-on', introOn);
      if (t.loop) t.loop.classList.toggle('is-on', loopOn);
      if (here) on = introOn || loopOn;
    });
    heroEl.classList.toggle('video-on', on);
    root.classList.toggle('is-hero-video', on);
    drawAmb(); ambKick();
  }

  // блокировка переключателя и полоска «сколько осталось»
  let lockRaf = 0, lockT = 0, tipT = 0, tip = null, showT = 0, syncT = 0;
  function lockTheme(on, v) {
    themeLocked = on;
    themeBtn.classList.toggle('is-locked', on);
    themeBtn.setAttribute('aria-disabled', String(on));
    themeBtn.title = on ? 'Дождитесь конца видео — потом можно переключить тему' : 'День / ночь';
    cancelAnimationFrame(lockRaf);
    if (on) {
      const tick = () => {
        const t = v.currentTime, d = v.duration;
        themeBtn.style.setProperty('--vp', Math.min(1, t / (d || 15)).toFixed(3));
        if (d && d - t < SWAP_AT) toLoop();
        lockRaf = requestAnimationFrame(tick);
      };
      tick();
    } else {
      clearTimeout(lockT);
      themeBtn.style.removeProperty('--vp');
      if (tip) tip.classList.remove('is-on');
    }
  }
  function nudgeLocked() {
    themeBtn.classList.remove('is-nudge'); void themeBtn.offsetWidth; themeBtn.classList.add('is-nudge');
    if (!tip) {
      tip = document.createElement('span');
      tip.className = 'dn-tip';
      tip.setAttribute('role', 'status');
      tip.textContent = 'Досмотрите видео — потом тему можно переключить';
      themeBtn.parentNode.appendChild(tip);
    }
    // под переключателем, но не за краем экрана
    const sr = themeBtn.parentNode.getBoundingClientRect(), br = themeBtn.getBoundingClientRect();
    tip.style.left = Math.max(12 - sr.left, Math.min(br.left - sr.left, window.innerWidth - 12 - tip.offsetWidth - sr.left)) + 'px';
    tip.classList.add('is-on');
    clearTimeout(tipT);
    tipT = setTimeout(() => tip.classList.remove('is-on'), 2400);
  }

  // переход → фон: фон стартует с начала (его первый кадр — последний кадр перехода)
  // и проявляется поверх, как только пошёл; quick — не ждать, показать сразу
  function toLoop(quick) {
    if (phase !== 'intro') return;
    const k = cur, L = TH[k].loop;
    if (!L) { phase = 'loop'; markHero(); return; }   // фона нет — переход замирает на последнем кадре
    phase = 'swap';
    try { L.currentTime = 0; } catch (e) {}
    const show = () => {
      L.removeEventListener('playing', show);
      clearTimeout(showT);
      if (phase !== 'swap' || cur !== k) return;
      phase = 'fade';
      L.classList.add('is-swap');
      markHero();
      showT = setTimeout(() => {
        L.classList.remove('is-swap');
        if (phase === 'fade' && cur === k) { phase = 'loop'; markHero(); }
      }, 800);
    };
    if (quick) { show(); syncLoops(); return; }
    L.addEventListener('playing', show);
    showT = setTimeout(show, 1500);             // не пошёл (экран прокручен, медленная сеть) — показать кадр
    syncLoops();
  }

  // переход текущей темы: один раз от начала до конца, переключатель ждёт
  function playIntro() {
    const t = TH[cur], v = t.intro;
    if (!v || still) { phase = 'loop'; return; }   // без анимаций — сразу фон
    phase = 'intro'; played = true;
    v.preload = 'auto';
    if (t.loop) { t.loop.pause(); t.loop.preload = 'auto'; } // фон грузится, пока идёт переход
    try { v.currentTime = 0; } catch (e) {}
    lockTheme(true, v);
    let done = false;
    const finish = quick => { if (done) return; done = true; lockTheme(false); toLoop(quick); };
    v.onended = () => finish(false);
    v.onerror = () => finish(true);
    // страховка: если конец так и не пришёл (медленная сеть, свернули вкладку) — разблокируем
    lockT = setTimeout(() => finish(true), 30000);
    const p = v.play();
    if (p && p.catch) p.catch(() => finish(true));   // телефон не дал запустить — сразу фон
  }
  // ушли из темы: когда её ролик растворился — пауза, переход на начало (в следующий раз без вспышки)
  function leave(k) {
    setTimeout(() => {
      if (cur === k) return;
      const t = TH[k];
      if (t.intro) { t.intro.pause(); try { t.intro.currentTime = 0; } catch (e) {} }
      if (t.loop) t.loop.pause();
    }, 1300);
  }
  // фон по кругу играет, только пока первый экран на виду и вкладка открыта
  function syncLoops() {
    const want = k => !!TH[k].loop && cur === k && phase !== 'intro' && heroVisible && !document.hidden && !still;
    THEMES.forEach(k => {
      if (!want(k)) return;
      const L = TH[k].loop; L.preload = 'auto';
      const p = L.play(); if (p && p.catch) p.catch(() => {});
    });
    clearTimeout(syncT);                          // остановка — после того как ролик растворился
    syncT = setTimeout(() => THEMES.forEach(k => { const L = TH[k].loop; if (L && !want(k)) L.pause(); }), 1300);
    ambKick();
  }

  if (anyVideo) {
    // открыли сайт днём — после заставки сначала рассвет, потом день по кругу
    const dawnFirst = cur === 'day' && HV.dayOnLoad !== false && !!TH.day.intro && !still;
    if (dawnFirst) {
      phase = 'intro'; played = true;             // на месте первый кадр рассвета
      TH.day.intro.preload = 'auto';              // грузится, пока идёт заставка
      if (TH.day.loop) TH.day.loop.preload = 'auto';
    }
    fitVideo();
    if ('ResizeObserver' in window) new ResizeObserver(fitVideo).observe(vBox);
    else window.addEventListener('resize', fitVideo, { passive: true });
    markHero();
    document.addEventListener('theme:change', e => {
      const next = e.detail.theme === 'day' ? 'day' : 'night';
      if (next === cur) return;
      const prev = cur;
      cur = next; played = false; phase = 'loop';
      playIntro();
      leave(prev);
      markHero();
      syncLoops();
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(es => { heroVisible = es[0].isIntersecting; syncLoops(); }).observe(heroEl);
    }
    document.addEventListener('visibilitychange', syncLoops);
    if (dawnFirst) {
      const start = () => { if (cur === 'day' && phase === 'intro') playIntro(); };
      if (root.classList.contains('is-intro')) document.addEventListener('intro:done', start, { once: true });
      else start();
    }
    syncLoops();
    // переход другой темы заранее подгружается, когда рука тянется к переключателю
    const warm = () => {
      if (still) return;
      const v = TH[cur === 'day' ? 'night' : 'day'].intro;
      if (v && v.preload === 'none') v.preload = 'auto';
    };
    ['pointerenter', 'touchstart', 'focus'].forEach(t => themeBtn.addEventListener(t, warm, { passive: true }));
  }

  /* ---------- мобильное меню ---------- */
  const menu = $('#menu'), burger = $('#burger');
  function setMenu(open) {
    menu.hidden = !open;
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    root.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth >= 1080 && !menu.hidden) setMenu(false); });

  /* ---------- появление при прокрутке ---------- */
  let revealIO = null;
  if ('IntersectionObserver' in window) {
    revealIO = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealIO.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  }
  function reveal(scope) {
    $$('.rise:not(.is-in)', scope).forEach((el, i) => {
      if (!el.style.getPropertyValue('--rd')) el.style.setProperty('--rd', (i % 3) * 0.08 + 's');
      revealIO ? revealIO.observe(el) : el.classList.add('is-in');
    });
  }
  // страховка: если наблюдатель молчит (фоновая вкладка) — всё, что в кадре, показываем по таймеру
  function revealVisible() {
    const rt = $('#route');
    if (rt) { const r = rt.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) rt.classList.add('is-walk'); }
    $$('.rise:not(.is-in)').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('is-in');
    });
  }
  $$('.sec-head').forEach(h => {
    h.classList.add('rise');
    const ar = $('.sec-label i[lang="ar"]', h);          // арабское имя раздела — огромной вязью за заголовком
    if (ar) h.insertAdjacentHTML('afterbegin', `<span class="sec-ar" lang="ar" dir="rtl" aria-hidden="true">${esc(ar.textContent)}</span>`);
  });

  /* ==========================================================================
     РАБОТЫ
     ========================================================================== */
  const COUNTRIES = ['Россия', 'Саудовская Аравия'];
  const cities = new Set(projects.map(p => p.city).filter(c => !COUNTRIES.includes(c)));
  const countries = new Set(projects.map(p => p.region));
  $('#stats').innerHTML = [
    [projects.length, ['сайт', 'сайта', 'сайтов']],
    [cities.size, ['город', 'города', 'городов']],
    [countries.size, ['страна', 'страны', 'стран']]
  ].map(([n, f]) => `<li><b class="num">${n}</b>${plural(n, f)}</li>`).join('');

  const grid = $('#workGrid'), filtersEl = $('#filters'), moreBtn = $('#workMore');
  const FIRST = 6;
  let filter = 'all', expanded = false;

  filtersEl.innerHTML = S.filters.map(f => {
    const n = f.id === 'all' ? projects.length : projects.filter(p => p[f.key] === f.id).length;
    return n ? `<button class="chip${f.id === 'all' ? ' is-on' : ''}" role="tab" aria-selected="${f.id === 'all'}" data-f="${f.id}">${esc(f.label)} <small>${n}</small></button>` : '';
  }).join('');

  grid.innerHTML = projects.map(p => `
    <article class="wcard rise" style="--accent:${esc(p.accent)}" data-slug="${esc(p.slug)}">
      <button class="wcard__stage" type="button" data-case="${esc(p.slug)}" aria-label="Подробнее о проекте ${esc(p.title)}">
        <span class="browser"><span class="browser__bar"><i></i><i></i><i></i><span></span></span>
          <img src="assets/img/work/${esc(p.slug)}-pc.webp" alt="" width="1080" height="675" loading="lazy" decoding="async"></span>
        <span class="phone"><span class="phone__screen"><span class="phone__island"></span>
          <img class="phone__shot" src="assets/img/work/${esc(p.slug)}-long.webp" alt="" loading="lazy" decoding="async"></span></span>
      </button>
      <div class="wcard__body">
        <p class="wcard__meta"><i></i>${esc(p.city)} · ${esc(p.type)}</p>
        <h3 class="wcard__title">${esc(p.title)}</h3>
        <p class="wcard__sum">${esc(p.summary)}</p>
        <ul class="tags">${p.features.slice(0, 4).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        <div class="wcard__actions">
          ${openBtn(p, 'btn--dark btn--sm')}
          <button class="btn btn--line btn--sm" type="button" data-case="${esc(p.slug)}">Подробнее</button>
        </div>
      </div>
    </article>`).join('');

  const cards = $$('.wcard', grid);

  function applyFilter() {
    const f = S.filters.find(x => x.id === filter);
    let shown = 0;
    cards.forEach(c => {
      const p = projects.find(x => x.slug === c.dataset.slug);
      const match = filter === 'all' || p[f.key] === filter;
      const visible = match && (filter !== 'all' || expanded || shown < FIRST);
      if (match && visible) shown++;
      c.classList.toggle('is-hidden', !visible);
    });
    const total = filter === 'all' ? projects.length : shown;
    moreBtn.parentElement.hidden = !(filter === 'all' && !expanded && total > FIRST);
    moreBtn.textContent = `Показать все ${projects.length} ${plural(projects.length, ['работу', 'работы', 'работ'])}`;
    requestAnimationFrame(() => { reveal(grid); measureAll(); });
    setTimeout(revealVisible, 400);
  }
  filtersEl.addEventListener('click', e => {
    const b = e.target.closest('.chip'); if (!b) return;
    filter = b.dataset.f;
    $$('.chip', filtersEl).forEach(x => { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b); });
    applyFilter();
  });
  moreBtn.addEventListener('click', () => { expanded = true; applyFilter(); });

  /* ---------- телефоны в карточках листают сайты — все вместе ----------
     У всех анимаций общие «часы»: одинаковая длительность и общий старт,
     поэтому телефоны едут вниз и возвращаются наверх синхронно. Пока раздел
     работ не на экране, часы стоят; картинка, догрузившаяся позже, встаёт
     в общий ритм. Расстояние считается в пикселях для каждой картинки —
     без CSS-переменных в keyframes, которые не все браузеры пересчитывают. */
  const SHOT_MS = 20000;                       // вниз за 20 с, столько же обратно
  const calm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shotAnims = new Map();
  const clock = () => (document.timeline && document.timeline.currentTime != null) ? document.timeline.currentTime : performance.now();
  let shotT0 = null, shotFrozen = 0, shotsOn = false;

  function buildShot(card) {
    const img = $('.phone__shot', card), scr = img && img.parentElement;
    const old = shotAnims.get(card);
    if (old) { old.cancel(); shotAnims.delete(card); }
    if (calm || !img || !img.animate || !img.complete || !img.naturalHeight || !scr.clientHeight) return;
    const shift = Math.round(img.offsetHeight - scr.clientHeight);
    if (shift < 20) return;
    const a = img.animate([
      { transform: 'translateY(0)', offset: 0 },
      { transform: 'translateY(0)', offset: 0.03, easing: 'cubic-bezier(.3,.12,.7,.88)' },   // почти ровная скорость, мягко на концах
      { transform: `translateY(${-shift}px)`, offset: 0.97 },
      { transform: `translateY(${-shift}px)`, offset: 1 }
    ], { duration: SHOT_MS, iterations: Infinity, direction: 'alternate' });
    if (shotsOn) {
      if (shotT0 == null) shotT0 = clock();
      a.startTime = shotT0;                    // общий старт — в ногу с остальными
    } else {
      a.pause();
      a.currentTime = shotFrozen;
    }
    shotAnims.set(card, a);
  }
  function buildShots() { cards.forEach(c => { if (!c.classList.contains('is-hidden')) buildShot(c); }); }
  function runShots(on) {
    if (on === shotsOn) return;
    shotsOn = on;
    if (on) {
      shotT0 = clock() - shotFrozen;
      shotAnims.forEach(a => { a.startTime = shotT0; });
    } else {
      shotFrozen = shotT0 == null ? 0 : clock() - shotT0;
      shotAnims.forEach(a => { a.pause(); a.currentTime = shotFrozen; });
    }
  }
  const measureAll = buildShots;               // вызывается после фильтра и «Показать все»
  cards.forEach(c => { $('.phone__shot', c).addEventListener('load', () => buildShot(c)); });
  let rsT; window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(buildShots, 200); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => runShots(es[0].isIntersecting), { rootMargin: '120px 0px' }).observe(grid);
  } else runShots(true);

  /* ---------- окно кейса ---------- */
  const caseEl = $('#case'), caseBox = $('.case__box', caseEl), caseStage = $('#caseStage'), caseBody = $('#caseBody');
  let caseIdx = -1, caseOpener = null;

  function openCase(slug, opener) {
    const i = projects.findIndex(p => p.slug === slug);
    if (i < 0) return;
    caseIdx = i;
    const p = projects[i];
    const prev = projects[(i - 1 + projects.length) % projects.length], next = projects[(i + 1) % projects.length];
    caseBox.style.setProperty('--accent', p.accent);
    caseStage.innerHTML = `
      <span class="browser"><span class="browser__bar"><i></i><i></i><i></i><span></span></span>
        <img src="assets/img/work/${esc(p.slug)}-pc.webp" alt="Сайт «${esc(p.title)}» на компьютере" width="1080" height="675"></span>
      <span class="phone"><span class="phone__screen" tabindex="0" aria-label="Сайт на телефоне — можно листать"><span class="phone__island"></span>
        <img class="phone__shot" src="assets/img/work/${esc(p.slug)}-long.webp" alt="Сайт «${esc(p.title)}» на телефоне"></span></span>
      <p class="case__tip">↕ Листайте экран телефона — это настоящая мобильная версия</p>`;
    caseBody.innerHTML = `
      <p class="case__meta">${esc(p.city)} · ${esc(p.type)} · 2026</p>
      <h3 class="case__title" id="caseTitle">${esc(p.title)}</h3>
      <p class="case__sum">${esc(p.summary)}</p>
      <p class="case__h">Что сделано</p>
      <ul class="case__list">${p.features.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      ${p.motifs && p.motifs.length ? `<p class="case__h">Узоры и мотивы</p><ul class="case__motifs">${p.motifs.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
      <div class="case__actions">
        ${openBtn(p, 'btn--dark')}
        <button class="btn btn--line" type="button" data-like="${esc(p.slug)}">Хочу похожий</button>
      </div>
      <div class="case__nav">
        <button type="button" data-go="-1">${icon('i-left')}${esc(prev.title)}</button>
        <button type="button" data-go="1">${esc(next.title)}${icon('i-left')}</button>
      </div>`;
    caseBody.scrollTop = 0; caseBox.scrollTop = 0;
    if (caseEl.hidden) {
      caseOpener = opener || document.activeElement;
      caseEl.hidden = false;
      root.classList.add('menu-open');
      setTimeout(() => $('.case__x', caseEl).focus({ preventScroll: true }), 50);
    }
  }
  function closeCase() {
    if (caseEl.hidden) return;
    caseEl.hidden = true;
    root.classList.remove('menu-open');
    if (caseOpener && caseOpener.focus) caseOpener.focus({ preventScroll: true });
  }
  grid.addEventListener('click', e => { const b = e.target.closest('[data-case]'); if (b) openCase(b.dataset.case, b); });
  caseEl.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) return closeCase();
    const like = e.target.closest('[data-like]');
    if (like) { closeCase(); return briefPrefill({ what: 'Сайт', project: like.dataset.like }); }
    const g = e.target.closest('[data-go]');
    if (g) openCase(projects[(caseIdx + +g.dataset.go + projects.length) % projects.length].slug);
  });
  document.addEventListener('keydown', e => {
    if (caseEl.hidden) return;
    if (e.key === 'Escape') closeCase();
    if (e.key === 'ArrowRight') openCase(projects[(caseIdx + 1) % projects.length].slug);
    if (e.key === 'ArrowLeft') openCase(projects[(caseIdx - 1 + projects.length) % projects.length].slug);
  });

  applyFilter();

  /* ==========================================================================
     БОТЫ И MINI APPS
     Экраны мини-аппа снимает node tools/shots.mjs (по вкладкам из data.js).
     На компьютере телефоны стоят веером, на телефоне листаются пальцем.
     ========================================================================== */
  const appsList = $('#appsList');
  if (appsList && (S.apps || []).length) {
    appsList.innerHTML = S.apps.map(ap => {
      const screens = (ap.shots && ap.shots.screens) || [];
      const bot = ap.bot ? 'https://t.me/' + ap.bot : '';
      return `
      <article class="app-card rise" style="--accent:${esc(ap.accent || '#2fa36f')}">
        <div class="app-phones" aria-label="Экраны мини-аппа ${esc(ap.title)}">
          ${screens.map((sc, i) => `
          <figure class="app-ph" style="--i:${i};--n:${screens.length}">
            <span class="phone"><span class="phone__screen">
              <span class="app-tg"><b>✕ Закрыть</b><i>${esc(ap.title)}</i><b>···</b></span>
              <img src="assets/img/work/${esc(ap.slug)}-${esc(sc.name)}.webp" alt="${esc(ap.title)}: ${esc(sc.caption || sc.name)}" width="585" height="1266" loading="lazy" decoding="async">
            </span></span>
            <figcaption>${esc(sc.caption || '')}</figcaption>
          </figure>`).join('')}
        </div>
        <div class="app-info">
          <div>
            <p class="wcard__meta"><i></i>${esc(ap.city)} · ${esc(ap.type)}</p>
            <h3 class="app-title">${esc(ap.title)}</h3>
            <p class="app-sum">${esc(ap.summary)}</p>
          </div>
          <div>
            <ul class="tags">${(ap.features || []).map(t => `<li>${esc(t)}</li>`).join('')}</ul>
            <div class="app-actions">
              ${bot ? `<a class="btn btn--gold" href="${esc(bot)}" target="_blank" rel="noopener">${icon('i-tg')}Открыть в Telegram</a>` : ''}
              ${ap.live ? `<a class="btn btn--ghost" href="${esc(ap.live)}" target="_blank" rel="noopener">Открыть в браузере${icon('i-ext')}</a>` : ''}
              ${(S.reviews || []).some(r => r.app === ap.slug) ? `<a class="btn btn--ghost" href="#rv-${esc(ap.slug)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg>Видеоотзыв клиента</a>` : ''}
            </div>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  /* ==========================================================================
     УСЛУГИ
     ========================================================================== */
  const phonesArt = `
    <div class="svc__phones" aria-hidden="true">
      <div class="mp mp--a"><div class="mp__s">
        <span class="mp__push"><i></i><b></b></span>
        <span class="mp__h"></span>
        <span class="mp__row" style="--c:#2fa36f"><i></i><b></b></span>
        <span class="mp__row" style="--c:#e4b45e"><i></i><b></b></span>
        <span class="mp__row" style="--c:#d9776b"><i></i><b></b></span>
        <span class="mp__row" style="--c:#3f8fd6"><i></i><b></b></span>
        <span class="mp__tab"><i></i><i></i><i></i></span>
      </div><span class="mp__label">iOS</span></div>
      <div class="mp mp--b"><div class="mp__s">
        <span class="mp__h"></span>
        <span class="mp__row" style="--c:#e4b45e"><i></i><b></b></span>
        <span class="mp__row" style="--c:#2fa36f"><i></i><b></b></span>
        <span class="mp__row" style="--c:#8f7bff"><i></i><b></b></span>
        <span class="mp__tab"><i></i><i></i><i></i></span>
      </div><span class="mp__label">Android</span></div>
    </div>`;
  $('#svcGrid').innerHTML = S.services.map(s => `
    <article class="svc__card rise${s.featured ? ' svc__card--featured' : ''}">
      ${s.featured ? '<span class="svc__badge">В фокусе · iOS и Android</span>' : ''}
      <div class="svc__top"><svg class="svc__ico" aria-hidden="true"><use href="#s-${esc(s.id)}"/></svg><span class="svc__ar" lang="ar" dir="rtl">${esc(s.ar)}</span></div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
      ${s.featured ? phonesArt : ''}
      <ul class="svc__pts">${s.points.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
      ${s.featured ? '<a class="btn btn--gold btn--sm svc__demo" href="#demo">Попробовать демо' + icon('i-arrow') + '</a>' : ''}
    </article>`).join('');

  /* ==========================================================================
     ДЕМО: бот, мини-апп и приложение в одном телефоне
     ========================================================================== */
  const D = S.demo;
  const screen = $('#demoScreen'), about = $('#demoAbout');
  const vBot = $('#vBot'), vMini = $('#vMini'), vApp = $('#vApp'), pushEl = $('#dsPush');
  let tab = 'bot', demoSeen = false;

  function setTab(t) {
    tab = t;
    $$('.tab').forEach(b => { const on = b.dataset.tab === t; b.classList.toggle('is-on', on); b.setAttribute('aria-selected', on); });
    $$('.ds-view', screen).forEach(v => v.classList.toggle('is-on', v.dataset.view === t));
    screen.classList.toggle('is-light', t !== 'bot');
    const a = D.about[t];
    about.innerHTML = `<h3>${esc(a.h)}</h3><p>${esc(a.p)}</p><ul>${a.li.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    if (t === 'bot' && demoSeen) botStart();
  }
  $$('.tab').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));

  let pushT;
  function push(ico, ttl, txt) {
    pushEl.innerHTML = `<i>${ico}</i><div><b>${esc(ttl)} <small>сейчас</small></b><p>${esc(txt)}</p></div>`;
    pushEl.classList.add('is-on');
    clearTimeout(pushT);
    pushT = setTimeout(() => pushEl.classList.remove('is-on'), 3800);
  }

  /* --- бот --- */
  vBot.innerHTML = `
    <div class="tg-head"><span class="tg-back">‹</span><span class="tg-ava">🌴</span><div><b>${esc(D.cafe)}</b><small>бот · демо</small></div></div>
    <div class="tg-chat" id="botChat"></div>
    <div class="tg-kb" id="botKb">${D.bot.keyboard.map((k, i) => `<button type="button" data-k="${i}">${esc(k)}</button>`).join('')}</div>`;
  const chat = $('#botChat', vBot);
  let botStarted = false, botBusy = false;
  const now = () => new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' }).format(new Date());

  function addMsg(cls, html) {
    const m = document.createElement('div');
    m.className = 'msg ' + cls;
    m.innerHTML = html;
    chat.appendChild(m);
    chat.scrollTop = chat.scrollHeight;
    return m;
  }
  function botSay(text, btns, delay) {
    botBusy = true;
    const typing = addMsg('msg--bot msg--typing', '<i></i><i></i><i></i>');
    return new Promise(res => setTimeout(() => {
      typing.remove();
      addMsg('msg--bot', esc(text).replace(/\n/g, '<br>') +
        (btns ? `<div class="msg__btns">${btns.map(b => `<button type="button" data-act="${b.act}">${esc(b.label)}</button>`).join('')}</div>` : '') +
        `<small>${now()}</small>`);
      botBusy = false; res();
    }, delay || 750));
  }
  function botStart() {
    if (botStarted) return;
    botStarted = true;
    botSay(D.bot.hello, null, 900);
  }
  vBot.addEventListener('click', e => {
    const k = e.target.closest('[data-k]'), a = e.target.closest('[data-act]');
    if (k && !botBusy) {
      const i = +k.dataset.k;
      addMsg('msg--me', esc(D.bot.keyboard[i]) + `<small>${now()} ✓✓</small>`);
      const r = D.bot.replies[i];
      botSay(r.text, r.btn ? [r.btn] : null);
    }
    if (a) {
      if (a.dataset.act === 'menu') setTab('mini');
      if (a.dataset.act === 'talk') briefPrefill({ what: 'Telegram-бот', project: null });
    }
  });

  /* --- мини-апп --- */
  const cart = {};
  vMini.innerHTML = `
    <div class="ma-head"><button type="button" data-close-mini>✕ Закрыть</button><b>${esc(D.cafe)}</b><span>···</span></div>
    <div class="ma-hero"><b>${esc(D.mini.title)}</b><small>${esc(D.mini.sub)}</small></div>
    <div class="ma-grid">${D.menu.map((m, i) => `
      <div class="ma-item" data-i="${i}"><em>${m.e}</em><b>${esc(m.n)}</b><small>${m.p} SAR</small>
        <div class="ma-step"><button class="minus" type="button" data-d="-1" aria-label="Убрать" hidden>−</button><span hidden>0</span><button type="button" data-d="1" aria-label="Добавить">+</button></div>
      </div>`).join('')}</div>
    <button class="ma-main" type="button" id="maMain"></button>
    <div class="ds-done" id="maDone"><i>✓</i><b>Заказ отправлен</b><p>Бот пришлёт подтверждение в чат</p></div>`;
  const maMain = $('#maMain', vMini), maDone = $('#maDone', vMini);
  function cartSum() { return D.menu.reduce((s, m, i) => s + (cart[i] || 0) * m.p, 0); }
  function renderCart() {
    $$('.ma-item', vMini).forEach(it => {
      const n = cart[it.dataset.i] || 0;
      $('.minus', it).hidden = !n;
      const sp = $('span', it); sp.hidden = !n; sp.textContent = n;
    });
    const sum = cartSum();
    maMain.textContent = `Заказать · ${sum} SAR`;
    maMain.classList.toggle('is-on', sum > 0);
  }
  vMini.addEventListener('click', e => {
    if (e.target.closest('[data-close-mini]')) return setTab('bot');
    const b = e.target.closest('[data-d]');
    if (b) {
      const i = b.closest('.ma-item').dataset.i;
      cart[i] = clamp((cart[i] || 0) + +b.dataset.d, 0, 9);
      renderCart();
    }
  });
  maMain.addEventListener('click', () => {
    const lines = D.menu.map((m, i) => cart[i] ? `${m.n} × ${cart[i]}` : '').filter(Boolean);
    const sum = cartSum();
    if (!sum) return;
    maDone.classList.add('is-on');
    setTimeout(() => {
      Object.keys(cart).forEach(k => delete cart[k]);
      renderCart();
      maDone.classList.remove('is-on');
      setTab('bot');
      const no = 1040 + Math.floor(Math.random() * 60);
      botSay(`✅ Заказ №${no} принят!\n${lines.join('\n')}\nИтого: ${sum} SAR · будет готов через 15 минут.`, null, 900)
        .then(() => setTimeout(() => addMsg('msg--note', '📣 Владельцу кафе пришло уведомление о заказе'), 500));
    }, 1300);
  });
  renderCart();

  /* --- приложение --- */
  const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; });
  const booking = { svc: 0, day: 0, time: null };
  const ICONS = {
    home: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 3 2 11h3v9h5v-6h4v6h5v-9h3z'/%3E%3C/svg%3E\")",
    cal: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M7 2h2v2h6V2h2v2h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3zm12 7H5v10h14z'/%3E%3C/svg%3E\")",
    user: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10zm0 2c-5 0-9 2.5-9 6v2h18v-2c0-3.5-4-6-9-6z'/%3E%3C/svg%3E\")"
  };
  vApp.innerHTML = `
    <div class="ap-top"><small>${esc(D.app.brand)}</small><h4>Запись</h4></div>
    <div class="ap-scroll">
      <p class="ap-h">Услуга</p>
      <div class="ap-seg">${D.app.services.map((s, i) => `<button type="button" data-svc="${i}"${i === 0 ? ' class="is-on"' : ''}>${esc(s.n)}<small>${s.p} SAR</small></button>`).join('')}</div>
      <p class="ap-h">День</p>
      <div class="ap-days">${days.map((d, i) => `<button type="button" data-day="${i}"${i === 0 ? ' class="is-on"' : ''}><small>${i === 0 ? 'сег' : WD[d.getDay()]}</small><b>${d.getDate()}</b></button>`).join('')}</div>
      <p class="ap-h">Время</p>
      <div class="ap-times" id="apTimes"></div>
    </div>
    <button class="ap-cta" type="button" id="apCta" disabled>Выберите время</button>
    <nav class="ap-tabbar" aria-hidden="true"><span><i style="--m:${ICONS.home}"></i>Главная</span><span class="is-on"><i style="--m:${ICONS.cal}"></i>Запись</span><span><i style="--m:${ICONS.user}"></i>Профиль</span></nav>
    <div class="ds-done" id="apDone"><i>✓</i><b>Вы записаны</b><p id="apDoneTxt"></p><button type="button" id="apAgain">Готово</button></div>`;
  const apTimes = $('#apTimes', vApp), apCta = $('#apCta', vApp), apDone = $('#apDone', vApp);
  function renderTimes() {
    apTimes.innerHTML = D.app.times.map((t, i) => {
      const busy = (i + booking.day * 2) % 3 === 1;
      return `<button type="button" data-time="${esc(t)}"${busy ? ' disabled' : ''}${booking.time === t ? ' class="is-on"' : ''}>${esc(t)}</button>`;
    }).join('');
    const s = D.app.services[booking.svc];
    apCta.disabled = !booking.time;
    apCta.textContent = booking.time ? `Записаться · ${s.p} SAR` : 'Выберите время';
  }
  vApp.addEventListener('click', e => {
    const sv = e.target.closest('[data-svc]'), dy = e.target.closest('[data-day]'), tm = e.target.closest('[data-time]');
    if (sv) { booking.svc = +sv.dataset.svc; $$('[data-svc]', vApp).forEach(b => b.classList.toggle('is-on', b === sv)); renderTimes(); }
    if (dy) { booking.day = +dy.dataset.day; booking.time = null; $$('[data-day]', vApp).forEach(b => b.classList.toggle('is-on', b === dy)); renderTimes(); }
    if (tm && !tm.disabled) { booking.time = tm.dataset.time; renderTimes(); }
  });
  apCta.addEventListener('click', () => {
    if (!booking.time) return;
    const d = days[booking.day], s = D.app.services[booking.svc];
    const when = `${WD[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} · ${booking.time}`;
    $('#apDoneTxt', vApp).textContent = `${when}\n${s.n} · ${s.p} SAR`;
    apDone.classList.add('is-on');
    setTimeout(() => push('✂', D.app.short, `Запись подтверждена: ${when}. Напомним за 2 часа.`), 1100);
  });
  $('#apAgain', vApp).addEventListener('click', () => { apDone.classList.remove('is-on'); booking.time = null; renderTimes(); });
  renderTimes();

  setTab('bot');
  // приветствие бота — когда демо впервые окажется на экране
  const seeDemo = () => { demoSeen = true; if (tab === 'bot') botStart(); };
  if ('IntersectionObserver' in window) {
    const dio = new IntersectionObserver(es => { if (es[0].isIntersecting) { seeDemo(); dio.disconnect(); } }, { threshold: 0.4 });
    dio.observe(screen);
  } else seeDemo();

  /* ==========================================================================
     КАК РАБОТАЮ — путь каравана: пять стоянок у колодцев, между ними следы.
     Следы «проходят» путь, когда раздел появляется на экране.
     ========================================================================== */
  const route = $('#route');
  route.innerHTML = `
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <radialGradient id="wellG" cx="50%" cy="40%" r="62%"><stop offset="0" stop-color="#1f4d60"/><stop offset=".7" stop-color="#10243c"/><stop offset="1" stop-color="#0b1428"/></radialGradient>
    </defs></svg>` + S.process.map((s, i) => `
    <li class="stop rise" style="--rd:${i * 0.08}s">
      <div class="stop__mark" aria-hidden="true">
        <svg viewBox="0 0 100 100"><circle class="stop__stone" cx="50" cy="50" r="45"/><circle class="stop__joints" cx="50" cy="50" r="39.5"/>
          <circle cx="50" cy="50" r="34" fill="url(#wellG)"/><path class="stop__glint" d="M35 74q7.5-4 15 0t15 0"/></svg>
        <span class="stop__n num">${esc(s.n)}</span>
      </div>
      <div><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div>
    </li>`).join('');
  const walkRoute = () => route.classList.add('is-walk');
  if ('IntersectionObserver' in window) {
    const rio = new IntersectionObserver(es => { if (es[0].isIntersecting) { walkRoute(); rio.disconnect(); } }, { threshold: 0.2 });
    rio.observe(route);
  } else walkRoute();

  /* ==========================================================================
     ОТЗЫВЫ
     ========================================================================== */
  // **фраза** в тексте отзыва → выделение маркером
  const rich = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<mark>$1</mark>');
  const ratioOf = r => { const m = /^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/.exec(r.ratio || ''); return m ? [+m[1], +m[2]] : [16, 9]; };
  const tall = r => { const [w, h] = ratioOf(r); return w < h; };
  $('#rvGrid').innerHTML = S.reviews.map((r, i) => r.video ? `
    <figure class="rv__card rv__card--video${tall(r) ? ' rv__card--tall' : ''} rise" data-rv="${i}"${r.app ? ` id="rv-${esc(r.app)}"` : ''} style="--ar:${esc(r.ratio || '16/9')}">
      <div class="rv__player">
        <button class="rv__play" type="button" data-play="${i}" aria-label="Смотреть видеоотзыв${r.author ? ': ' + esc(r.author) : ''}">
          <img src="${esc(r.poster)}" alt="" width="${ratioOf(r)[0]}" height="${ratioOf(r)[1]}" loading="lazy" decoding="async">
          <span class="rv__btn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z"/></svg></span>
          ${r.length ? `<span class="rv__len">${esc(r.length)}</span>` : ''}
          <span class="rv__mark">видеоотзыв</span>
        </button>
      </div>
      <figcaption class="rv__side">
        ${r.points && r.points.length ? `<ul class="rv__pts">${r.points.map(p => `<li>${icon('i-check')}${esc(p)}</li>`).join('')}</ul>` : ''}
        <blockquote>${rich(r.text)}</blockquote>
        <p class="rv__who"><b>${esc(r.author)}</b><span>${esc(r.project)}</span></p>
        ${r.transcript ? `<details class="rv__tx"${tall(r) && window.innerWidth >= 860 ? " open" : ""}><summary>Расшифровка видео</summary><p>${esc(r.transcript)}</p></details>` : ''}
      </figcaption>
    </figure>` : `
    <figure class="rv__card rise${r.sample ? ' is-sample' : ''}">
      ${r.sample ? '<span class="rv__tag">образец</span>' : ''}
      <svg class="rv__q" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-star"/></svg>
      <blockquote>${rich(r.text)}</blockquote>
      <figcaption><b>${esc(r.author)}</b><span>${esc(r.project)}</span></figcaption>
    </figure>`).join('');

  // видеоотзыв грузится только по нажатию — на телефоне трафик не тратится зря
  $('#rvGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-play]'); if (!b) return;
    const r = S.reviews[+b.dataset.play], box = b.parentElement;
    box.innerHTML = `<video class="rv__video" controls controlslist="nodownload noplaybackrate" disablepictureinpicture playsinline autoplay preload="auto" poster="${esc(r.poster)}"
      src="${esc(r.video)}"${r.transcript ? ` aria-label="Видеоотзыв: ${esc(r.author)}"` : ''}></video>`;
    const v = $('.rv__video', box);
    v.play().catch(() => { v.controls = true; });   // не дал автозапуск — останутся кнопки плеера
  });

  /* ==========================================================================
     СКИДКА ЗА ВИДЕООТЗЫВ И РЕКЛАМУ — блок после отзывов
     «Хочу скидку» включает её в заявке и ведёт к заявке; «Условия работы» — окно.
     ========================================================================== */
  const PR = S.promo, promoEl = $('#promo');
  if (promoEl && PR) {
    promoEl.innerHTML = `
      <div class="promo__seal" aria-hidden="true">
        <svg viewBox="0 0 120 120"><defs><path id="promoArc" d="M60,60m-41,0a41,41 0 1,1 82,0a41,41 0 1,1 -82,0"/></defs>
          <circle class="promo__ring" cx="60" cy="60" r="56"/><circle class="promo__ring promo__ring--in" cx="60" cy="60" r="50"/>
          <g class="promo__spin"><text><textPath href="#promoArc">ВИДЕООТЗЫВ ✦ РЕКЛАМА ✦ СКИДКА ✦</textPath></text></g>
        </svg>
        <span class="promo__pct">${PR.discount ? '−' + esc(PR.discount) : '%'}</span>
      </div>
      <div class="promo__main">
        <p class="promo__kicker">${icon('i-mark')}${esc(PR.kicker)}</p>
        <h3 class="promo__title">${esc(PR.title)}</h3>
        <p class="promo__lead">${esc(PR.lead)}</p>
        <ol class="promo__steps">${PR.steps.map(s => `<li><b>${esc(s.h)}</b><span>${esc(s.p)}</span></li>`).join('')}</ol>
        ${PR.warn ? `<p class="promo__warn">${esc(PR.warn)}</p>` : ''}
        <div class="promo__actions">
          <button class="btn btn--gold" type="button" data-promo>Хочу скидку${icon('i-arrow')}</button>
          <button class="btn btn--ghost" type="button" data-terms>Условия работы</button>
        </div>
      </div>`;
    promoEl.addEventListener('click', e => { if (e.target.closest('[data-promo]')) briefPrefill({ promo: true }); });
  }

  /* ==========================================================================
     «НАЧНЁМ?» — табло в контактах: отсчёт 3 · 2 · 1, и на нуле слово
     собирается из точек. Один раз — когда раздел появился на экране
     (если ещё идёт заставка — после неё). Сама анимация — в style.css.
     ========================================================================== */
  /* ==========================================================================
     ЗНАК КАЧЕСТВА — внизу страницы: крупная печать и что значит каждая буква
     ========================================================================== */
  const MK = S.mark, markEl = $('#mark');
  if (MK && markEl) {
    const group = list => '<ul class="mark__group">' + list.map(w =>
      '<li><b>' + esc(w[0]) + '</b><span>' + esc(w[1]) + '</span><i>' + esc(w[2]) + '</i></li>').join('') + '</ul>';
    markEl.innerHTML =
      '<p class="sec-label">' + icon('i-mark') + '<span>' + esc(MK.label) + '</span><i lang="ar" dir="rtl">' + esc(MK.ar) + '</i></p>' +
      '<h2 class="mark__title" id="markTitle">' + esc(MK.title).replace(esc(S.brand.name), '<span class="mark__brand">' + esc(S.brand.name) + '</span>') + '</h2>' +
      '<p class="mark__lead">' + esc(MK.lead) + '</p>' +
      '<div class="mark__words">' + group(MK.words.slice(0, 5)) + group(MK.words.slice(5)) + '</div>';
  }

  const board = $('#board');
  if (board) {
    const go = () => board.classList.add('is-go');
    if ('IntersectionObserver' in window) {
      const bio = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        bio.disconnect();
        if (root.classList.contains('is-intro')) document.addEventListener('intro:done', () => setTimeout(go, 700), { once: true });
        else go();
      }, { threshold: 0.6 });
      bio.observe(board);
    } else go();
  }

  /* ==========================================================================
     ЗАЯВКА: выбор → проверка «не бот» → Telegram или WhatsApp
     Сайт не собирает данных. На устройстве запоминается только сам факт
     отправки — чтобы вместо кнопок показать «Вы уже отправили заявку».
     Одна заявка с аккаунта Telegram — это делает бот (telegram/bot.js):
     сайт не может узнать, с какого аккаунта человек пишет, а бот видит.
     ========================================================================== */
  const B = S.brief, briefEl = $('#brief');
  const brief = { what: new Set([B.what[0]]), field: null, when: null, project: null, promo: false, bonuses: [] };
  let agreed = false;                                   // галочка «ознакомлен(а) с условиями»
  const SENT_KEY = 'brief-sent';
  const sentStore = {
    get() { try { return JSON.parse(localStorage.getItem(SENT_KEY) || 'null'); } catch (e) { return null; } },
    set(v) { try { localStorage.setItem(SENT_KEY, JSON.stringify(v)); } catch (e) {} }
  };

  $$('.chips[data-group]', briefEl).forEach(box => {
    const g = box.dataset.group;
    box.innerHTML = B[g].map(v => `<button class="bchip" type="button" aria-pressed="false" data-v="${esc(v)}">${esc(v)}</button>`).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('.bchip'); if (!b) return;
      const v = b.dataset.v;
      if (box.hasAttribute('data-multi')) brief.what.has(v) ? brief.what.delete(v) : brief.what.add(v);
      else brief[g] = brief[g] === v ? null : v;
      syncChips(); composeBrief();
    });
  });
  const promoChip = $('#promoChip');
  promoChip.addEventListener('click', () => { brief.promo = !brief.promo; syncChips(); composeBrief(); });
  function syncChips() {
    promoChip.setAttribute('aria-pressed', String(brief.promo));
    $$('.chips[data-group]', briefEl).forEach(box => {
      const g = box.dataset.group;
      $$('.bchip', box).forEach(x => x.setAttribute('aria-pressed', g === 'what' ? brief.what.has(x.dataset.v) : x.dataset.v === brief[g]));
    });
  }
  function briefText() {
    const lines = [B.greeting];
    const what = B.what.filter(v => brief.what.has(v)).map(lowerFirst);
    lines.push(what.length ? `Хочу заказать: ${what.join(', ')}.` : 'Хочу обсудить проект.');
    const pr = brief.project && projects.find(p => p.slug === brief.project);
    if (pr) lines.push(`Понравилась ваша работа «${pr.title}» — хочу похожее.`);
    if (brief.field) lines.push(`Сфера: ${lowerFirst(brief.field)}.`);
    if (brief.when) lines.push(`Сроки: ${lowerFirst(brief.when)}.`);
    if (brief.promo) lines.push('Хочу скидку за видеоотзыв и рекламу в соцсетях.');
    if (brief.bonuses.length) lines.push('🌴 Собрал(а) финики на сайте — бонусы: ' + brief.bonuses.join('; ') + '.');
    if (agreed) lines.push('✅ С условиями работы ознакомлен(а)' + (termsLink ? ': ' + termsLink : '.'));
    lines.push('Пишу с вашего сайта-портфолио.');
    return lines.join('\n');
  }
  // ссылка на PDF с условиями — только когда сайт в интернете (с компьютера адрес никому не откроется)
  const termsLink = !isLocal && S.terms && S.terms.pdf ? new URL(S.terms.pdf, location.href).href : '';
  function composeBrief() { $('#briefText').textContent = briefText(); }
  // Выбор уходит боту коротким кодом в ссылке t.me/бот?start=… (латиница, цифры, _ и -, до 64 знаков)
  function botPayload() {
    const mask = B.what.reduce((m, v, i) => m | (brief.what.has(v) ? 1 << i : 0), 0);
    const fi = B.field.indexOf(brief.field), wi = B.when.indexOf(brief.when);
    let p = 'z' + mask.toString(36) + '-' + (fi < 0 ? 'x' : fi) + (wi < 0 ? 'x' : wi) + (brief.promo ? 'v' : '');
    if (brief.project) p += '-' + brief.project;
    return p.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
  }
  function sendUrl(ch) {
    if (ch === 'wa') return waUrl(briefText());
    return C.bot ? `https://t.me/${C.bot}?start=${botPayload()}` : tgUrl(briefText());
  }
  // «Хочу похожий» в окне работы и «Обсудить бота» в демо ведут сюда же — через проверку
  function briefPrefill(o) {
    if (o.what) brief.what = new Set([o.what]);
    if ('project' in o) brief.project = o.project;
    if ('promo' in o) brief.promo = !!o.promo;
    if (o.bonuses) brief.bonuses = o.bonuses;
    syncChips(); composeBrief();
    $('#contact').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  syncChips(); composeBrief();

  /* --- проверка «не бот»: нажать на названный знак среди четырёх ---
     Знак каждый раз новый, порядок перемешан. Скриптовое нажатие
     (event.isTrusted = false) и нажатие быстрее секунды после загрузки
     не засчитываются; после трёх ошибок — пауза 30 секунд. */
  const HUMAN = [
    { id: 'moon', word: 'полумесяц', svg: '<path fill="currentColor" d="M20.6 15.4A8.7 8.7 0 1 1 10.6 3.4a7 7 0 0 0 10 12z"/>' },
    { id: 'star', word: 'звезду', svg: '<use href="#i-star" fill="currentColor"/>' },
    { id: 'palm', word: 'пальму', svg: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12.2 22c.5-4.5.3-9-.5-12.8"/><path d="M11.7 9.2C9.9 6.8 6.7 6 3.6 7.1"/><path d="M11.7 9.2c-.9-2.9-.1-5.6 2.3-7"/><path d="M11.7 9.2c2.2-2 5.5-2.3 8.5-.7"/><path d="M11.7 9.2c-2.6-.5-5.6 1.2-6.9 4"/><path d="M11.7 9.2c2.8-.1 5.4 1.9 6.2 4.9"/></g>' },
    { id: 'camel', word: 'верблюда', svg: '<g fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.4 6.4C3.9 5.2 5.7 4.6 6.8 5.6 7.7 6.4 8 8.4 9 10c.5.8 1 1.2 1.4 1.2.9-2.2 2.3-3.9 4.2-3.9 2 0 3 1.9 4 3.2.8 1 1.9 1.4 2.3 2.9"/><path d="M3.6 7.4c1.2.2 2.2.8 3 2.2.8 1.4 1.6 3.4 3 4.2 3 1 7.2 1 10.4-.2"/><path d="M10.6 14.2l-.4 6.8M12.6 14.6l.2 6.4M17.4 14.5l-.4 6.5M19.5 13.9l.5 7.1M20.9 13.4l.9 2.6"/></g>' }
  ];
  const bornAt = performance.now();
  let isHuman = false, humanTarget = HUMAN[0], humanFails = 0, humanLock = 0;
  const humanBox = $('#human'), humanState = $('#humanState');
  function humanDeal() {
    humanTarget = HUMAN[Math.floor(Math.random() * HUMAN.length)];
    $('#humanTarget').textContent = humanTarget.word;
    $('#humanOpts').innerHTML = HUMAN.slice().sort(() => Math.random() - 0.5).map(o =>
      `<button type="button" class="human__opt" data-h="${o.id}" aria-label="${o.word}"><svg viewBox="0 0 24 24" aria-hidden="true">${o.svg}</svg></button>`).join('');
  }
  function humanSay(t, bad) { humanState.textContent = t; humanState.classList.toggle('is-bad', !!bad); }
  function humanShake() { humanBox.classList.remove('is-shake'); void humanBox.offsetWidth; humanBox.classList.add('is-shake'); }
  function humanFail() {
    humanShake();
    if (++humanFails >= 3) {
      humanFails = 0; humanLock = performance.now() + 30000;
      humanBox.classList.add('is-locked');
      humanSay('Слишком много попыток — подождите 30 секунд', true);
      setTimeout(() => { humanBox.classList.remove('is-locked'); humanSay(''); humanDeal(); }, 30000);
      return;
    }
    humanSay('Не тот знак — попробуйте ещё раз', true);
    humanDeal();
  }
  $('#humanOpts').addEventListener('click', e => {
    const b = e.target.closest('[data-h]');
    if (!b || isHuman || performance.now() < humanLock) return;
    if (!e.isTrusted || performance.now() - bornAt < 1000) return humanFail();
    if (b.dataset.h !== humanTarget.id) return humanFail();
    isHuman = true;
    humanBox.classList.add('is-ok');
    b.classList.add('is-right');
    humanSay(agreed ? 'Спасибо! Теперь можно отправить заявку' : 'Спасибо! Осталось отметить условия работы');
    syncSend();
  });
  humanDeal();

  /* --- отправка и «одна заявка» --- */
  const sentRecently = () => { const s = sentStore.get(); return !!(s && Date.now() - s.ts < (B.repeatDays || 7) * 864e5); };
  let lastUrl = '';
  function showSent(justNow) {
    $('#briefForm').hidden = true;
    $('#briefDone').hidden = false;
    $('#briefDoneText').textContent = justNow
      ? 'Чат открылся в мессенджере — нажмите там «Отправить». Больше ничего делать не нужно: дождитесь ответа, я напишу в течение дня.'
      : 'Дождитесь ответа — я напишу вам в течение дня.';
    $('#briefAgain').hidden = !justNow;
  }
  function doSend(ch) {
    lastUrl = sendUrl(ch);
    window.open(lastUrl, '_blank', 'noopener');
    sentStore.set({ ts: Date.now(), ch });
    showSent(true);
  }
  $$('[data-ch]', briefEl).forEach(btn => btn.addEventListener('click', e => {
    if (sentRecently()) return showSent(false);
    if (!isHuman) {
      humanShake();
      humanSay(`Сначала нажмите на ${humanTarget.word} — это проверка, что вы не бот`, true);
      humanBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!e.isTrusted) return;
    if (!agreed) { agreeEl.classList.add('is-bad'); return openTerms(btn.dataset.ch); }
    doSend(btn.dataset.ch);
  }));

  /* --- галочка «ознакомлен(а) с условиями» и окно условий ---
     Окно открывается по ссылке «условиями работы», по кнопке в блоке скидки и само,
     если нажали «Отправить» без галочки. «Принимаю» ставит галочку и сразу
     отправляет заявку тем способом, который выбрали. */
  const agreeBox = $('#agreeBox'), agreeEl = $('#agree');
  function syncSend() {
    $$('[data-ch]', briefEl).forEach(x => x.setAttribute('aria-disabled', String(!(isHuman && agreed))));
  }
  function setAgreed(v) {
    agreed = !!v; agreeBox.checked = agreed;
    agreeEl.classList.toggle('is-on', agreed);
    if (agreed) agreeEl.classList.remove('is-bad');
    if (isHuman) humanSay(agreed ? 'Спасибо! Теперь можно отправить заявку' : 'Осталось отметить условия работы');
    syncSend(); composeBrief();
  }
  agreeBox.addEventListener('change', () => setAgreed(agreeBox.checked));

  const T = S.terms || { sections: [] }, termsEl = $('#terms'), termsBody = $('#termsBody');
  termsBody.innerHTML = `
    <p class="terms__kicker">Соглашение · редакция от ${esc(T.updated)}</p>
    <h3 class="terms__title" id="termsTitle">${esc(T.title)}</h3>
    <p class="terms__parties">${esc(T.parties)}</p>
    <ol class="terms__list">${T.sections.map(sec => `<li><h4>${esc(sec.h)}</h4>${sec.items.map(t => `<p>${esc(t)}</p>`).join('')}</li>`).join('')}</ol>
    ${T.contacts ? `<p class="terms__contacts">${esc(T.contacts)}</p>` : ''}`;
  if (T.pdf) { $('#termsPdf').href = T.pdf; $$('.agree__pdf').forEach(x => { x.href = T.pdf; }); }
  let termsOpener = null, pendingCh = null;
  function openTerms(ch) {
    pendingCh = ch || null;
    termsOpener = document.activeElement;
    termsEl.hidden = false;
    root.classList.add('menu-open');
    termsBody.scrollTop = 0;
    setTimeout(() => $('.terms__x', termsEl).focus({ preventScroll: true }), 50);
  }
  function closeTerms() {
    if (termsEl.hidden) return;
    termsEl.hidden = true;
    root.classList.remove('menu-open');
    if (termsOpener && termsOpener.focus) termsOpener.focus({ preventScroll: true });
  }
  document.addEventListener('click', e => { if (e.target.closest('[data-terms]')) { e.preventDefault(); openTerms(); } });
  termsEl.addEventListener('click', e => { if (e.target.closest('[data-close-terms]')) closeTerms(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !termsEl.hidden) closeTerms(); });
  $('#termsAccept').addEventListener('click', e => {
    const ch = pendingCh;
    setAgreed(true);
    closeTerms();
    if (ch && isHuman && e.isTrusted && !sentRecently()) doSend(ch);
  });
  $('#briefAgain').addEventListener('click', () => { if (lastUrl) window.open(lastUrl, '_blank', 'noopener'); });
  if (sentRecently()) showSent(false);

  /* ---------- время в Медине ---------- */
  const fmt = new Intl.DateTimeFormat('ru-RU', { timeZone: 'Asia/Riyadh', hour: '2-digit', minute: '2-digit' });
  const tick = () => { const t = fmt.format(new Date()); $$('[data-clock]').forEach(e => { e.textContent = t; }); };
  tick(); setInterval(tick, 15000);

  /* ==========================================================================
     ПОДВАЛ: вечер в оазисе. По мере прокрутки каналы доходят до воды,
     а когда дошли — в них бегут огоньки, в шатре загорается свет и идёт караван.
     ========================================================================== */
  const footer = $('#footer');
  const foot = window.Scene.mount($('#footScene'), { lit: false });
  foot.dig(0);
  let fRaf = 0, fNear = false;
  function footUpdate() {
    fRaf = 0;
    const r = footer.getBoundingClientRect(), vh = window.innerHeight;
    const p = clamp((vh - r.top) / Math.min(r.height, vh), 0, 1);
    const e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    foot.dig(e);
    foot.lit(e > .96);
  }
  const footQueue = () => { if (fNear && !fRaf) fRaf = requestAnimationFrame(footUpdate); };

  /* финики: нажмите на гроздь — она падает, финики разлетаются и становятся золотыми
     монетами, выпадает бонус (data.js → dates). Через полминуты гроздь вырастает снова */
  const DT = S.dates, fScene = $('#footScene'), dPlay = $('#datesPlay'), dHint = $('#datesHint'), dGot = $('#datesGot'), dList = $('#datesList');
  const gotBonus = [];
  if (DT && fScene && dPlay && DT.bonuses && DT.bonuses.length) {
    dPlay.hidden = false;
    dHint.textContent = '🌴 ' + DT.hint;
    $$('.sc-bunch-hit', fScene).forEach(h => { h.setAttribute('tabindex', '0'); h.setAttribute('role', 'button'); h.setAttribute('aria-label', 'Сорвать гроздь фиников'); });
    const first = $('.sc-palms--front .sc-bunch', fScene) || $('.sc-bunch', fScene);
    if (first) first.classList.add('sc-bunch--hint');
    fScene.addEventListener('click', e => { const b = e.target.closest('.sc-bunch'); if (b) dropBunch(b); });
    fScene.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('sc-bunch-hit')) { e.preventDefault(); dropBunch(e.target.closest('.sc-bunch')); }
    });
    $('#datesTake').addEventListener('click', () => briefPrefill({ bonuses: gotBonus.slice() }));
  }
  function dropBunch(b) {
    if (!b || b.classList.contains('is-gone')) return;
    $$('.sc-bunch--hint', fScene).forEach(x => x.classList.remove('sc-bunch--hint'));
    const art = $('.sc-bunch-art', b), side = +b.dataset.side || 1;
    const fr = footer.getBoundingClientRect(), r = art.getBoundingClientRect(), sr = fScene.getBoundingClientRect();
    const ground = sr.top - fr.top + sr.height * 0.9;             // земля у подножия пальм
    const x = r.left - fr.left + r.width / 2;
    b.classList.add('is-gone');
    setTimeout(() => b.classList.remove('is-gone'), 30000);       // новая гроздь вырастет
    const land = () => burst(x, ground);
    if (calm || !Element.prototype.animate) return land();
    const bb = art.getBBox(), el = document.createElement('div');
    el.className = 'drop';
    el.innerHTML = '<svg viewBox="' + [bb.x, bb.y, bb.width, bb.height].join(' ') + '" preserveAspectRatio="none" aria-hidden="true">' + art.innerHTML + '</svg>';
    Object.assign(el.style, { left: (r.left - fr.left) + 'px', top: (r.top - fr.top) + 'px', width: r.width + 'px', height: r.height + 'px' });
    footer.appendChild(el);
    const fall = Math.max(24, ground - (r.bottom - fr.top));
    el.animate([{ transform: 'translateY(0) rotate(0deg)' }, { transform: 'translateY(' + fall + 'px) rotate(' + side * 26 + 'deg)' }],
      { duration: 420 + fall * 1.5, easing: 'cubic-bezier(.45,0,1,.55)', fill: 'forwards' })
      .finished.then(() => { el.remove(); land(); }, () => { el.remove(); land(); });
  }
  function burst(x, y) {
    const bonus = DT.bonuses[gotBonus.length];
    if (!calm && Element.prototype.animate) for (let i = 0; i < 10; i++) {
      const bit = document.createElement('i');
      bit.className = 'date-bit'; bit.style.left = x + 'px'; bit.style.top = y + 'px';
      footer.appendChild(bit);
      const ang = -Math.PI * (.1 + .8 * Math.random()), v = 38 + Math.random() * 62, dx = Math.cos(ang) * v, dy = Math.sin(ang) * v;
      bit.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + Math.round((Math.random() - .5) * 320) + 'deg)', opacity: 1, offset: .42 },
        { transform: 'translate(' + dx * 1.08 + 'px,' + (dy - 46) + 'px) scale(1.15)', opacity: 1, offset: .78 },
        { transform: 'translate(' + dx * 1.12 + 'px,' + (dy - 78) + 'px) scale(.6)', opacity: 0 }
      ], { duration: 1500 + Math.random() * 350, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      setTimeout(() => bit.classList.add('is-coin'), 560);           // финик → монета
      setTimeout(() => bit.remove(), 2000);
    }
    const pop = document.createElement('div');
    pop.className = 'bonus-pop';
    pop.textContent = bonus ? '🎁 Бонус: ' + bonus : '🌴 ' + (DT.done || 'Урожай собран');
    footer.appendChild(pop);
    const fw = footer.clientWidth, pw = pop.offsetWidth;
    pop.style.left = clamp(x - pw / 2, 10, fw - pw - 10) + 'px';
    pop.style.top = (y - 20) + 'px';
    const drift = [{ opacity: 0, transform: 'translateY(-60%) scale(.92)' }, { opacity: 1, transform: 'translateY(-110%) scale(1)', offset: .14 },
      { opacity: 1, transform: 'translateY(-150%)', offset: .82 }, { opacity: 0, transform: 'translateY(-190%)' }];
    if (Element.prototype.animate) pop.animate(drift, { duration: 3200, easing: 'ease-out', fill: 'forwards' }).finished.then(() => pop.remove(), () => pop.remove());
    else setTimeout(() => pop.remove(), 3200);
    if (!bonus) return;
    gotBonus.push(bonus);
    const li = document.createElement('li'); li.textContent = bonus; dList.appendChild(li);
    dGot.hidden = false;
    dHint.textContent = '🌴 Собрано ' + gotBonus.length + ' из ' + DT.bonuses.length +
      (gotBonus.length < DT.bonuses.length ? ' — сорвите ещё гроздь' : ' — все бонусы ваши');
  }
  window.addEventListener('scroll', footQueue, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { fNear = es[0].isIntersecting; if (fNear) footUpdate(); }, { rootMargin: '200px 0px' }).observe(footer);
  } else { fNear = true; }

  /* ---------- запуск появлений ---------- */
  reveal(document);
  window.addEventListener('load', () => setTimeout(revealVisible, 1500));
  document.addEventListener('intro:done', () => setTimeout(revealVisible, 900));
})();
