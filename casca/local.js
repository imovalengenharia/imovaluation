/* A Imovaluation no computador de quem usa, sem Docker e sem instalar
   Postgres: o banco vem embutido (pacote embedded-postgres) e mora na pasta
   Imovaluation dentro da pasta do usuário — fora da pasta do código, para
   sobreviver a cada atualização. Roda com:  node casca/local.js
   (os atalhos iniciar.bat / iniciar.command fazem isso). */
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

/* No Windows, o Postgres costuma falhar em caminho com acento (C:\Users\João):
   nesse caso o banco vai para C:\Imovaluation. */
const naCasa = join(homedir(), 'Imovaluation');
const PASTA = process.env.IMOVALUATION_DADOS
  || (process.platform === 'win32' && /[^\x20-\x7e]/.test(naCasa) ? 'C:\\Imovaluation' : naCasa);
const DIR_BANCO = join(PASTA, 'banco');
const PORTA_BANCO = 54329;                       // longe da 5432, que pode já ter dono
const PORTA = Number(process.env.PORTA || 3000);
const ENDERECO = `http://localhost:${PORTA}`;

let EmbeddedPostgres;
try { ({ default: EmbeddedPostgres } = await import('embedded-postgres')); }
catch {
  console.error('\nFalta instalar as dependências. Rode antes:  npm install --omit=dev\n');
  process.exit(1);
}

mkdirSync(PASTA, { recursive: true });
const pg = new EmbeddedPostgres({
  databaseDir: DIR_BANCO, port: PORTA_BANCO,
  user: 'imovaluation', password: 'imovaluation', persistent: true,
  /* UTF-8 sempre: sem isso o Windows cria o banco na codificação regional
     (WIN1252) e recusa o que não cabe nela */
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {}, onError: m => { if (String(m).trim()) console.error(String(m).trim()); },
});

console.log('Imovaluation: preparando o banco em', DIR_BANCO);
const novo = !existsSync(join(DIR_BANCO, 'PG_VERSION'));
if (novo) await pg.initialise();
await pg.start();
if (novo) await pg.createDatabase('imovaluation');

let descer = async () => {};
async function encerrar() {
  console.log('\nParando a Imovaluation...');
  try { await descer(); } catch {}
  try { await pg.stop(); } catch {}
  process.exit(0);
}
/* SIGHUP é o que o Windows manda quando a janela é fechada no X */
for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(sinal, encerrar);

try {
  process.env.DATABASE_URL = `postgres://imovaluation:imovaluation@127.0.0.1:${PORTA_BANCO}/imovaluation`;
  process.env.URL_PUBLICA ??= ENDERECO;
  const { lerConfig } = await import('./config.js');
  const { subir } = await import('./iniciar.js');
  /* só este computador enxerga a plataforma: ninguém da rede entra */
  ({ descer } = await subir({ ...lerConfig(), porta: PORTA, host: 'localhost' }));
} catch (err) {
  if (err.code === 'EADDRINUSE') console.error(`\nA porta ${PORTA} já está em uso — a Imovaluation já está aberta em outra janela?`);
  else console.error(err);
  await pg.stop().catch(() => {});
  process.exit(1);
}

console.log(`\nImovaluation rodando em ${ENDERECO}`);
console.log('Deixe esta janela aberta enquanto usa. Para parar, feche a janela ou aperte Ctrl+C.\n');
if (!process.env.SEM_NAVEGADOR) {
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', ENDERECO]]
    : process.platform === 'darwin' ? ['open', [ENDERECO]] : ['xdg-open', [ENDERECO]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}
