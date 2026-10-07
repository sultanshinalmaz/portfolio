// Версии файлов в адресах: index.html подключает стили и скрипты как assets/…?v=<отпечаток файла>.
// Хостинг reg.ru велит браузерам хранить css/js 45 дней — без новой версии в адресе посетители видели бы старый сайт.
// Отпечаток меняется сам при любой правке файла. Запускается из tools/publish.mjs; вручную: node tools/bump.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const file = path.join(ROOT, 'index.html');
const html = fs.readFileSync(file, 'utf8');
const out = html.replace(/((?:href|src)=")(assets\/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?"/g, (m, attr, rel) => {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return m;
  const v = crypto.createHash('sha1').update(fs.readFileSync(p, 'latin1').replace(/\r\n/g, '\n')).digest('hex').slice(0, 8);   // переводы строк не влияют
  return `${attr}${rel}?v=${v}"`;
});
if (out !== html) { fs.writeFileSync(file, out); console.log('Версии файлов в index.html обновлены'); }
export const changed = out !== html;
