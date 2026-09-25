/* A ponte casca ↔ comparativo num navegador de verdade: o estudo vai e volta
   do banco, as fotos entram nas premissas e o laudo sai em páginas A4.
   Roda com:  npm run test:navegador */
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

/* um PNG de 2 × 2 pixels, o bastante para o módulo reduzir e guardar */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVQImWP8z8DwnwEJMDGgASYGBgA0hAIDXb4WtwAAAABJRU5ErkJggg==', 'base64');

async function abrirEstudoNovo(email) {
  const pg = await (await nav.newContext()).newPage();
  await pg.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
  const erros = [];
  pg.on('pageerror', e => erros.push(String(e)));
  await pg.goto(base + '/cadastro');
  await pg.fill('#nome', 'Pessoa'); await pg.fill('#email', email); await pg.fill('#senha', 'senha-bem-longa');
  await pg.click('button[type=submit]');
  await pg.waitForURL(base + '/modelagens');
  await pg.click('a.modelagem[href="/modelagens/comparativo"]');
  await pg.click('.estudos .estudo.novo');
  await pg.fill('#m-nova-pasta input[name=nome]', 'Laudos');
  await pg.click('#m-nova-pasta button[type=submit]');
  await pg.waitForURL(/\/modelagens\/comparativo\/.+/);
  await pg.click('.cab-pasta [data-abrir="p-novo"]');
  await pg.fill('#p-novo input[name=nome]', 'Apto 1600');
  await pg.click('#p-novo button[type=submit]');
  await pg.waitForURL(/\/estudos\//);
  return { pg, erros, id: pg.url().split('/').pop(), fr: pg.frameLocator('#modulo') };
}
const salvo = pg => pg.waitForFunction(() => document.getElementById('estado').textContent === 'Salvo');
const premissas = async id => (await T.banco.um('SELECT premissas, resumo, vista FROM estudo WHERE id = $1', [id]));

test('capa digitada e foto inserida vão para o banco; reaberto, o estudo volta igual', async () => {
  const { pg, erros, id, fr } = await abrirEstudoNovo('laudo@exemplo.com');
  const proponente = fr.getByLabel('capa.proponente');
  await proponente.waitFor();
  assert.equal(await fr.locator('#btn-json').textContent(), 'Baixar premissas');

  await proponente.fill('Renda Participações S.A.');
  await fr.getByLabel('capa.areas.privativa.estimada').fill('883,32');
  await salvo(pg);
  let d = await premissas(id);
  assert.equal(d.premissas.capa.proponente, 'Renda Participações S.A.');
  assert.equal(d.premissas.capa.areas.privativa.estimada, 883.32);
  assert.equal(d.resumo[0][0], 'Valor de mercado');

  const escolha = pg.waitForEvent('filechooser');
  await fr.locator('.foto .quadro-img.escolher').first().click();
  await (await escolha).setFiles({ name: 'fachada.png', mimeType: 'image/png', buffer: PNG });
  await fr.locator('.foto .quadro-img img').first().waitFor();
  for (let i = 0; i < 40 && !d.premissas.capa.fotoFachada; i++) { await pg.waitForTimeout(100); d = await premissas(id); }
  assert.match(d.premissas.capa.fotoFachada, /^data:image\/jpeg;base64,/, 'a foto entrou reduzida, como JPEG');

  await pg.reload();
  await fr.getByLabel('capa.proponente').waitFor();
  assert.equal(await fr.getByLabel('capa.proponente').inputValue(), 'Renda Participações S.A.');
  assert.equal(await fr.locator('.foto .quadro-img img').count(), 1);
  assert.deepEqual(erros, []);
});

test('reabre na aba onde parou, e o laudo impresso sai em páginas A4', async () => {
  const { pg, erros, id, fr } = await abrirEstudoNovo('impressao@exemplo.com');
  await fr.locator('#abas button', { hasText: 'Cálculo' }).click();
  await fr.locator('.painel').waitFor();
  let v = null;
  for (let i = 0; i < 20 && !v; i++) { await pg.waitForTimeout(100); v = (await premissas(id)).vista; }
  assert.equal(v?.aba, 'calculo');

  await pg.goto(base + '/estudos/' + id);
  await fr.locator('#abas button[aria-selected="true"]', { hasText: 'Cálculo' }).waitFor();

  /* imprimir: o navegador não abre a janela aqui, mas o laudo é montado */
  const quadro = pg.frame({ url: /\/m\/comparativo\// });
  await quadro.evaluate(() => { window.print = () => { window.__impresso = true; }; });
  await fr.locator('#btn-imprimir').click();
  await fr.locator('#dlg-imprimir-ok').click();
  await quadro.waitForFunction(() => window.__impresso === true);
  const partes = await quadro.evaluate(() =>
    Array.from(document.querySelectorAll('#impressao .pagina')).map(p => p.dataset.parte));
  assert.deepEqual(partes, ['capa', 'regiao', 'restricoes', 'fichas', 'fichas', 'calculo', 'grafico', 'liquidacao'],
    'sem fotos nem anexos, oito páginas');
  assert.equal(await quadro.evaluate(() => document.querySelectorAll('#impressao input, #impressao select').length), 0,
    'no papel não há campo, só texto');

  /* a aba Impressão mostra as mesmas páginas, numeradas, sem nenhum campo */
  await fr.locator('#abas button', { hasText: 'Impressão' }).click();
  await fr.locator('.previa .rotulo-pagina').first().waitFor();
  assert.equal(await fr.locator('.previa .rotulo-pagina').first().textContent(), 'Página 1 de 8 · Capa');
  assert.equal(await fr.locator('.previa input, .previa select, .previa textarea').count(), 0);
  assert.equal(await fr.locator('.folha-previa.passa').count(), 0, 'o estudo em branco cabe em A4');
  assert.deepEqual(erros, []);
});
