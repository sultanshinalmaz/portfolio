// Публикация сайта: текущая версия (то, что сохранено в git) одним коммитом уходит
// в открытый репозиторий GitHub sultanshinalmaz/portfolio → Vercel (проект «portfolio»)
// сам выкладывает её за минуту.
//   node tools/publish.mjs "что поменялось"
// Историю правок туда не отправляем: в старых версиях были ник и номер, а репозиторий открытый.
import { execFileSync } from 'node:child_process';

const REMOTE = 'https://github.com/sultanshinalmaz/portfolio.git';
const REF = 'refs/remotes/gh-portfolio/main';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] }).trim();
const msg = (process.argv[2] || 'Обновление сайта') + '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>';

if (git('status', '--porcelain', '--untracked-files=no')) {
  console.error('Есть несохранённые изменения — сначала git commit, потом публикация.');
  process.exit(1);
}
git('fetch', '-q', REMOTE, 'main:' + REF);
const tree = git('rev-parse', 'HEAD^{tree}'), parent = git('rev-parse', REF);
if (git('rev-parse', parent + '^{tree}') === tree) { console.log('На GitHub уже эта версия.'); process.exit(0); }
const commit = git('commit-tree', tree, '-p', parent, '-m', msg);
git('push', '-q', REMOTE, commit + ':refs/heads/main');
git('update-ref', REF, commit);
console.log('Отправлено на GitHub:', commit.slice(0, 7), '— Vercel выложит через минуту.');
