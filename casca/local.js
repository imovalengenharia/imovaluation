/* A Imovaluation no computador de quem usa: só o Node, nada para instalar.
   O banco é o PGlite — o próprio Postgres em WebAssembly, dentro deste
   processo — e mora na pasta Imovaluation dentro da pasta do usuário, fora da
   pasta do código, para sobreviver a cada atualização.
   Roda com:  node casca/local.js  (os atalhos iniciar.bat / iniciar.command fazem isso). */
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const PASTA = process.env.IMOVALUATION_DADOS || join(homedir(), 'Imovaluation');
const DIR_BANCO = join(PASTA, 'banco');
const PORTA = Number(process.env.PORTA || 3000);
const ENDERECO = `http://localhost:${PORTA}`;

let criarBancoEmbutido;
try { ({ criarBancoEmbutido } = await import('./banco-embutido.js')); }
catch {
  console.error('\nFalta instalar os componentes. Rode antes:  npm ci --omit=dev\n');
  process.exit(1);
}

mkdirSync(PASTA, { recursive: true });
console.log('Imovaluation: abrindo o banco em', DIR_BANCO);
const banco = await criarBancoEmbutido(DIR_BANCO);

let descer = () => banco.fechar();
let parando = false;
async function encerrar() {
  if (parando) return;
  parando = true;
  console.log('\nParando a Imovaluation...');
  try { await descer(); } catch {}
  process.exit(0);
}
/* SIGHUP é o que o Windows manda quando a janela é fechada no X */
for (const sinal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sinal, encerrar);

try {
  process.env.URL_PUBLICA ??= ENDERECO;
  const { lerConfig } = await import('./config.js');
  const { subir } = await import('./iniciar.js');
  /* só este computador enxerga a plataforma: ninguém da rede entra */
  ({ descer } = await subir({ ...lerConfig(), urlBanco: 'embutido', porta: PORTA, host: 'localhost' }, banco));
} catch (err) {
  if (err.code === 'EADDRINUSE') console.error(`\nA porta ${PORTA} já está em uso — a Imovaluation já está aberta em outra janela?`);
  else console.error(err);
  await banco.fechar().catch(() => {});
  process.exit(1);
}

console.log(`\nImovaluation rodando em ${ENDERECO}`);
console.log('Deixe esta janela aberta enquanto usa. Para parar, feche a janela ou aperte Ctrl+C.\n');
if (!process.env.SEM_NAVEGADOR) {
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', ENDERECO]]
    : process.platform === 'darwin' ? ['open', [ENDERECO]] : ['xdg-open', [ENDERECO]];
  spawn(cmd, args, { stdio: 'ignore', detached: true }).on('error', () => {}).unref();
}
