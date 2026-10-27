// Версии файлов в адресах: index.html подключает стили и скрипты как assets/…?v=<отпечаток файла>.
// Хостинг reg.ru велит браузерам хранить css/js 45 дней — без новой версии в адресе посетители видели бы старый сайт.
// Отпечаток меняется сам при любой правке файла. Запускается из tools/publish.mjs; вручную: node tools/bump.mjs
// Сначала — файлы языков, которые подгружает assets/js/i18n.js (их адреса записаны в нём), потом index.html:
// поменялся язык → поменялся i18n.js → новая версия и у него.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = rel => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, rel), 'latin1').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8);   // переводы строк не влияют
function stamp(rel, re) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) return false;
  const src = fs.readFileSync(file, 'utf8');
  const out = src.replace(re, (m, open, asset, close) => fs.existsSync(path.join(ROOT, asset)) ? `${open}${asset}?v=${version(asset)}${close}` : m);
  if (out === src) return false;
  fs.writeFileSync(file, out);
  console.log('Версии файлов обновлены:', rel);
  return true;
}
const a = stamp('assets/js/i18n.js', /(')(assets\/js\/lang\/[a-z]+\.js)(?:\?v=[^']*)?(')/g);
const b = stamp('index.html', /((?:href|src)=")(assets\/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?(")/g);
export const changed = a || b;
