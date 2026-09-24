/* Estudos: o registro que a casca guarda por modelagem. A casca não lê as
   premissas — guarda o JSON que o módulo devolve e o entrega de volta ao abrir;
   o mesmo vale para o resumo (números do cartão) e a vista (onde parou). */
import { criarPastas, uuidValido } from '../pastas.js';
import { paginaEstudo } from '../paginas/paginas.js';
import { MODULOS, moduloExiste } from '../modulos.js';
import { lerNome, urlPasta } from './comum.js';

const objeto = v => v && typeof v === 'object' && !Array.isArray(v);

export default async function rotasEstudos(app) {
  const { config, banco } = app;
  const P = criarPastas(banco);
  app.addHook('onRequest', app.exigirLogin);

  app.get('/estudos/:id', async (req, reply) => {
    const e = await P.estudo(req.usuario.id, req.params.id);
    if (!e || !moduloExiste(e.modulo)) return reply.callNotFound();
    await banco.consulta('UPDATE estudo SET aberto_em = now() WHERE id = $1', [e.id]);
    return reply.pagina(paginaEstudo(config, req.usuario, { estudo: e, modulo: MODULOS[e.modulo] }));
  });

  app.post('/estudos/:id/renomear', async (req, reply) => {
    const e = await P.estudo(req.usuario.id, req.params.id);
    if (!e) return reply.callNotFound();
    const nome = lerNome(req.body?.nome, 160);
    if (!nome) return reply.redirect(urlPasta(e.modulo, e.pasta_id, 'nome'), 303);
    await banco.consulta('UPDATE estudo SET nome = $1 WHERE id = $2', [nome, e.id]);
    return reply.redirect(urlPasta(e.modulo, e.pasta_id), 303);
  });

  /* Duplicar é como se faz um cenário: mesmas premissas, outro nome, mesma pasta. */
  app.post('/estudos/:id/duplicar', async (req, reply) => {
    const e = await P.estudo(req.usuario.id, req.params.id);
    if (!e) return reply.callNotFound();
    const nome = lerNome(req.body?.nome, 160) || lerNome(`${e.nome} (cópia)`, 160);
    await banco.consulta(
      `INSERT INTO estudo (usuario_id, pasta_id, modulo, nome, premissas, resumo, vista)
       SELECT usuario_id, pasta_id, modulo, $2, premissas, resumo, vista FROM estudo WHERE id = $1`,
      [e.id, nome]);
    return reply.redirect(urlPasta(e.modulo, e.pasta_id, 'duplicado'), 303);
  });

  /* Mover só entre pastas da mesma modelagem — o banco também recusa o resto. */
  app.post('/estudos/:id/mover', async (req, reply) => {
    const uid = req.usuario.id;
    const e = await P.estudo(uid, req.params.id);
    if (!e) return reply.callNotFound();
    const destino = await P.pasta(uid, req.body?.destino);
    if (!destino || destino.modulo !== e.modulo) return reply.redirect(urlPasta(e.modulo, e.pasta_id, 'destino'), 303);
    await banco.consulta('UPDATE estudo SET pasta_id = $1 WHERE id = $2', [destino.id, e.id]);
    return reply.redirect(urlPasta(e.modulo, destino.id, 'movido'), 303);
  });

  app.post('/estudos/:id/apagar', async (req, reply) => {
    const e = await P.estudo(req.usuario.id, req.params.id);
    if (!e) return reply.callNotFound();
    await banco.consulta('DELETE FROM estudo WHERE id = $1', [e.id]);
    return reply.redirect(urlPasta(e.modulo, e.pasta_id, 'estudo-apagado'), 303);
  });

  /* ------------------------------------------------------ a ponte com o módulo */

  /* O que a casca entrega ao módulo: quem é o usuário e qual estudo abrir. */
  app.get('/api/estudos/:id', async (req, reply) => {
    if (!uuidValido(req.params.id)) return reply.callNotFound();
    const e = await banco.um(
      `SELECT id, nome, modulo, premissas, vista, atualizado_em FROM estudo WHERE usuario_id = $1 AND id = $2`,
      [req.usuario.id, req.params.id]);
    if (!e) return reply.callNotFound();
    return {
      usuario: { nome: req.usuario.nome },
      estudo: { id: e.id, nome: e.nome, modulo: e.modulo, premissas: e.premissas, vista: e.vista,
                atualizadoEm: e.atualizado_em },
    };
  });

  /* O que o módulo devolve: o estudo em JSON, inteiro, cada vez que muda —
     e, se ele quiser, o resumo que aparece no cartão. */
  app.put('/api/estudos/:id/premissas', async (req, reply) => {
    const { premissas, resumo } = req.body || {};
    if (!objeto(premissas)) return reply.code(400).send({ erro: 'premissas deve ser um objeto JSON' });
    if (!uuidValido(req.params.id)) return reply.callNotFound();
    const pares = resumoValido(resumo);
    /* array vai como texto JSON: o pg transformaria um array JS em array do Postgres */
    const r = await banco.um(
      `UPDATE estudo SET premissas = $1, resumo = $2::jsonb, atualizado_em = now()
        WHERE usuario_id = $3 AND id = $4 RETURNING atualizado_em`,
      [premissas, pares && JSON.stringify(pares), req.usuario.id, req.params.id]);
    if (!r) return reply.callNotFound();
    return { atualizadoEm: r.atualizado_em };
  });

  /* Os números do cartão, mandados ao abrir: abrir não é editar. */
  app.put('/api/estudos/:id/resumo', async (req, reply) => {
    const pares = resumoValido(req.body?.resumo);
    if (!pares) return reply.code(400).send({ erro: 'resumo inválido' });
    if (!uuidValido(req.params.id)) return reply.callNotFound();
    const r = await banco.um('UPDATE estudo SET resumo = $1::jsonb WHERE usuario_id = $2 AND id = $3 RETURNING id',
      [JSON.stringify(pares), req.usuario.id, req.params.id]);
    if (!r) return reply.callNotFound();
    return { ok: true };
  });

  /* Onde a leitura parou. Não mexe em atualizado_em: rolar não é editar. */
  app.put('/api/estudos/:id/vista', async (req, reply) => {
    const { vista } = req.body || {};
    if (!objeto(vista) || JSON.stringify(vista).length > 4000) return reply.code(400).send({ erro: 'vista inválida' });
    if (!uuidValido(req.params.id)) return reply.callNotFound();
    const r = await banco.um('UPDATE estudo SET vista = $1 WHERE usuario_id = $2 AND id = $3 RETURNING id',
      [vista, req.usuario.id, req.params.id]);
    if (!r) return reply.callNotFound();
    return { ok: true };
  });
}

/* O resumo é texto pronto que a casca só exibe: até 6 pares [rótulo, valor]. */
function resumoValido(r) {
  if (!Array.isArray(r)) return null;
  const pares = r.slice(0, 6).filter(p => Array.isArray(p) && p.length === 2)
    .map(([a, b]) => [String(a).slice(0, 40), String(b).slice(0, 40)]);
  return pares.length ? pares : null;
}
