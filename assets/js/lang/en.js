/* English. Форма — как в assets/js/i18n.js: data — тексты data.js, ui — надписи
   («русский текст» → перевод), re — фразы с числами и именами, plural — формы после чисел. */
i18nLoad({
  meta: {
    title: 'SAUDI MADE — websites, apps and Telegram bots from Medina',
    description: 'Websites, mobile apps, Telegram bots and mini apps, made in Medina. Projects for businesses in Saudi Arabia and Russia.',
    ogDescription: 'Websites, mobile apps, Telegram bots and mini apps. Made in Medina.'
  },
  board: 'Ready?',

  plural: {
    'сайт|сайта|сайтов': { one: 'website', other: 'websites' },
    'город|города|городов': { one: 'city', other: 'cities' },
    'страна|страны|стран': { one: 'country', other: 'countries' },
    'работу|работы|работ': { one: 'project', other: 'projects' }
  },

  re: [
    [/^Показать все (\d+) (.+)$/, 'Show all $1 $2'],
    [/^Подробнее о проекте (.+)$/, 'More about $1'],
    [/^Сайт «(.+)» на компьютере$/, '“$1” website on a computer'],
    [/^Сайт «(.+)» на телефоне$/, '“$1” website on a phone'],
    [/^Экраны мини-аппа (.+)$/, '$1 mini app screens'],
    [/^Экран (\d+)$/, 'Screen $1'],
    [/^Заказать · (\d+) SAR$/, 'Order · $1 SAR'],
    [/^✅ Заказ №(\d+) принят!$/, '✅ Order #$1 accepted!'],
    [/^Итого: (\d+) SAR · будет готов через 15 минут\.$/, 'Total: $1 SAR · ready in 15 minutes.'],
    [/^Записаться · (\d+) SAR$/, 'Book · $1 SAR'],
    [/^Запись подтверждена: (.+)\. Напомним за 2 часа\.$/, 'Booking confirmed: $1. We’ll remind you 2 hours before.'],
    [/^Смотреть видеоотзыв: (.+)$/, 'Watch video review: $1'],
    [/^Смотреть видеоотзыв$/, 'Watch video review'],
    [/^Видеоотзыв: (.+)$/, 'Video review: $1'],
    [/^Соглашение · редакция от (.+)$/, 'Agreement · version of $1'],
    [/^Сначала нажмите на (.+) — это проверка, что вы не бот$/, 'First tap the $1 — this checks that you are not a bot'],
    [/^🎁 Бонус: (.+)$/, '🎁 Bonus: $1'],
    [/^🌴 Собрано (\d+) из (\d+) — сорвите ещё гроздь$/, '🌴 $1 of $2 collected — pick another bunch'],
    [/^🌴 Собрано (\d+) из (\d+) — все бонусы ваши$/, '🌴 $1 of $2 collected — all bonuses are yours']
  ],

  ui: {
    // заставка, шапка, меню
    'Пропустить': 'Skip',
    'SAUDI MADE — на главную': 'SAUDI MADE — home',
    'Разделы': 'Sections',
    'Работы': 'Projects',
    'Мини-аппы': 'Mini apps',
    'Услуги': 'Services',
    'Демо': 'Demo',
    'Отзывы': 'Reviews',
    'Контакты': 'Contact',
    'Как работаю': 'How I work',
    'Включить дневную тему': 'Switch to day theme',
    'Включить ночную тему': 'Switch to night theme',
    'День / ночь': 'Day / night',
    'Дождитесь конца видео — потом можно переключить тему': 'Wait for the video to finish, then you can switch the theme',
    'Досмотрите видео — потом тему можно переключить': 'Let the video finish, then you can switch the theme',
    'Время в Медине': 'Time in Medina',
    'Медина': 'Medina',
    'Написать': 'Message',
    'Открыть меню': 'Open menu',
    'Закрыть меню': 'Close menu',
    'Меню': 'Menu',
    'Мини-аппы и боты': 'Mini apps & bots',
    'Оставить заявку': 'Send a request',
    'Сейчас в Медине': 'Now in Medina',

    // первый экран и бегущая строка
    'Обсудить проект': 'Discuss a project',
    'Сайты': 'Websites',
    'Мобильные приложения': 'Mobile apps',
    'Telegram-боты': 'Telegram bots',
    'Веб-приложения': 'Web apps',
    'Дизайн': 'Design',
    'Поддержка': 'Support',

    // работы
    'Сайты для живого бизнеса': 'Websites for real businesses',
    'Бани, кафе, барбершопы, химчистки и бренды — в Медине, Мекке, Уфе и за Полярным кругом. У каждого сайта своя история и свой узор, взятый из дела заказчика.':
      'Bathhouses, cafés, barbershops, carpet cleaners and brands — in Medina, Makkah, Ufa and beyond the Arctic Circle. Every site has its own story and its own pattern, taken from the client’s craft.',
    'Фильтр работ': 'Filter projects',
    'Показать все работы': 'Show all projects',
    'Открыть сайт': 'Open website',
    'Скоро онлайн': 'Coming soon',
    'Подробнее': 'Details',
    'Обсудить ваш сайт': 'Discuss your website',
    'ваш-сайт.рф': 'your-site.com',
    'Ваш сайт': 'Your website',
    'может быть здесь': 'could be here',
    'Следующая работа': 'Next project',
    'Здесь может быть ваш сайт': 'Your website could be here',
    'Расскажите о своём деле — сделаю сайт со своей историей и своим узором, как у работ выше.': 'Tell me about your business — I’ll make a website with its own story and pattern, like the projects above.',
    'Обсудить мой сайт': 'Discuss my website',
    'Россия': 'Russia',
    'Саудовская Аравия': 'Saudi Arabia',

    // окно работы
    'Закрыть': 'Close',
    'Сайт на телефоне — можно листать': 'The website on a phone — you can scroll it',
    '↕ Листайте экран телефона — это настоящая мобильная версия': '↕ Scroll the phone screen — this is the real mobile version',
    'Что сделано': 'What was done',
    'Узоры и мотивы': 'Patterns and motifs',
    'Хочу похожий': 'I want one like this',

    // садака джария
    'Садака джария': 'Sadaqah jariyah',
    'Сайты Садака Джария': 'Sadaqah Jariyah websites',
    'Садака джария — непрекращающаяся милостыня: доброе дело, польза от которого продолжается. Здесь сайты для имамов, мечетей и благих дел — пока люди находят на них знание, польза идёт дальше.':
      'Sadaqah jariyah is ongoing charity: a good deed whose benefit continues. Here are websites for imams, mosques and good causes — as long as people find knowledge on them, the benefit goes on.',

    // боты и мини-аппы
    'Боты и Mini Apps': 'Bots & Mini Apps',
    'Приложения прямо в Telegram': 'Apps right inside Telegram',
    'Клиент открывает их кнопкой в чате — без скачивания и регистрации. Заявки и брони приходят владельцу в бот, а у него — своя панель управления.':
      'Customers open them with a button in the chat — no downloads, no sign-up. Requests and bookings arrive in the owner’s bot, and the owner gets a control panel.',
    '✕ Закрыть': '✕ Close',
    'Открыть в Telegram': 'Open in Telegram',
    'Открыть в браузере': 'Open in browser',
    'Видеоотзыв клиента': 'Client video review',
    'Предыдущий экран': 'Previous screen',
    'Следующий экран': 'Next screen',

    // услуги
    'От лендинга до приложения в сторе': 'From a landing page to an app in the store',
    'Сайты, мобильные приложения, боты и мини-аппы — одной рукой и в одном стиле. Всё, что нужно, чтобы клиент нашёл вас, выбрал и заказал с телефона.':
      'Websites, mobile apps, bots and mini apps — by one hand and in one style. Everything a customer needs to find you, choose you and order from their phone.',
    'В фокусе · iOS и Android': 'In focus · iOS and Android',
    'Попробовать демо': 'Try the demo',

    // демо
    'Потрогайте — это работает': 'Touch it — it works',
    'Живой пример прямо в телефоне: закажите кофе через бота и мини-апп или запишитесь в барбершоп через приложение.':
      'A live example right in the phone: order coffee through the bot and mini app, or book a barbershop through the app.',
    'Что показать': 'What to show',
    'Telegram-бот': 'Telegram bot',
    'Приложение': 'App',
    'Нажимайте — всё настоящее, кроме денег': 'Tap around — everything is real except the money',
    'сейчас': 'now',
    'бот · демо': 'bot · demo',
    'Убрать': 'Remove',
    'Добавить': 'Add',
    'Заказ отправлен': 'Order sent',
    'Бот пришлёт подтверждение в чат': 'The bot will send a confirmation to the chat',
    '📣 Владельцу кафе пришло уведомление о заказе': '📣 The café owner got a notification about the order',
    'Запись': 'Booking',
    'Услуга': 'Service',
    'День': 'Day',
    'Время': 'Time',
    'сег': 'today',
    'Выберите время': 'Choose a time',
    'Главная': 'Home',
    'Профиль': 'Profile',
    'Вы записаны': 'You’re booked',
    'Готово': 'Done',

    // как работаю
    'Пять стоянок — от голосового до запуска': 'Five stops — from a voice message to launch',
    'Как караван от колодца к колодцу: на каждой стоянке вы видите готовый результат, а не «ещё чуть-чуть».':
      'Like a caravan from well to well: at every stop you see a finished result, not “almost there”.',

    // отзывы
    'Что говорят заказчики': 'What clients say',
    'видеоотзыв': 'video review',
    'Расшифровка видео': 'Video transcript (translated)',
    'образец': 'sample',
    'ВИДЕООТЗЫВ ✦ РЕКЛАМА ✦ СКИДКА ✦': 'VIDEO REVIEW ✦ PROMOTION ✦ DISCOUNT ✦',
    'Хочу скидку': 'I want the discount',
    'Условия работы': 'Terms of work',

    // контакты и заявка
    'Начнём?': 'Ready?',
    'Расскажите о деле в двух словах — предложу идею и сроки. Можно голосовым.': 'Tell me about your business in a few words — I’ll suggest an idea and a timeline. A voice message is fine.',
    'Выберите, что нужно': 'Choose what you need',
    'Сайт, приложение, бот — можно несколько сразу.': 'A website, an app, a bot — you can pick several.',
    'Нажмите на знак и отметьте условия': 'Tap the sign and accept the terms',
    'Знак — так я отличаю людей от спам-ботов. Галочка — что вы прочитали условия работы.': 'The sign is how I tell people from spam bots. The checkbox confirms you have read the terms of work.',
    'Отправьте в Telegram или WhatsApp': 'Send it via Telegram or WhatsApp',
    'Заявка придёт мне лично, отвечу в течение дня.': 'The request comes to me personally; I reply within a day.',
    '· UTC+3, как в Москве': '· UTC+3, same as Moscow',
    'Соберите заявку за 20 секунд': 'Put together a request in 20 seconds',
    'Что нужно': 'What you need',
    'Сфера': 'Field',
    'Сроки': 'Timeline',
    'Скидка': 'Discount',
    'Хочу скидку за видеоотзыв и рекламу': 'I want a discount for a video review and promotion',
    'Сообщение': 'Message',
    'Проверка, что вы не бот: нажмите на': 'Check that you’re not a bot: tap the',
    'полумесяц': 'crescent',
    'звезду': 'star',
    'пальму': 'palm tree',
    'верблюда': 'camel',
    'Я ознакомлен(а) с': 'I have read the',
    'условиями работы': 'terms of work',
    'и согласен(на) с ними ·': 'and accept them ·',
    'В Telegram': 'Via Telegram',
    'В WhatsApp': 'Via WhatsApp',
    'Сайт не собирает личных данных: сообщение откроется в мессенджере, отправите его сами.': 'This site collects no personal data: the message opens in your messenger and you send it yourself.',
    'Вы уже отправили заявку': 'You have already sent a request',
    'Дождитесь ответа — я напишу вам в течение дня.': 'Please wait for my reply — I’ll write to you within a day.',
    'Чат не открылся? Открыть ещё раз': 'Chat didn’t open? Open it again',
    'Чат открылся в мессенджере — нажмите там «Отправить». Больше ничего делать не нужно: дождитесь ответа, я напишу в течение дня.':
      'The chat opened in your messenger — tap “Send” there. Nothing else to do: wait for my reply, I’ll write within a day.',
    'Слишком много попыток — подождите 30 секунд': 'Too many attempts — please wait 30 seconds',
    'Не тот знак — попробуйте ещё раз': 'Wrong sign — try again',
    'Спасибо! Теперь можно отправить заявку': 'Thank you! Now you can send the request',
    'Спасибо! Осталось отметить условия работы': 'Thank you! Now just accept the terms of work',
    'Осталось отметить условия работы': 'Now just accept the terms of work',
    'Открыть PDF': 'Open PDF (in Russian)',
    'Ознакомлен(а), принимаю': 'I have read and accept',

    // сообщение заявки (уходит в Telegram / WhatsApp)
    'Хочу заказать: {list}.': 'I’d like to order: {list}.',
    'Хочу обсудить проект.': 'I’d like to discuss a project.',
    'Понравилась ваша работа «{title}» — хочу похожее.': 'I liked your project “{title}” — I want something similar.',
    'Сфера: {v}.': 'Field: {v}.',
    'Сроки: {v}.': 'Timeline: {v}.',
    'Хочу скидку за видеоотзыв и рекламу в соцсетях.': 'I want a discount for a video review and promotion on social media.',
    '🌴 Собрал(а) финики на сайте — бонусы: {list}.': '🌴 I collected dates on the website — bonuses: {list}.',
    '✅ С условиями работы ознакомлен(а)': '✅ I have read the terms of work',
    'Пишу с вашего сайта-портфолио.': 'Writing from your portfolio website.',

    // подвал
    'Наверх': 'Back to top',
    'Знак качества SAUDI MADE by Almaz Sultanshin': 'SAUDI MADE by Almaz Sultanshin quality mark',
    '· Сделано в Медине': '· Made in Medina',
    'Забрать в заявку': 'Add to my request',
    'Сорвать гроздь фиников': 'Pick a bunch of dates'
  },

  data: {
    brand: { role: 'Development from Medina', city: 'Medina, Saudi Arabia' },
    dates: {
      hint: 'Tap a bunch of dates — there’s a bonus inside',
      done: 'Harvest complete — all bonuses are yours',
      bonuses: [
        'A QR code for your website — for business cards and the shop window',
        'Google map and reviews right on the website',
        'A “Message on WhatsApp” button on every screen',
        'A website icon for the phone’s home screen',
        'A week of small edits after launch'
      ]
    },
    mark: {
      label: 'Quality mark',
      title: 'SAUDI MADE — a quality mark',
      lead: 'SAUDI MADE means “made in Saudi Arabia”, in Medina. It is a quality mark: everything will be done properly. Each letter is something I answer for.',
      words: [
        ['S', 'Sites', 'websites'], ['A', 'Automation', 'automation'], ['U', 'Uniqueness', 'uniqueness'],
        ['D', 'Design', 'design'], ['I', 'Innovation', 'innovation'],
        ['M', 'Medinah', 'Medina'], ['A', 'Art', 'art'], ['D', 'Digital', 'digital'], ['E', 'Engineering', 'engineering']
      ]
    },
    hero: {
      kicker: 'Medina · Saudi Arabia',
      title: ['Websites, apps', 'and Telegram bots', 'Made in Medina'],
      lead: 'I build for businesses in Saudi Arabia and Russia: websites that send orders to a messenger, mobile apps, Telegram bots and mini apps.'
    },
    services: [
      { id: 'app', title: 'Mobile apps', text: 'iOS and Android apps: bookings, delivery, catalogues, customer accounts, push notifications. First comes a clickable prototype: you hold the app in your hands before development starts.', points: ['iOS and Android', 'Prototype first', 'Push notifications', 'Store publishing'] },
      { id: 'site', title: 'Websites & landing pages', text: 'One-page and multi-page websites, menus and catalogues with a cart. The order arrives as a ready message in Telegram or WhatsApp.', points: ['Mobile first', 'Intro & animations', 'Map & reviews'] },
      { id: 'bot', title: 'Telegram bots', text: 'The bot takes orders and bookings, notifies the owner, sends newsletters and answers frequent questions.', points: ['Orders & bookings', 'Owner notifications', 'Newsletters'] },
      { id: 'miniapp', title: 'Telegram Mini Apps', text: 'An app right inside Telegram: menu, cart, bookings, catalogue. Customers download nothing — they open it with a button in the bot.', points: ['No installation', 'Cart & checkout', 'Telegram login'] },
      { id: 'web', title: 'Web apps', text: 'Customer accounts, admin panels, order tracking and staff dashboards — apps built around how your business works.', points: ['Accounts & admin panels', 'Order tracking', 'Integrations'] },
      { id: 'more', title: 'Other IT services', text: 'Domain and hosting, listings on Google Maps, Yandex Maps and 2GIS, search basics, website migration, support and improvements.', points: ['Domain & hosting', 'Maps & SEO', 'Support'] }
    ],
    projects: [
      { slug: 'potolki', title: 'Northern Ceilings', type: 'Stretch ceilings & lighting', city: 'Monchegorsk', summary: 'A stretch-ceiling specialist in the Murmansk region. Northern lights over the hills on the first screen, a feed of real projects, prices and videos of finished work.', features: ['Northern lights & hills on the first screen', 'Project feed', 'Specialist & certificates', 'Prices', 'Videos of work'], motifs: ['northern lights', 'snow-covered hills'] },
      { slug: 'volosach', title: 'Volosach', type: 'Barbershop', city: 'Monchegorsk', summary: 'A barbershop beyond the Arctic Circle. A scissors cursor, spinning barber poles along the page edges and booking via Dikidi.', features: ['Scissors cursor', 'Barber poles', 'Gallery', 'Dikidi booking', 'Map'] },
      { slug: 'savva', type: 'Specialty coffee shop', city: 'Medina', summary: 'A coffee shop in Medina, website in Arabic and English. The camera flies into a letter of the logo where coffee is being poured; a drink finder in three taps, latte art with your finger and orders via WhatsApp.', features: ['AR · EN, right-to-left', 'Flight into the SAVVA letter', 'Drink finder', 'Finger latte art', 'Orders via WhatsApp'], motifs: ['the three dots of the letter ڤ — coffee beans', 'the café’s façade arches', 'sadu — Bedouin weaving', 'a coffee branch from the menu'] },
      { slug: 'leisner', title: 'Leisner Parfum', type: 'Perfume by the bottle', city: 'Murmansk', summary: 'One website, two themes: “Polar Night” with live northern lights and “Polar Day” with a fragrance wheel. Orders go to a Telegram bot.', features: ['Night & day themes', 'Aurora on canvas', 'Fragrance wheel', 'Orders via bot', 'No data collection'], motifs: ['northern lights', 'Pomor wind rose', 'Michael Edwards’ fragrance wheel'] },
      { slug: 'zahab', type: 'Truffle juice producer', city: 'Saudi Arabia', summary: 'Website of a direct producer of desert truffle (kam’a) juice. One product and the whole story around it: harvesting in the desert, reviews, bundles and orders via WhatsApp.', features: ['Intro screen', 'Bundles in the cart', 'Harvest videos', 'Reviews', 'Careful wording'], motifs: ['sadu — Najdi weaving', 'girih', 'cracks in the sand', 'dallah'] },
      { slug: 'truffle', type: 'Encyclopedia', city: 'Russia', summary: 'A non-commercial reference about kam’a (desert truffle): hadiths and commentaries, research, how the fungus grows. The texts live right in the HTML so search engines can find them.', features: ['Multi-page', 'Site search', 'Glossary', 'Articles', 'SEO'], motifs: ['cracks in the sand', 'girih', 'sadu', 'pointed arch', 'a drop'] },
      { slug: 'sushi', type: 'Sushi delivery', city: 'Medina', summary: 'Sushi delivery for the Russian-speaking community of Medina. A menu of 31 items, a cart and two separate WhatsApp numbers — for brothers and for sisters.', features: ['Menu with a cart', 'WhatsApp for brothers & sisters', 'Enso intro', 'Reviews', 'Map'], motifs: ['seigaiha — “blue ocean waves”', 'asanoha', 'enso', 'rub el hizb'] },
      { slug: 'burka', type: 'Caucasian cuisine', city: 'Makkah', summary: 'Home-style Caucasian food with delivery across Makkah. Three languages — Russian, right-to-left Arabic and English — a searchable menu and orders via WhatsApp.', features: ['RU · AR · EN', 'Right-to-left layout', 'Searchable menu', 'Cart → WhatsApp', 'Map on click'], motifs: ['girih', 'pointed mihrab arch', 'Kubachi “markharai” vine', 'ram’s horn'] },
      { slug: 'rahat', title: 'Rahat', type: 'Russian bathhouse', city: 'Medina', summary: 'A private Russian bathhouse (banya) in Medina. The website leads to booking: packages go into a cart, and the order arrives as a ready message in Telegram.', features: ['Intro with a photo of the steam room', 'Cart → Telegram', 'Videos from the channel', 'Reviews', 'Map'], motifs: ['the oak leaf from the bathhouse logo', 'girih from the entrance door grille', 'wooden slats and the Hijazi roshan'] },
      { slug: 'zauborku', type: 'Carpet cleaning', city: 'Ufa', summary: 'Mobile cleaning of carpets, wall-to-wall carpets and furniture. “Wipe the dirt off with your finger” on the first screen, an area calculator and videos from real jobs.', features: ['Wipe the dirt with your finger', 'Calculator', 'Before / after', 'Video feed', 'Requests via Telegram'], motifs: ['the drop and bubbles from the cleaner’s banner', 'extraction diagram'] },
      { slug: 'safa', title: 'SAFA', type: 'Carpet washing', city: 'Dyurtyuli', summary: 'Carpet washing in Dyurtyuli. An ornament weaves itself on the intro screen, a carpet on canvas gets cleaned with your finger, a calculator and a service-area map.', features: ['Self-weaving ornament', 'Carpet on canvas', 'Calculator', 'Service-area map', 'Booking via bot'], motifs: ['kuskar', 'hooked rhombus', 'yondoz — eight-pointed star', 'toothed rug border'] },
      { slug: 'borodachi', title: 'Borodachi', type: 'Barbershop', city: 'Ufa', summary: 'A barbershop on Richard Sorge Street. A scissors cursor, the barbers, a gallery of work and step-by-step booking with requests delivered to Telegram.', features: ['Scissors cursor', 'Barbers', 'Gallery', 'Reviews from maps', 'Booking via Telegram'] },
      { slug: 'prestige', title: 'Prestige', type: 'Hotel', city: 'Ufa', summary: 'A hotel on Richard Sorge Street: rooms from 2,900 ₽, what’s nearby, a gallery, reviews and a separate contacts page.', features: ['Rooms & prices', 'What’s nearby', 'Gallery', 'Reviews', 'Contacts'] }
    ],
    charity: [
      { slug: 'zufar', title: 'Zufar Hazrat Takhaviev', type: 'Website of an imam-khatib', city: 'Tatarstan', summary: 'Website of an imam-khatib, writer and historian, in Tatar and Russian: sermons from YouTube and Rutube, books, the hazrat’s life path. The hazrat publishes new material himself through his own panel.', features: ['Tatar and Russian', 'Sermons from YouTube and Rutube', 'Books in PDF', 'A panel for the hazrat', 'No data collection'] }
    ],
    apps: [
      { slug: 'madinah', type: 'Telegram Mini App + bot', city: 'Medina', summary: 'A mini app for a real-estate agent in Medina. A pilgrim opens it with a button in Telegram and instantly sees apartments on a map, visas, tours to the holy sites, car rental and airport transfers. Requests go to the agent’s bot; the agent has a panel, a deals report and PDFs for apartment owners.', features: ['Apartments: list, map, favourites', 'Visas & iqama — 15 types', 'Tours & ziyarat', 'Cars & transfers', 'Requests to the bot', 'Agent panel & report', 'RU · UZ · EN'], shots: { screens: [{ caption: 'Apartments' }, { caption: 'Visas' }, { caption: 'Tours' }, { caption: 'Cars' }] } }
    ],
    filters: [
      { id: 'all', label: 'All' }, { id: 'arabia', label: 'Arabia' }, { id: 'russia', label: 'Russia' },
      { id: 'food', label: 'Cafés' }, { id: 'service', label: 'Services' }, { id: 'brand', label: 'Brands' }
    ],
    demo: {
      cafe: 'Finik Café',
      about: {
        bot: { h: 'Telegram bot: an answer in a second', p: 'The bot works around the clock: menu, opening hours, address. Orders and bookings reach you as ready messages.', li: ['Answers frequent questions', 'Takes orders and bookings', 'Notifies the owner', 'Sends newsletters to customers'] },
        mini: { h: 'Mini App: an app inside Telegram', p: 'A menu with a cart opens right in the chat. Nothing to download, no sign-up.', li: ['Cart and order total', 'Telegram login — no passwords', 'Works on any phone', 'The order goes straight to the bot'] },
        app: { h: 'Mobile app', p: 'Your own app in the App Store and Google Play: bookings, a customer account and push notifications that bring customers back.', li: ['iOS and Android', 'Push reminders about bookings', 'Account & history', 'Prototype before development'] }
      },
      bot: {
        hello: 'As-salamu alaykum! 👋 I’m the Finik Café bot. How can I help?',
        keyboard: ['🍽 Open the menu', '🕐 Opening hours', '📍 Address', '💬 Contact us'],
        replies: [
          { text: 'The menu with prices is in the mini app 👇', btn: { label: 'Open the menu' } },
          { text: 'Every day from 7:00 to 24:00. On Fridays we open after Jumu’ah prayer.' },
          { text: 'Medina, Quba district — five minutes from Quba Mosque.' },
          { text: 'This is a demo. I’ll build a bot like this for your business — with your menu, address and notifications.', btn: { label: 'Discuss a bot' } }
        ]
      },
      mini: { title: 'Breakfast all day', sub: 'Dates, coffee and hot dishes — take away or order to your table' },
      menu: [{ n: 'Ajwa dates' }, { n: 'Arabic coffee' }, { n: 'Luqaimat' }, { n: 'Chicken mandi' }, { n: 'Falafel' }, { n: 'Mint tea' }],
      app: { brand: 'Sokol Barbershop', short: 'Sokol', services: [{ n: 'Haircut' }, { n: 'Beard' }, { n: 'Full service' }] }
    },
    process: [
      { title: 'Getting to know you', text: 'You write on Telegram — a voice message is fine. I ask questions, collect photos, prices and reviews, look at your channels and map listings.' },
      { title: 'Idea', text: 'I propose a concept built from the real motifs of your business and city — not a template, but a story your customers will recognise.' },
      { title: 'Development', text: 'I show the work via a link from the first days. Send edits however you like: text, a screenshot, a voice message.' },
      { title: 'Testing', text: 'I go through every screen on iPhone and Android: intro, buttons, cart — nothing shifts.' },
      { title: 'Launch', text: 'Domain, hosting, maps, bot. After launch I stay in touch and keep improving.' }
    ],
    reviews: [
      { author: 'Client, “Northern Ceilings” website', project: 'Monchegorsk · Murmansk region', points: ['Precise', 'Fast', 'Recommended'],
        text: '**Overall, the website is spot-on.** There were some details — **he fixed everything right away.** All in all, I’m delighted. Get in touch: he’ll make a good website for your company. **I recommend him without a doubt.**',
        transcript: 'Hello everyone, assalamu alaykum. A brother made us this wonderful website — get in touch with him. He did everything the way we wanted: good options for the work, contacts for feedback right on the first page. Overall, the website is spot-on. There were some details — he fixed everything right away: wishes, points, fine-tuning. All in all, I’m delighted. Get in touch, he’ll make a good website for your company. I’ll leave his link in the description. Everything was done to the brief: as it needed to be, that’s how he did it. So get in touch — I recommend him without a doubt.' },
      { author: 'Owner of the Volosach barbershop', project: 'Monchegorsk · barbershop', points: ['Precise', 'Fast', 'Recommended'],
        text: 'I’m very happy with the work. He fixed my notes **the same day** or the next. **Everything was done precisely**, no extra words, no extra questions. Everything is great, he works **fast and to a high standard** — **I recommend him to everyone.**',
        transcript: 'Greetings everyone, assalamu alaykum. I want to record a video review of Almaz’s work. I ordered a one-page website for my barbershop from him. I’m very happy with the work. There were some notes — Almaz fixed them, I think the same day or the next: the descriptions needed a little tweaking and some photos added. He did everything precisely, without extra words or extra questions, and took the initiative into his own hands. I liked the colour schemes he suggested straight away. So everything is precise, everything is great, he works fast and to a high standard. I recommend him to everyone.' },
      { author: 'Abdullah, real-estate agent in Medina', project: 'Telegram Mini App “Madinah Group”', points: ['Beyond expectations', 'Design', 'Recommended'],
        text: 'To make things easier for my clients and to automate my work, I needed a Telegram Mini App. I turned to Almaz — **the result exceeded all my expectations.** I really liked **the app’s design**, and **the map feature is simply great.** The work was done **at the highest level** — **I recommend him from the heart.**',
        transcript: 'Assalamu alaykum wa rahmatullah, brothers and sisters. My name is Abdullah, I work in real estate in Medina. To make things easier for clients and to automate my work in Telegram, I needed a Telegram Mini App. Here, I’m opening it now. I turned to Almaz, and the result exceeded all my expectations. I really liked the app’s design — here, as you can see. And the map feature is simply great. Visa, tours, cars, transfers — as you can see, the work was done at the highest level. I recommend him from the heart.' }
    ],
    terms: {
      title: 'Terms of work',
      updated: '28 September 2026',
      owner: 'Almaz Sultanshin',
      about: 'websites, mobile apps, Telegram bots and mini apps · Medina',
      parties: 'Contractor — Almaz Sultanshin. Client — whoever sends a request from the website or writes on Telegram or WhatsApp.',
      sections: [
        { h: 'Price', items: [
          'Every project has its own price. I name it after we have discussed all the details: the tasks, the scope of work and the timeline.',
          'The agreed price, scope of work and timeline are recorded in our Telegram or WhatsApp conversation — that is our initial agreement.'
        ] },
        { h: 'Start of work and payment', items: [
          'Work starts once all the details are agreed and a 50% prepayment (deposit) of the project price has been made.',
          'The remaining 50% is paid when the work is finished — before the launch and handover of the project.'
        ] },
        { h: 'Additional work', items: [
          'Anything that is not part of the initial agreement is done for an additional fee. The price and timeline of such work are agreed separately, before it starts.'
        ] },
        { h: 'Domain', items: [
          'Connecting the website to a domain is at the Client’s expense: the Client pays for the domain (purchase and renewal).'
        ] },
        { h: 'Discount for a video review and promotion', items: [
          'You can get a discount if we agree that after the launch the Client will publish a good-quality video review and promote the work on their social media.',
          'The size of the discount, what is published where and by when are agreed in advance and recorded in our conversation.',
          'If the discount was given but the video review and promotion never appeared, the website or product is switched off and the 50% deposit is not refunded.'
        ] },
        { h: 'Request', items: [
          'By sending a request, the Client confirms that they have read and accepted these terms.'
        ] }
      ],
      contacts: 'Contact — the “Via Telegram” and “Via WhatsApp” buttons in the request form on the website'
    },
    promo: {
      kicker: 'Video review + promotion',
      title: 'Post a video review — get a discount',
      lead: 'Record a good-quality video review of your finished website or app and tell your social-media followers about the work — and I’ll give you a discount on your project.',
      steps: [
        { h: 'We agree in advance', p: 'The size of the discount, what you publish where and by when — we record it in our conversation before work starts.' },
        { h: 'You record a video', p: '30–60 seconds, good light and sound: how we worked and what came out. Show the website on your phone — like in the reviews above.' },
        { h: 'You tell your followers', p: 'You post the video or a post about the work on your social media — that is the promotion.' }
      ]
    },
    protect: { notice: '© Almaz Sultanshin · SAUDI MADE — copying prohibited' },
    brief: {
      greeting: 'Hello!',
      what: ['Website', 'Mobile app', 'Telegram bot', 'Mini App', 'Web app', 'Other'],
      field: ['Café & delivery', 'Beauty', 'Shop', 'Services', 'Healthcare', 'Other'],
      when: ['As soon as possible', 'Within a month', 'No rush']
    }
  }
});
