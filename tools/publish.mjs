// Публикация сайта: текущая версия (то, что сохранено в git) одним коммитом уходит
// в открытый репозиторий GitHub sultanshinalmaz/portfolio → Vercel (проект «portfolio»)
// сам выкладывает её за минуту, а GitHub Actions (deploy-regru.yml) — на reg.ru по FTP.
//   node tools/publish.mjs "что поменялось"
// Историю правок туда не отправляем: в старых версиях были ник и номер, а репозиторий открытый.
import { execFileSync } from 'node:child_process';

const REMOTE = 'https://github.com/sultanshinalmaz/portfolio.git';
const REF = 'refs/remotes/gh-portfolio/main';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const tryRev = r => { try { return git('rev-parse', '-q', '--verify', r); } catch { return ''; } };
const msg = (process.argv[2] || 'Обновление сайта') + '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>';

if (git('status', '--porcelain', '--untracked-files=no')) {
  console.error('Есть несохранённые изменения — сначала git commit, потом публикация.');
  process.exit(1);
}
// версии стилей и скриптов в адресах (иначе браузеры 45 дней показывают старые) — свой коммит, если поменялись
const { changed } = await import('./bump.mjs');
if (changed) { git('add', 'index.html'); git('commit', '-q', '-m', 'Версии стилей и скриптов в адресах\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'); }
const last = tryRev(REF);                       // что публиковали отсюда в прошлый раз
git('fetch', '-q', REMOTE, 'main');
const tree = git('rev-parse', 'HEAD^{tree}'), parent = git('rev-parse', 'FETCH_HEAD');
// на GitHub правили не отсюда (например, через сайт GitHub) — эти правки должны быть и в папке,
// иначе публикация их сотрёт (так 6.10.2026 пропали .htaccess и выкладка на reg.ru)
if (last && last !== parent) {
  const lost = git('diff', '--name-only', last, parent).split('\n').filter(Boolean)
    .filter(f => tryRev(`${parent}:${f}`) !== tryRev(`HEAD:${f}`));
  if (lost.length) {
    console.error('На GitHub есть правки, которых нет в папке, — публикация их сотрёт:\n  ' + lost.join('\n  ') +
      `\nПеренесите их: git diff ${last.slice(0, 7)} ${parent.slice(0, 7)} | git apply --index — потом git commit и снова публикация.`);
    process.exit(1);
  }
}
if (git('rev-parse', parent + '^{tree}') === tree) { console.log('На GitHub уже эта версия.'); process.exit(0); }
const commit = git('commit-tree', tree, '-p', parent, '-m', msg);
git('push', '-q', REMOTE, commit + ':refs/heads/main');
git('update-ref', REF, commit);
console.log('Отправлено на GitHub:', commit.slice(0, 7), '— Vercel выложит через минуту.');
