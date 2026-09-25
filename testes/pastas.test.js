import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { subir, cadastrar, idDe } from './ajuda.js';

let T, ana, beto;
before(async () => {
  T = await subir();
  ana = await cadastrar(T.app, 'ana@exemplo.com');
  beto = await cadastrar(T.app, 'beto@exemplo.com');
});
after(() => T?.descer());

const novaPasta = async (c, nome) => idDe(await c.post('/modelagens/involutivo/pastas', { nome }));
const novoEstudo = async (c, pasta, nome) => idDe(await c.post(`/pastas/${pasta}/estudos`, { nome }));
const salvar = (c, id, premissas, resumo) => c.put(`/api/estudos/${id}/premissas`, { premissas, resumo });

test('depois de entrar, aparecem só as metodologias — nenhuma pasta, nenhum estudo', async () => {
  const c = await cadastrar(T.app, 'nova@exemplo.com');
  assert.equal((await c.get('/')).headers.location, '/modelagens');
  const p = idDe(await c.post('/modelagens/involutivo/pastas', { nome: 'Pasta que não aparece aqui' }));
  const e = idDe(await c.post(`/pastas/${p}/estudos`, { nome: 'Estudo que não aparece aqui' }));
  await c.get('/estudos/' + e);
  const r = await c.get('/modelagens');
  assert.equal(r.statusCode, 200);
  assert.match(r.body, /Escolha o tipo de análise da qualidade do investimento imobiliário/);
  assert.match(r.body, /href="\/modelagens\/involutivo"/);
  assert.match(r.body, /Glebas urbanizáveis/);
  assert.doesNotMatch(r.body, /Pasta que não aparece aqui|Estudo que não aparece aqui|\/estudos\//);
});

test('modelagem sem pastas convida a criar a primeira', async () => {
  const c = await cadastrar(T.app, 'vazia@exemplo.com');
  const r = await c.get('/modelagens/involutivo');
  assert.equal(r.statusCode, 200);
  assert.match(r.body, /Nova pasta de trabalho/, 'só o quadrado de criar');
  assert.doesNotMatch(r.body, /pasta-cartao|Nome da nova pasta/);
  assert.equal((await c.get('/modelagens/nao-existe')).statusCode, 404);
});

test('a metodologia abre nas pastas dela; pasta nova abre em seguida', async () => {
  const r = await ana.post('/modelagens/involutivo/pastas', { nome: 'Clientes 2026' });
  assert.equal(r.statusCode, 303);
  assert.match(r.headers.location, /^\/modelagens\/involutivo\/[0-9a-f-]{36}$/);
  const pagina = await ana.get(r.headers.location);
  assert.match(pagina.body, /<h1>Clientes 2026<\/h1>/);
  assert.match(pagina.body, /Criar o primeiro estudo desta pasta/);
  const metodologia = await ana.get('/modelagens/involutivo');
  assert.equal(metodologia.statusCode, 200, 'não pula para dentro de uma pasta');
  assert.match(metodologia.body, /Nova pasta de trabalho/);
  assert.match(metodologia.body, new RegExp(`href="${r.headers.location}"`));
});

test('vários estudos numa pasta; cada um abre o módulo e guarda onde parou', async () => {
  const pasta = await novaPasta(ana, 'Itu');
  const r = await ana.post(`/pastas/${pasta}/estudos`, { nome: 'Estudo 1' });
  assert.match(r.headers.location, /^\/estudos\/[0-9a-f-]{36}$/, 'o estudo novo abre em seguida');
  const e1 = idDe(r);
  const e2 = await novoEstudo(ana, pasta, 'Estudo 2');

  const pagina = await ana.get('/estudos/' + e1);
  assert.equal(pagina.statusCode, 200);
  assert.match(pagina.body, /data-src="\/m\/involutivo\/index.html\?casca"/);
  assert.match(pagina.body, />Itu</, 'a trilha mostra a pasta');

  const aberto = (await ana.get('/api/estudos/' + e1)).json();
  assert.equal(aberto.estudo.premissas, null);
  assert.equal(aberto.usuario.email, undefined, 'o módulo recebe só o que precisa');

  const premissas = { areas: { gleba: 160084 }, lista: [1, null, 'x'] };
  const resumo = [['Valor da gleba', 'R$ 40.726.692'], ['TIR real', '21,7 %']];
  assert.equal((await salvar(ana, e1, premissas, resumo)).statusCode, 200);
  assert.equal((await ana.put(`/api/estudos/${e1}/vista`, { vista: { aba: 'fluxo', rotulo: 'Fluxo de caixa', rolagem: { fluxo: 320 } } })).statusCode, 200);

  const volta = (await ana.get('/api/estudos/' + e1)).json().estudo;
  assert.deepEqual(volta.premissas, premissas, 'reabre com as premissas salvas');
  assert.deepEqual(volta.vista, { aba: 'fluxo', rotulo: 'Fluxo de caixa', rolagem: { fluxo: 320 } }, 'e onde parou');
  assert.equal((await ana.get('/api/estudos/' + e2)).json().estudo.premissas, null, 'o outro estudo não mudou');

  const area = await ana.get(`/modelagens/involutivo/${pasta}`);
  assert.match(area.body, /Estudo 1/);
  assert.match(area.body, /Estudo 2/);
  assert.match(area.body, /R\$ 40\.726\.692/, 'o cartão mostra o resumo');
  assert.match(area.body, /Parou em <em>Fluxo de caixa<\/em>/);
  assert.match(area.body, /2 estudos/);
});

test('"nova pasta" e "novo estudo" vêm sempre em primeiro; pastas e estudos mostram as datas', async () => {
  const p = await novaPasta(ana, 'Aaa primeira em ordem');
  const e = await novoEstudo(ana, p, 'Estudo com datas');
  const hoje = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  const metodologia = (await ana.get('/modelagens/involutivo')).body;
  const grade = metodologia.slice(metodologia.indexOf('<div class="estudos">'));
  assert.ok(grade.indexOf('Nova pasta de trabalho') < grade.indexOf('pasta-cartao'), 'o quadrado de nova pasta vem antes das pastas');
  assert.match(grade, new RegExp(`Criada em ${hoje.replace(/\//g, '\\/')}`));
  assert.match(grade, /Alterada em \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);

  const pasta = (await ana.get(`/modelagens/involutivo/${p}`)).body;
  const estudos = pasta.slice(pasta.indexOf('<div class="estudos">'));
  assert.ok(estudos.indexOf('Criar o primeiro estudo') === -1 && estudos.indexOf('Novo estudo') < estudos.indexOf('<article'),
    'o quadrado de novo estudo vem antes dos estudos');
  assert.match(estudos, new RegExp(`Criado em ${hoje.replace(/\//g, '\\/')}`));
  assert.match(estudos, /Alterado em \d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}/);
  assert.match(pasta, /criada em \d{2}\/\d{2}\/\d{4} ·/);
});

test('a data de alteração da pasta acompanha o que acontece nela', async () => {
  const a = await novaPasta(ana, 'Datas A');
  const b = await novaPasta(ana, 'Datas B');
  const e = await novoEstudo(ana, a, 'Vai e volta');
  const antigo = "2020-01-01T12:00:00Z";
  await T.banco.consulta('UPDATE pasta SET alterada_em = $1, criada_em = $1 WHERE id = ANY($2::uuid[])', [antigo, [a, b]]);
  await T.banco.consulta('UPDATE estudo SET atualizado_em = $1 WHERE id = $2', [antigo, e]);
  const alterada = async id => (await T.banco.um(
    `SELECT greatest(p.alterada_em, (SELECT max(atualizado_em) FROM estudo WHERE pasta_id = p.id)) AS d FROM pasta p WHERE id = $1`, [id])).d;
  assert.equal((await alterada(b)).getUTCFullYear(), 2020);
  await ana.post(`/estudos/${e}/mover`, { destino: b });
  assert.ok((await alterada(a)).getUTCFullYear() > 2020, 'a pasta de onde o estudo saiu mudou');
  assert.ok((await alterada(b)).getUTCFullYear() > 2020, 'a pasta para onde ele foi também');
  await T.banco.consulta('UPDATE pasta SET alterada_em = $1 WHERE id = $2', [antigo, b]);
  await salvar(ana, e, { x: 2 });
  assert.ok((await alterada(b)).getUTCFullYear() > 2020, 'editar um estudo altera a pasta');
});

test('ordem alfabética e numérica, e a lateral da pasta lista os estudos dela', async () => {
  const c = await cadastrar(T.app, 'ordem@exemplo.com');
  const nova = async nome => idDe(await c.post('/modelagens/involutivo/pastas', { nome }));
  const pz = await nova('Zeta'); await nova('pasta 10'); await nova('Pasta 2'); await nova('Ágata');
  const met = (await c.get('/modelagens/involutivo')).body;
  const ordemPastas = [...met.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
  assert.deepEqual(ordemPastas, ['Ágata', 'Pasta 2', 'pasta 10', 'Zeta']);

  for (const n of ['Estudo 10', 'estudo 2', 'Estudo 1', 'Área norte']) await c.post(`/pastas/${pz}/estudos`, { nome: n });
  const pag = (await c.get(`/modelagens/involutivo/${pz}`)).body;
  const lateral = pag.slice(pag.indexOf('<aside'), pag.indexOf('</aside>'));
  assert.match(lateral, /Estudos na pasta/);
  assert.doesNotMatch(lateral, /Pasta 2|Ágata/, 'a lateral não mostra as outras pastas');
  const naLateral = [...lateral.matchAll(/<span class="nome">([^<]+)<\/span>/g)].map(m => m[1]);
  assert.deepEqual(naLateral, ['Área norte', 'Estudo 1', 'estudo 2', 'Estudo 10']);
  const nosQuadros = [...pag.matchAll(/<h3>([^<]+)<\/h3>/g)].map(m => m[1]);
  assert.deepEqual(nosQuadros, naLateral, 'os quadros seguem a mesma ordem');
});

test('olhar a vista não conta como edição', async () => {
  const pasta = await novaPasta(ana, 'Recentes');
  const e = await novoEstudo(ana, pasta, 'Gleba recente');
  const antes = (await T.banco.um('SELECT atualizado_em FROM estudo WHERE id = $1', [e])).atualizado_em;
  await ana.put(`/api/estudos/${e}/vista`, { vista: { aba: 'premissas' } });
  const depois = (await T.banco.um('SELECT atualizado_em FROM estudo WHERE id = $1', [e])).atualizado_em;
  assert.equal(depois.getTime(), antes.getTime());
});

test('o resumo mandado ao abrir não conta como edição', async () => {
  const e = await novoEstudo(ana, await novaPasta(ana, 'Só abrir'), 'Aberto');
  const antes = (await T.banco.um('SELECT atualizado_em FROM estudo WHERE id = $1', [e])).atualizado_em;
  assert.equal((await ana.put(`/api/estudos/${e}/resumo`, { resumo: [['Valor da gleba', 'R$ 9']] })).statusCode, 200);
  const d = await T.banco.um('SELECT resumo, atualizado_em FROM estudo WHERE id = $1', [e]);
  assert.deepEqual(d.resumo, [['Valor da gleba', 'R$ 9']]);
  assert.equal(d.atualizado_em.getTime(), antes.getTime());
  assert.equal((await ana.put(`/api/estudos/${e}/resumo`, { resumo: 'x' })).statusCode, 400);
  assert.equal((await beto.put(`/api/estudos/${e}/resumo`, { resumo: [['a', 'b']] })).statusCode, 404);
});

test('duplicar faz um cenário: mesmas premissas, outro nome, mesma pasta', async () => {
  const pasta = await novaPasta(ana, 'Cenários');
  const e = await novoEstudo(ana, pasta, 'Base');
  await salvar(ana, e, { x: 1 }, [['Valor', 'R$ 1']]);
  const r = await ana.post(`/estudos/${e}/duplicar`, { nome: 'Conservador' });
  assert.equal(r.headers.location, `/modelagens/involutivo/${pasta}?r=duplicado`);
  const copia = await T.banco.um("SELECT premissas, pasta_id FROM estudo WHERE nome = 'Conservador'");
  assert.deepEqual(copia.premissas, { x: 1 });
  assert.equal(copia.pasta_id, pasta);
});

test('renomear, mover entre pastas e apagar estudo', async () => {
  const a = await novaPasta(ana, 'Origem');
  const b = await novaPasta(ana, 'Destino');
  const e = await novoEstudo(ana, a, 'Primeiro');
  await ana.post(`/estudos/${e}/renomear`, { nome: '  Cenário   base ' });
  assert.equal((await T.banco.um('SELECT nome FROM estudo WHERE id = $1', [e])).nome, 'Cenário base');
  assert.match((await ana.post(`/estudos/${e}/renomear`, { nome: '  ' })).headers.location, /r=nome/);

  assert.equal((await ana.post(`/estudos/${e}/mover`, { destino: b })).headers.location, `/modelagens/involutivo/${b}?r=movido`);
  assert.equal((await T.banco.um('SELECT pasta_id FROM estudo WHERE id = $1', [e])).pasta_id, b);

  assert.equal((await ana.post(`/estudos/${e}/apagar`)).headers.location, `/modelagens/involutivo/${b}?r=estudo-apagado`);
  assert.equal(await T.banco.um('SELECT 1 FROM estudo WHERE id = $1', [e]), null);
});

test('apagar pasta leva os estudos junto, só com a confirmação da quantidade certa', async () => {
  const p = await novaPasta(ana, 'Cheia');
  const e = await novoEstudo(ana, p, 'Dentro');
  assert.equal((await ana.post(`/pastas/${p}/apagar`)).headers.location, `/modelagens/involutivo/${p}?r=pasta-mudou`,
    'sem declarar os estudos, nada se apaga');
  assert.equal((await ana.post(`/pastas/${p}/apagar`, { com_estudos: '2' })).headers.location, `/modelagens/involutivo/${p}?r=pasta-mudou`,
    'quantidade diferente da que existe: nada se apaga');
  assert.ok(await T.banco.um('SELECT 1 FROM estudo WHERE id = $1', [e]));

  await ana.post(`/pastas/${p}/renomear`, { nome: 'Renomeada' });
  assert.equal((await T.banco.um('SELECT nome FROM pasta WHERE id = $1', [p])).nome, 'Renomeada');

  assert.equal((await ana.post(`/pastas/${p}/apagar`, { com_estudos: '1' })).headers.location, '/modelagens/involutivo?r=pasta-apagada');
  assert.equal(await T.banco.um('SELECT 1 FROM pasta WHERE id = $1', [p]), null);
  assert.equal(await T.banco.um('SELECT 1 FROM estudo WHERE id = $1', [e]), null, 'o estudo foi junto');

  const vazia = await novaPasta(ana, 'Vazia');
  assert.equal((await ana.post(`/pastas/${vazia}/apagar`, { com_estudos: '0' })).headers.location, '/modelagens/involutivo?r=pasta-apagada');
  assert.equal((await beto.post(`/pastas/${await novaPasta(ana, 'Da Ana')}/apagar`, { com_estudos: '0' })).statusCode, 404);
});

test('o quadro de cada pasta tem o menu ⋯ com renomear e apagar', async () => {
  const p = await novaPasta(ana, 'Com menu');
  await novoEstudo(ana, p, 'Um'); await novoEstudo(ana, p, 'Dois');
  const r = (await ana.get('/modelagens/involutivo')).body;
  assert.match(r, new RegExp(`data-abrir="pa-${p}-renomear"`));
  assert.match(r, new RegExp(`data-abrir="pa-${p}-apagar"`));
  assert.match(r, /Apagar pasta e 2 estudos/);
  assert.match(r, new RegExp(`id="pa-${p}-apagar"[\\s\\S]*?name="com_estudos" value="2"`));
});

test('o nome chega escapado na página', async () => {
  const p = await novaPasta(ana, '<script>alert(1)</script>');
  const r = await ana.get(`/modelagens/involutivo/${p}`);
  assert.doesNotMatch(r.body, /<script>alert/);
  assert.match(r.body, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('o que é de um usuário não existe para o outro', async () => {
  const pasta = await novaPasta(ana, 'Particular');
  const estudo = await novoEstudo(ana, pasta, 'Estudo da Ana');
  assert.equal((await beto.get(`/modelagens/involutivo/${pasta}`)).statusCode, 404);
  assert.equal((await beto.get('/estudos/' + estudo)).statusCode, 404);
  assert.equal((await beto.get('/api/estudos/' + estudo)).statusCode, 404);
  assert.equal((await salvar(beto, estudo, { x: 1 })).statusCode, 404);
  assert.equal((await beto.put(`/api/estudos/${estudo}/vista`, { vista: { aba: 'x' } })).statusCode, 404);
  assert.equal((await beto.post(`/pastas/${pasta}/renomear`, { nome: 'meu' })).statusCode, 404);
  assert.equal((await beto.post(`/pastas/${pasta}/estudos`, { nome: 'intruso' })).statusCode, 404);
  assert.equal((await beto.post(`/estudos/${estudo}/apagar`)).statusCode, 404);
  assert.equal((await beto.post(`/estudos/${estudo}/duplicar`)).statusCode, 404);
  /* nem como destino: Beto não move estudo dele para a pasta da Ana */
  const doBeto = await novoEstudo(beto, await novaPasta(beto, 'Do Beto'), 'Estudo do Beto');
  assert.match((await beto.post(`/estudos/${doBeto}/mover`, { destino: pasta })).headers.location, /r=destino/);
  const r = await ana.get(`/modelagens/involutivo/${pasta}`);
  assert.match(r.body, /Estudo da Ana/);
  assert.doesNotMatch(r.body, /intruso|Estudo do Beto/);
});

test('o banco recusa estudo em pasta alheia ou de outra modelagem', async () => {
  const daAna = await novaPasta(ana, 'Só da Ana');
  const b = await T.banco.um("SELECT id FROM usuario WHERE email = 'beto@exemplo.com'");
  const a = await T.banco.um("SELECT id FROM usuario WHERE email = 'ana@exemplo.com'");
  await assert.rejects(T.banco.consulta(
    "INSERT INTO estudo (usuario_id, pasta_id, modulo, nome) VALUES ($1, $2, 'involutivo', 'x')", [b.id, daAna]),
    { code: '23503' });
  await assert.rejects(T.banco.consulta(
    "INSERT INTO estudo (usuario_id, pasta_id, modulo, nome) VALUES ($1, $2, 'outra', 'x')", [a.id, daAna]),
    { code: '23503' });
});

test('id malformado é 404, não erro', async () => {
  assert.equal((await ana.get('/modelagens/involutivo/nao-e-uuid')).statusCode, 404);
  assert.equal((await ana.get('/estudos/1')).statusCode, 404);
  assert.equal((await ana.get('/api/estudos/1')).statusCode, 404);
  assert.equal((await ana.post('/pastas/1/estudos', { nome: 'x' })).statusCode, 404);
});

test('premissas e vista que não são objeto são recusadas; resumo estranho é ignorado', async () => {
  const e = await novoEstudo(ana, await novaPasta(ana, 'Teimosa'), 'Teimoso');
  for (const premissas of [null, 3, 'x', [1, 2]]) {
    assert.equal((await salvar(ana, e, premissas)).statusCode, 400, JSON.stringify(premissas));
  }
  assert.equal((await ana.put(`/api/estudos/${e}/vista`, { vista: 'x' })).statusCode, 400);
  assert.equal((await salvar(ana, e, { ok: 1 }, 'não é lista')).statusCode, 200);
  assert.equal((await T.banco.um('SELECT resumo FROM estudo WHERE id = $1', [e])).resumo, null);
});

test('o módulo é servido a quem entrou, sem a suíte nem as notas internas', async () => {
  assert.equal((await ana.get('/m/involutivo/index.html')).statusCode, 200);
  assert.equal((await ana.get('/m/involutivo/motor.js')).statusCode, 200);
  assert.equal((await ana.get('/m/involutivo/testes/auditoria.js')).statusCode, 404);
  assert.equal((await ana.get('/m/involutivo/CLAUDE.md')).statusCode, 404);
  assert.equal((await ana.get('/m/package.json')).statusCode, 404);
  assert.equal((await ana.get('/m/../casca/config.js')).statusCode, 404);
});
