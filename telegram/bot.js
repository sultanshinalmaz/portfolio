/* ═══════════════════════════════════════════════════════════════════════
   Бот-приёмщик заявок с сайта-портфолио
   Node 18+, без зависимостей. Запуск: node bot.js
   Настройки — в файле .env рядом (см. .env.example).

   Как работает:
   1. Посетитель нажимает на сайте «В Telegram» → открывается этот бот
      по ссылке t.me/бот?start=<код заявки> → посетитель жмёт «Старт».
   2. Проверка, что пишет человек: нажать на названный знак среди четырёх
      (знак и порядок каждый раз новые, после трёх ошибок — пауза 10 минут).
   3. Заявка уходит владельцу (OWNER_USERNAME) с именем и ссылкой на клиента;
      голосовое сообщение пересылается как есть.
   4. С одного аккаунта — одна заявка. На повторную попытку бот отвечает:
      «Вы уже отправили заявку, дождитесь ответа». Ограничение снимается
      кнопкой «Ответил» под заявкой или само через REPEAT_DAYS дней.

   Владельцу: /test — пройти путь клиента самому, /stats — сколько заявок,
   /unblock @ник — снять ограничение вручную.

   Проверка без токена:  node bot.js --test z3-12-rahat
   ═══════════════════════════════════════════════════════════════════════ */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));

/* ── читаем .env ───────────────────────────────────────────────────── */
const envFile = path.join(DIR, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#')) continue;
    const i = s.indexOf('=');
    if (i > 0) process.env[s.slice(0, i).trim()] ||= s.slice(i + 1).trim();
  }
}

const TOKEN = process.env.BOT_TOKEN;
const OWNER_USERNAME = (process.env.OWNER_USERNAME || '').replace(/^@/, '').toLowerCase();
const REPEAT_DAYS = Math.max(1, +process.env.REPEAT_DAYS || 7);

/* ── тексты сайта: списки заявки и работы берём прямо из data.js ────── */
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(DIR, '..', 'assets', 'js', 'data.js'), 'utf8'), box);
const SITE = box.window.SITE;
const B = SITE.brief;

/* Код из ссылки: z<маска «что нужно», base36>-<сфера><сроки>[v][-<работа>]
   z3-12-rahat → сайт + мобильное приложение, «Красота», «Не спешу», работа «Рахат».
   Сфера и сроки — номер в списке или x, если не выбрано; v — хочет скидку за видеоотзыв и рекламу.
   Заявку с сайта нельзя отправить без галочки «ознакомлен(а) с условиями». */
function parsePayload(p) {
  const m = /^z([0-9a-z]{1,3})-([0-9x])([0-9x])(v?)(?:-([a-z0-9_-]{1,40}))?$/i.exec(p || '');
  if (!m) return null;
  const mask = parseInt(m[1], 36) || 0;
  const pick = (list, ch) => (ch === 'x' ? null : list[+ch] || null);
  const project = m[5] ? SITE.projects.find(x => x.slug === m[5]) : null;
  return {
    what: B.what.filter((_, i) => mask & (1 << i)),
    field: pick(B.field, m[2]),
    when: pick(B.when, m[3]),
    project: project ? project.title : null,
    promo: !!m[4]
  };
}

const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const low = s => (/^[А-ЯЁ](?![А-ЯЁA-Z])/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

function briefLines(b) {
  const out = ['<b>Хочу:</b> ' + (b.what.length ? esc(b.what.map(low).join(', ')) : 'обсудить проект')];
  if (b.project) out.push('<b>Понравилась работа:</b> «' + esc(b.project) + '»');
  if (b.field) out.push('<b>Сфера:</b> ' + esc(low(b.field)));
  if (b.when) out.push('<b>Сроки:</b> ' + esc(low(b.when)));
  if (b.promo) out.push('<b>Скидка:</b> хочет скидку за видеоотзыв и рекламу');
  out.push('✅ С условиями работы ознакомлен(а)');
  return out;
}

if (process.argv[2] === '--test') {
  const b = parsePayload(process.argv[3] || 'z3-12-rahat');
  console.log(b ? briefLines(b).join('\n').replace(/<[^>]+>/g, '') : 'Код не распознан');
  process.exit(0);
}
if (!TOKEN) {
  console.error('Нет BOT_TOKEN. Скопируйте .env.example в .env и впишите токен от @BotFather.');
  process.exit(1);
}

/* ── хранилище: чат владельца и отправленные заявки ────────────────── */
const DB_FILE = path.join(DIR, 'data.json');
const db = fs.existsSync(DB_FILE)
  ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
  : { owner: process.env.OWNER_CHAT_ID ? +process.env.OWNER_CHAT_ID : null, users: {}, queue: [] };
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 1));

/* ── Telegram API ──────────────────────────────────────────────────── */
const API = `https://api.telegram.org/bot${TOKEN}`;
async function call(method, body) {
  try {
    const r = await fetch(`${API}/${method}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body)
    });
    const j = await r.json();
    if (!j.ok) console.error('Telegram API:', method, j.description);
    return j.ok ? j.result : null;
  } catch (e) {
    console.error('Сеть:', method, e.message);
    return null;
  }
}
const send = (chat_id, text, extra = {}) =>
  call('sendMessage', { chat_id, text, parse_mode: 'HTML', disable_web_page_preview: true, ...extra });

/* ── проверка «не бот» ─────────────────────────────────────────────── */
const SIGNS = [
  { id: 'moon', emoji: '🌙', word: 'полумесяц' },
  { id: 'star', emoji: '⭐', word: 'звезду' },
  { id: 'palm', emoji: '🌴', word: 'пальму' },
  { id: 'dome', emoji: '🕌', word: 'мечеть' }
];
// userId → { brief, text, voice, human, waitingText, target, key, fails, lockUntil }
const drafts = new Map();
const newDraft = brief => ({ brief, text: '', voice: null, human: false, waitingText: !brief, fails: 0, lockUntil: 0 });
const shuffle = a => a.map(v => [crypto.randomInt(1e6), v]).sort((x, y) => x[0] - y[0]).map(v => v[1]);

function askHuman(chatId, d) {
  d.target = SIGNS[crypto.randomInt(SIGNS.length)];
  d.key = crypto.randomBytes(3).toString('hex');
  return send(chatId, `Проверка, что вы не бот: нажмите на <b>${d.target.word}</b>`, {
    reply_markup: { inline_keyboard: [shuffle(SIGNS).map(s => ({ text: s.emoji, callback_data: `h:${d.key}:${s.id}` }))] }
  });
}

/* ── одна заявка с аккаунта ───────────────────────────────────────── */
const isOwner = u => (u.username || '').toLowerCase() === OWNER_USERNAME;
function alreadySent(userId) {
  const u = db.users[userId];
  return !!(u && u.status === 'sent' && Date.now() - u.ts < REPEAT_DAYS * 864e5);
}
const ALREADY = 'Вы уже отправили заявку, дождитесь ответа 🙏\nЯ напишу вам сюда или в личные сообщения.';

async function deliver(from, d) {
  const name = [from.first_name, from.last_name].filter(Boolean).join(' ') || 'Клиент';
  const lines = ['🆕 <b>Заявка с сайта-портфолио</b>', '',
    `👤 <a href="tg://user?id=${from.id}">${esc(name)}</a>` + (from.username ? ` (@${esc(from.username)})` : '')];
  if (d.brief) lines.push(...briefLines(d.brief));
  if (d.text) lines.push('<b>Сообщение:</b> ' + esc(d.text.slice(0, 1500)));
  if (d.voice) lines.push('🎤 Голосовое — ниже');
  const item = {
    text: lines.join('\n'),
    markup: { inline_keyboard: [[{ text: '✅ Ответил — снять ограничение', callback_data: `done:${from.id}` }]] },
    voice: d.voice
  };

  if (!isOwner(from)) db.users[from.id] = { status: 'sent', ts: Date.now(), username: from.username || '', name };
  if (db.owner) await pushToOwner(item);
  else { db.queue.push(item); console.warn('Владелец ещё не нажал «Старт» в боте — заявка отложена'); }
  save();
  drafts.delete(from.id);
  return send(from.id, '✅ Заявка отправлена!\nЯ отвечу в течение дня — сюда или в личные сообщения. Спасибо, что написали.');
}
async function pushToOwner(item) {
  await send(db.owner, item.text, { reply_markup: item.markup });
  if (item.voice) await call('forwardMessage', { chat_id: db.owner, from_chat_id: item.voice.chat, message_id: item.voice.id });
}

/* ── сообщения ────────────────────────────────────────────────────── */
async function onMessage(msg) {
  const from = msg.from, chatId = msg.chat.id;
  if (!from || from.is_bot || msg.chat.type !== 'private') return;
  const text = (msg.text || msg.caption || '').trim();

  // владелец: запоминаем его чат, отдаём отложенные заявки, команды
  if (isOwner(from) && !(drafts.get(from.id) && text && !text.startsWith('/'))) {
    if (db.owner !== chatId) { db.owner = chatId; save(); }
    if (text === '/test') {
      const d = newDraft(parsePayload('z1-xx'));
      drafts.set(from.id, d);
      await send(chatId, 'Тест: так заявку видит клиент. Пройдите проверку — заявка придёт вам же.');
      return askHuman(chatId, d);
    }
    if (text.startsWith('/unblock')) {
      const q = (text.split(/\s+/)[1] || '').replace(/^@/, '').toLowerCase();
      const id = Object.keys(db.users).find(k => k === q || (db.users[k].username || '').toLowerCase() === q);
      if (id) { db.users[id].status = 'done'; save(); return send(chatId, 'Ограничение снято.'); }
      return send(chatId, 'Не нашёл. Напишите /unblock @ник или /unblock числовой-id');
    }
    if (text === '/stats') {
      const all = Object.values(db.users);
      return send(chatId, `Заявок всего: ${all.length}\nЖдут ответа: ${all.filter(u => u.status === 'sent').length}`);
    }
    const queued = db.queue.splice(0);
    if (queued.length) save();
    for (const it of queued) await pushToOwner(it);
    return send(chatId, (queued.length ? `Доставил отложенных заявок: ${queued.length}.\n\n` : '')
      + 'Готово: заявки с сайта будут приходить сюда.\n/test — пройти путь клиента самому\n/stats — сколько заявок\n/unblock @ник — снять ограничение');
  }

  if (text === '/id') return send(chatId, `Ваш id: <code>${from.id}</code>`);
  if (alreadySent(from.id)) return send(chatId, ALREADY);

  let d = drafts.get(from.id);
  if (d && d.lockUntil > Date.now()) return send(chatId, 'Слишком много попыток. Попробуйте через несколько минут.');

  if (text.startsWith('/start')) {
    const brief = parsePayload(text.split(/\s+/)[1]);
    d = newDraft(brief);
    drafts.set(from.id, d);
    await send(chatId, `Ас-саляму алейкум${from.first_name ? ', ' + esc(from.first_name) : ''}! 👋\n`
      + `Я принимаю заявки для ${esc(SITE.brand.name)}: сайты, приложения и Telegram-боты.`
      + (brief ? '\n\nВаша заявка:\n' + briefLines(brief).join('\n') : ''));
    return askHuman(chatId, d);
  }

  // обычное сообщение — описание задачи (текст или голосовое)
  if (!d) { d = newDraft(null); drafts.set(from.id, d); }
  if (text) d.text = text;
  if (msg.voice || msg.audio || msg.video_note) d.voice = { chat: chatId, id: msg.message_id };
  if (!d.human) return askHuman(chatId, d);
  if (d.text || d.voice) return deliver(from, d);
}

/* ── кнопки ───────────────────────────────────────────────────────── */
async function onCallback(q) {
  const from = q.from, data = q.data || '';
  const answer = (text, alert = false) => call('answerCallbackQuery', { callback_query_id: q.id, text, show_alert: alert });

  if (data.startsWith('done:')) {                     // владелец снял ограничение
    if (!q.message || q.message.chat.id !== db.owner) return answer('Это кнопка владельца');
    const u = db.users[data.slice(5)];
    if (u) { u.status = 'done'; save(); }
    call('editMessageReplyMarkup', {
      chat_id: q.message.chat.id, message_id: q.message.message_id,
      reply_markup: { inline_keyboard: [[{ text: '✅ Отвечено', callback_data: 'noop' }]] }
    });
    return answer('Готово: клиент может отправить новую заявку');
  }
  if (!data.startsWith('h:')) return answer('');

  const [, key, id] = data.split(':');
  const d = drafts.get(from.id);
  if (alreadySent(from.id)) { answer(''); return send(from.id, ALREADY); }
  if (!d || d.key !== key) return answer('Эта проверка устарела — нажмите /start', true);
  if (d.lockUntil > Date.now()) return answer('Слишком много попыток, подождите', true);

  if (q.message) call('editMessageReplyMarkup', { chat_id: q.message.chat.id, message_id: q.message.message_id, reply_markup: { inline_keyboard: [] } });
  if (id !== d.target.id) {
    if (++d.fails >= 3) {
      d.fails = 0; d.lockUntil = Date.now() + 10 * 60e3;
      answer('');
      return send(from.id, 'Слишком много попыток. Попробуйте через 10 минут.');
    }
    answer('Не тот знак, попробуйте ещё раз');
    return askHuman(from.id, d);
  }
  d.human = true;
  answer('Спасибо!');
  if (d.brief || d.text || d.voice) return deliver(from, d);
  return send(from.id, 'Спасибо! Опишите задачу одним сообщением: что нужно сделать и для какого дела. Можно голосовым.');
}

/* ── длинный опрос ────────────────────────────────────────────────── */
const lastSeen = new Map();          // защита от флуда: одно событие в 0,7 с на человека
let offset = 0;
async function poll() {
  const updates = await call('getUpdates', { offset, timeout: 50, allowed_updates: ['message', 'callback_query'] });
  for (const u of updates || []) {
    offset = u.update_id + 1;
    const uid = (u.message && u.message.from && u.message.from.id) || (u.callback_query && u.callback_query.from.id);
    const now = Date.now();
    if (uid && now - (lastSeen.get(uid) || 0) < 700) {
      if (u.callback_query) call('answerCallbackQuery', { callback_query_id: u.callback_query.id });
      continue;
    }
    if (uid) lastSeen.set(uid, now);
    try {
      if (u.message) await onMessage(u.message);
      else if (u.callback_query) await onCallback(u.callback_query);
    } catch (e) { console.error('Ошибка обработки:', e); }
  }
  setTimeout(poll, updates ? 0 : 3000);   // нет связи — ждём и пробуем снова
}

const me = await call('getMe', {});
if (!me) { console.error('Токен не подходит или нет связи с Telegram — проверьте BOT_TOKEN'); process.exit(1); }
console.log(`Бот @${me.username} запущен. Владелец: @${OWNER_USERNAME}${db.owner ? '' : ' — ещё не нажал «Старт» в боте'}.`);
poll();
