/* A ponte casca ↔ módulo num navegador de verdade: a única fronteira que o
   inject não enxerga. Roda com:  npm run test:navegador  (precisa do Chromium
   do Playwright: npx playwright install chromium). */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { subir } from '../ajuda.js';

let T, nav, base;
before(async () => {
  T = await subir();
  await T.app.listen({ port: 0, host: '127.0.0.1' });
  base = `http://127.0.0.1:${T.app.server.address().port}`;
  nav = await chromium.launch();
});
after(async () => { await nav?.close(); await T?.descer(); });

async function entrarNovo(email) {
  const pg = await (await nav.newContext()).newPage();
  /* sem rede para fora: as fontes do Google não atrasam nem sujam o console */
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(base + '/cadastro');
  await pg.fill('#nome', 'Pessoa'); await pg.fill('#email', email); await pg.fill('#senha', 'senha-bem-longa');
  await pg.click('button[type=submit]');
  await pg.waitForURL(base + '/modelagens');
  return { pg, erros };
}

/* modelagens → involutivo → pasta nova → estudo novo, pelos cliques da tela */
async function criarEstudo(pg, pasta, nome) {
  await pg.goto(base + '/modelagens');
  await pg.click('a.modelagem');
  const campoPasta = pg.locator('input[placeholder="Nome da nova pasta"]');
  if (pasta) { await campoPasta.first().fill(pasta); await campoPasta.first().press('Enter'); await pg.waitForURL(/\/modelagens\/involutivo\/.+/); }
  else await pg.click('.pasta-cartao');                  // a metodologia abre nas pastas: entra na primeira
  await pg.click('.cab-pasta [data-abrir="p-novo"]');
  await pg.fill('#p-novo input[name=nome]', nome);
  await pg.click('#p-novo button[type=submit]');
  await pg.waitForURL(/\/estudos\//);
  return pg.url().split('/').pop();
}

const primeiroCampo = fr => fr.locator('#folha input:not([type=hidden]):not([readonly])').first();
const salvo = pg => pg.waitForFunction(() => document.getElementById('estado').textContent === 'Salvo');

test('do login ao estudo: cada mudança vai para o banco, e o cartão mostra o resumo', async () => {
  const { pg, erros } = await entrarNovo('ponte@exemplo.com');
  const id = await criarEstudo(pg, 'Clientes 2026', 'Gleba Itu');

  const fr = pg.frameLocator('#modulo');
  const campo = primeiroCampo(fr);
  await campo.waitFor();
  assert.equal(await fr.locator('#btn-json').textContent(), 'Baixar premissas');

  await campo.fill('123456'); await campo.press('Tab');
  await salvo(pg);
  const guardado = await T.banco.um('SELECT premissas, resumo FROM estudo WHERE id = $1', [id]);
  assert.ok(guardado.premissas && guardado.premissas.areas, 'as premissas chegaram ao banco');
  assert.equal(guardado.resumo[0][0], 'Valor da gleba', 'e o resumo do topo também');

  await pg.click('.trilha a:nth-of-type(3)');           // volta à pasta pela trilha
  await pg.waitForURL(/\/modelagens\/involutivo\/.+/);
  assert.match(await pg.textContent('.estudo .destaque .valor'), /^R\$/);

  await pg.click('.estudo .cobre');
  await primeiroCampo(fr).waitFor();
  assert.equal(await primeiroCampo(fr).inputValue(), '123.456', 'reaberto, o estudo volta do banco');
  assert.deepEqual(erros, []);
});

test('abrir sem editar já põe os números no cartão', async () => {
  const { pg } = await entrarNovo('sonumeros@exemplo.com');
  const id = await criarEstudo(pg, 'Só olhar', 'Aberto e fechado');
  await primeiroCampo(pg.frameLocator('#modulo')).waitFor();
  let r = null;
  for (let i = 0; i < 20 && !r; i++) {
    await pg.waitForTimeout(100);
    r = (await T.banco.um('SELECT resumo FROM estudo WHERE id = $1', [id])).resumo;
  }
  assert.equal(r?.[0]?.[0], 'Valor da gleba');
});

test('reabre onde parou: na mesma aba', async () => {
  const { pg } = await entrarNovo('vista@exemplo.com');
  const id = await criarEstudo(pg, 'Vista', 'Onde parei');
  const fr = pg.frameLocator('#modulo');
  await primeiroCampo(fr).waitFor();
  await fr.locator('#abas button', { hasText: 'Demonstrativo' }).click();
  /* a troca de aba grava na hora — sem esperar a rolagem assentar */
  let gravada = null;
  for (let i = 0; i < 20 && !gravada; i++) {
    await pg.waitForTimeout(100);
    gravada = (await T.banco.um('SELECT vista FROM estudo WHERE id = $1', [id])).vista;
  }
  assert.equal(gravada?.aba, 'drf', 'a aba gravou em menos de 2 s');

  await pg.goto(base + '/estudos/' + id);
  await fr.locator('#abas button[aria-selected="true"]').waitFor();
  assert.equal(await fr.locator('#abas button[aria-selected="true"]').textContent(), 'Demonstrativo');
  const v = await T.banco.um('SELECT vista FROM estudo WHERE id = $1', [id]);
  assert.equal(v.vista.rotulo, 'Demonstrativo');
});

test('dois estudos da mesma pasta não se misturam, e nada vai para o localStorage', async () => {
  const { pg } = await entrarNovo('dois@exemplo.com');
  const um = await criarEstudo(pg, 'Mesma pasta', 'Um');
  const fr = pg.frameLocator('#modulo');
  await primeiroCampo(fr).waitFor();
  await primeiroCampo(fr).fill('777'); await primeiroCampo(fr).press('Tab');
  await salvo(pg);
  const dois = await criarEstudo(pg, null, 'Dois');
  assert.notEqual(um, dois);
  await primeiroCampo(fr).waitFor();
  assert.notEqual(await primeiroCampo(fr).inputValue(), '777');
  const local = await pg.evaluate(() => localStorage.getItem('involutivo.premissas'));
  assert.equal(local, null);
});
