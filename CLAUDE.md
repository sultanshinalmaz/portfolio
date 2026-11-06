# Портфолио SAUDI MADE

## Стек
- Язык: JavaScript (без TypeScript), HTML, CSS. Фреймворка и сборки нет.
- Содержимое — `assets/js/data.js`; языки — `assets/js/i18n.js` + `assets/js/lang/en.js`, `ar.js` (новый русский текст — дописывать перевод в оба).
- База данных: нет. Счётчик посещений — отдельный проект «Статистика сайтов» (saudimade-stats.vercel.app).
- Хостинг: reg.ru, адрес https://sultaninmadinah.tech. Выкладка: `node tools/publish.mjs "сообщение"` → снимок без истории на GitHub sultanshinalmaz/portfolio → GitHub Actions по FTP на reg.ru. Только по команде заказчика («заливай»).
- Локально: preview «portfolio» (dev-server.js, порт 8160). Экраны работ: `node tools/shots.mjs <slug>`. Проверка — headless Chrome через CDP.
- Подробности — README.md.

## 06.11.2026 — мини-апп Самарканд, лента отзывов
- В «Мини-аппы» перед Madinah Group добавлена карточка «Самарканд» (slug samarkand): https://samarqand-miniapp.vercel.app/, бот @samarkand_uzbek_kafe_bot. Описание и 8 пунктов — на RU/EN/AR.
- Экраны: video, home, dine, cart (`assets/img/work/samarkand-*.webp`). В shots.mjs у экрана появилось `taps: [...]` — несколько нажатий подряд.
- Отзывы — лента вместо столбика (заказчик: отзывов будет много). Едет сама ~28 px/с, в конце пауза и плавно в начало; стоит под мышью, после касания/стрелок 6 с, во время видео, вне экрана; при «меньше движения» не едет. Стрелки под лентой (#rvNav), прячутся, если всё помещается.
- Подводный камень: лента всегда `direction:ltr` (у арабского scrollLeft отрицательный), карточки внутри — rtl.
- Ждём видеоотзыв от кафе Самарканд → в reviews с `app: 'samarkand'`.
- Проверено в headless Chrome 1440×900 и 390×844 (ru, ar): лента сдвинулась 40 → 153 px за 4 с, ошибок нет, горизонтальной прокрутки страницы нет.
