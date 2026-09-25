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

  /* Apagar pasta leva os estudos junto — mas só os que a pessoa viu na
     confirmação: o formulário declara quantos, e se a pasta ganhou ou perdeu
     estudo nesse meio-tempo, nada se apaga. */
  app.post('/pastas/:id/apagar', async (req, reply) => {
    const pasta = await P.pasta(req.usuario.id, req.params.id);
    if (!pasta) return reply.callNotFound();
    const declarados = Number(req.body?.com_estudos || 0);
    const feito = await banco.transacao(async c => {
      const { n } = (await c.query('SELECT count(*)::int AS n FROM estudo WHERE pasta_id = $1', [pasta.id])).rows[0];
      if (n !== declarados) return false;
      await c.query('DELETE FROM estudo WHERE pasta_id = $1', [pasta.id]);
      await c.query('DELETE FROM pasta WHERE id = $1', [pasta.id]);
      return true;
    });
    return reply.redirect(feito
      ? urlPasta(pasta.modulo, null, 'pasta-apagada')
      : urlPasta(pasta.modulo, pasta.id, 'pasta-mudou'), 303);
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
