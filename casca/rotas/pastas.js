/* Pastas de trabalho: de uma modelagem só, com vários estudos dentro. */
import { criarPastas } from '../pastas.js';
import { lerNome, urlPasta } from './comum.js';

export default async function rotasPastas(app) {
  const { banco } = app;
  const P = criarPastas(banco);
  app.addHook('onRequest', app.exigirLogin);

  app.post('/pastas/:id/renomear', async (req, reply) => {
    const pasta = await P.pasta(req.usuario.id, req.params.id);
    if (!pasta) return reply.callNotFound();
    const nome = lerNome(req.body?.nome, 120);
    if (!nome) return reply.redirect(urlPasta(pasta.modulo, pasta.id, 'nome'), 303);
    await banco.consulta('UPDATE pasta SET nome = $1, alterada_em = now() WHERE id = $2', [nome, pasta.id]);
    return reply.redirect(urlPasta(pasta.modulo, pasta.id), 303);
  });

  /* Pasta com estudos não se apaga: nenhum estudo some por tabela. */
  app.post('/pastas/:id/apagar', async (req, reply) => {
    const pasta = await P.pasta(req.usuario.id, req.params.id);
    if (!pasta) return reply.callNotFound();
    const r = await banco.consulta(
      `DELETE FROM pasta p WHERE p.id = $1
          AND NOT EXISTS (SELECT 1 FROM estudo e WHERE e.pasta_id = p.id)`, [pasta.id]);
    return reply.redirect(r.rowCount
      ? urlPasta(pasta.modulo, null, 'pasta-apagada')
      : urlPasta(pasta.modulo, pasta.id, 'pasta-nao-vazia'), 303);
  });

  /* Estudo novo nasce na pasta e já abre. */
  app.post('/pastas/:id/estudos', async (req, reply) => {
    const pasta = await P.pasta(req.usuario.id, req.params.id);
    if (!pasta) return reply.callNotFound();
    const nome = lerNome(req.body?.nome, 160);
    if (!nome) return reply.redirect(urlPasta(pasta.modulo, pasta.id, 'nome'), 303);
    const novo = await banco.um(
      `INSERT INTO estudo (usuario_id, pasta_id, modulo, nome) VALUES ($1, $2, $3, $4) RETURNING id`,
      [req.usuario.id, pasta.id, pasta.modulo, nome]);
    return reply.redirect(`/estudos/${novo.id}`, 303);
  });
}
