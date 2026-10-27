/* ==========================================================================
   ЯЗЫКИ САЙТА: русский (основной), английский и арабский (справа налево).
   Подключается в <head> сразу после data.js.

   • Язык: ?lang=ru|en|ar в адресе → выбор запоминается на устройстве; при первом
     заходе — по языку телефона/браузера (арабский → ar, русский и соседние → ru,
     остальные → en). Поисковым роботам — русский (основная версия).
   • Переводы лежат в assets/js/lang/en.js и ar.js, грузится только нужный.
     В них: data — тексты из data.js (той же формы: работы — по slug, услуги — по id),
     ui — надписи страницы и app.js («русский текст» → перевод), re — шаблоны для фраз
     с числами и именами, plural — формы слов после чисел.
   • Страница переводится сама: надписи в вёрстке и всё, что app.js дорисовывает потом
     (наблюдатель за изменениями). Русский текст без перевода просто остаётся русским.
   • Переключатель — в шапке (на компьютере три кнопки RU · EN · ع, на телефоне — глобус
     с кодом языка) и строкой в меню. При смене языка заставка не повторяется.
   ========================================================================== */
(function () {
  var LANGS = ['ru', 'en', 'ar'];
  var NAMES = { ru: 'Русский', en: 'English', ar: 'العربية' };
  var CODES = { ru: 'RU', en: 'EN', ar: 'ع' };
  var LOCALES = { ru: 'ru-RU', en: 'en-GB', ar: 'ar-u-nu-latn' };
  // пути с версиями — их обновляет tools/bump.mjs
  var FILES = {
    en: 'assets/js/lang/en.js?v=b338f7b5',
    ar: 'assets/js/lang/ar.js?v=f29ae41c'
  };
  var d = document.documentElement;

  function pick() {
    var m = /[?&]lang=(ru|en|ar)\b/.exec(location.search);
    if (m) { try { localStorage.setItem('site-lang', m[1]); } catch (e) {} return m[1]; }
    try { var s = localStorage.getItem('site-lang'); if (LANGS.indexOf(s) >= 0) return s; } catch (e) {}
    if (/bot|crawl|spider|slurp|yandex|google|bing/i.test(navigator.userAgent || '')) return 'ru';
    var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var l = String(list[i] || '').toLowerCase();
      if (/^ar\b/.test(l)) return 'ar';
      if (/^(ru|uk|be|kk|ky|uz|tt|ba|tg|az|hy|ka)\b/.test(l)) return 'ru';
      if (/^en\b/.test(l)) return 'en';
    }
    return list[0] ? 'en' : 'ru';
  }

  var lang = pick();
  window.LANG = lang;
  window.LOCALE = LOCALES[lang];
  d.lang = lang;
  d.dir = lang === 'ar' ? 'rtl' : 'ltr';
  d.classList.add('lang-' + lang);

  var dict = {}, pats = [], forms = {};
  var ruPlural = function (n, f) { n = Math.abs(n); return f[(n % 10 === 1 && n % 100 !== 11) ? 0 : (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) ? 1 : 2]; };
  var rules = null; try { rules = new Intl.PluralRules(LOCALES[lang]); } catch (e) {}

  /* ---------- перевод строк (для app.js) ---------- */
  function tr(s) { return Object.prototype.hasOwnProperty.call(dict, s) ? dict[s] : s; }
  function trf(tpl, vars) { return tr(tpl).replace(/\{(\w+)\}/g, function (m, k) { return vars && vars[k] != null ? vars[k] : m; }); }
  function trPlural(n, f) {
    var x = forms[f.join('|')];
    if (!x || !rules) return ruPlural(n, f);
    return x[rules.select(n)] || x.other;
  }
  window.tr = tr; window.trf = trf; window.trPlural = trPlural;

  /* ---------- тексты data.js: глубокое слияние ---------- */
  function keyOf(o) { return o && typeof o === 'object' && !Array.isArray(o) ? (o.slug != null ? 's:' + o.slug : o.id != null ? 'i:' + o.id : null) : null; }
  function merge(t, s) {
    if (Array.isArray(s) && Array.isArray(t)) {
      s.forEach(function (v, i) {
        var k = keyOf(v), j = i;
        if (k) { j = -1; for (var x = 0; x < t.length; x++) if (keyOf(t[x]) === k) { j = x; break; } if (j < 0) return; }
        if (v && typeof v === 'object' && !Array.isArray(v) && t[j] && typeof t[j] === 'object') merge(t[j], v);
        else if (v != null) t[j] = v;
      });
      return t;
    }
    for (var key in s) {
      if (!Object.prototype.hasOwnProperty.call(s, key)) continue;
      var v = s[key];
      if (v && typeof v === 'object' && t[key] && typeof t[key] === 'object') merge(t[key], v);
      else if (v != null) t[key] = v;
    }
    return t;
  }

  var meta = null, board = null;
  // вызывается из файла языка (lang/en.js, lang/ar.js)
  window.i18nLoad = function (pack) {
    dict = pack.ui || {};
    pats = pack.re || [];
    forms = pack.plural || {};
    meta = pack.meta || null;
    board = pack.board || null;
    if (window.SITE && pack.data) merge(window.SITE, pack.data);
  };
  try { window.SITE_RU = JSON.parse(JSON.stringify(window.SITE)); } catch (e) { window.SITE_RU = window.SITE; }
  if (FILES[lang]) document.write('<script src="' + FILES[lang] + '"><\/script>');

  /* ---------- перевод страницы ---------- */
  var CYR = /[А-Яа-яЁё]/;
  function trText(s) {
    if (Object.prototype.hasOwnProperty.call(dict, s)) return dict[s];
    for (var i = 0; i < pats.length; i++) {
      var m = pats[i][0].exec(s);
      if (m) return typeof pats[i][1] === 'function' ? pats[i][1](m) : s.replace(pats[i][0], pats[i][1]);
    }
    return null;
  }
  function trNode(n) {
    var raw = n.nodeValue;
    if (!raw || !CYR.test(raw)) return;
    var p = n.parentNode;
    if (p && (p.nodeName === 'SCRIPT' || p.nodeName === 'STYLE' || (p.closest && p.closest('[data-noi18n]')))) return;
    var t = raw.trim().replace(/\s+/g, ' ');
    var r = trText(t);
    if (r == null) return;
    var lead = /^\s*/.exec(raw)[0], tail = /\s*$/.exec(raw)[0];
    n.nodeValue = lead + r + tail;
  }
  var ATTRS = ['aria-label', 'title', 'alt', 'placeholder'];
  function trAttrs(el) {
    for (var i = 0; i < ATTRS.length; i++) {
      var v = el.getAttribute && el.getAttribute(ATTRS[i]);
      if (v && CYR.test(v)) { var r = trText(v.trim()); if (r != null) el.setAttribute(ATTRS[i], r); }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return trNode(root);
    if (root.nodeType !== 1) return;
    trAttrs(root);
    var all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) trAttrs(all[i]);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    for (var j = 0; j < list.length; j++) trNode(list[j]);
  }

  /* ---------- переключатель ---------- */
  function goLang(l) {
    try { localStorage.setItem('site-lang', l); sessionStorage.setItem('sm-skip-intro', '1'); } catch (e) {}
    var q = location.search.replace(/^\?/, '').split('&').filter(function (x) { return x && !/^lang=/.test(x); });
    q.push('lang=' + l);
    location.href = location.pathname + '?' + q.join('&');
  }
  var GLOBE = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.5 4 5.6 4 9s-1.4 6.5-4 9M12 3c-2.6 2.5-4 5.6-4 9s1.4 6.5 4 9"/></svg>';
  function switcher() {
    var side = document.querySelector('.header__side');
    var label = 'Язык · Language · اللغة';
    if (side && !document.getElementById('lang')) {
      var box = document.createElement('div');
      box.className = 'lang'; box.id = 'lang'; box.setAttribute('data-noi18n', '');
      box.innerHTML =
        '<div class="lang__seg" role="group" aria-label="' + label + '">' + LANGS.map(function (l) {
          return '<a class="lang__opt' + (l === lang ? ' is-on' : '') + '" href="?lang=' + l + '" hreflang="' + l + '" lang="' + l + '" data-lang="' + l + '"' +
            (l === lang ? ' aria-current="true"' : '') + ' title="' + NAMES[l] + '">' + CODES[l] + '</a>';
        }).join('') + '</div>' +
        '<button class="lang__btn" type="button" aria-haspopup="true" aria-expanded="false" aria-label="' + label + '">' + GLOBE + '<b>' + CODES[lang] + '</b></button>' +
        '<ul class="lang__list" hidden>' + LANGS.map(function (l) {
          return '<li><a href="?lang=' + l + '" hreflang="' + l + '" lang="' + l + '" dir="' + (l === 'ar' ? 'rtl' : 'ltr') + '" data-lang="' + l + '"' +
            (l === lang ? ' aria-current="true"' : '') + '><i>' + CODES[l] + '</i>' + NAMES[l] + '</a></li>';
        }).join('') + '</ul>';
      side.insertBefore(box, side.firstChild);
      var btn = box.querySelector('.lang__btn'), list = box.querySelector('.lang__list');
      var close = function () { list.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
      btn.addEventListener('click', function (e) { e.stopPropagation(); list.hidden = !list.hidden; btn.setAttribute('aria-expanded', String(!list.hidden)); });
      document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    }
    var foot = document.querySelector('.menu__foot');
    if (foot && !document.querySelector('.menu__lang')) {
      var row = document.createElement('div');
      row.className = 'menu__lang'; row.setAttribute('data-noi18n', '');
      row.innerHTML = GLOBE + LANGS.map(function (l) {
        return '<a href="?lang=' + l + '" hreflang="' + l + '" lang="' + l + '" data-lang="' + l + '"' + (l === lang ? ' aria-current="true"' : '') + '>' + NAMES[l] + '</a>';
      }).join('');
      foot.insertBefore(row, foot.firstChild);
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-lang]');
      if (!a) return;
      e.preventDefault();
      if (a.getAttribute('data-lang') !== lang) goLang(a.getAttribute('data-lang'));
    });
  }

  // зовётся из <body> перед scene.js/app.js: перевести вёрстку, поставить переключатель, следить за новым текстом
  window.i18nApplyDom = function () {
    switcher();
    if (lang === 'ru') return;
    if (meta) {
      if (meta.title) document.title = meta.title;
      var md = document.querySelector('meta[name="description"]'); if (md && meta.description) md.setAttribute('content', meta.description);
      var ot = document.querySelector('meta[property="og:title"]'); if (ot && meta.title) ot.setAttribute('content', meta.title);
      var od = document.querySelector('meta[property="og:description"]'); if (od && meta.ogDescription) od.setAttribute('content', meta.ogDescription);
    }
    if (board) {
      var b = document.getElementById('board'), w = b && b.querySelector('.board__word');
      if (w) {
        // арабские буквы должны соединяться — слово целиком в одной ячейке
        var parts = lang === 'ar' ? [board] : Array.from(board);
        w.innerHTML = parts.map(function (c) { return '<i>' + c.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</i>'; }).join('');
        b.setAttribute('aria-label', board);
      }
    }
    walk(document.body);
    new MutationObserver(function (list) {
      list.forEach(function (m) {
        if (m.type === 'characterData') trNode(m.target);
        else if (m.type === 'attributes') trAttrs(m.target);
        else m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  };
})();
