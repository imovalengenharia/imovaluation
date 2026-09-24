/* A tela inicial (as modelagens) e a área de trabalho de cada modelagem. */
import { criarPastas } from '../pastas.js';
import { MODULOS, moduloExiste } from '../modulos.js';
import { paginaModelagens, paginaAreaDeTrabalho } from '../paginas/paginas.js';
import { lerNome, lerRecado, urlPasta } from './comum.js';

export default async function rotasModelagens(app) {
  const { config, banco } = app;
  const P = criarPastas(banco);
  app.addHook('onRequest', app.exigirLogin);

  app.get('/modelagens', async (req, reply) => {
    const uid = req.usuario.id;
    const [contagens, recentes] = await Promise.all([P.contagens(uid), P.recentes(uid, 5)]);
    return reply.pagina(paginaModelagens(config, req.usuario, { contagens, recentes }));
  });

  async function area(req, reply, modulo, pastaId) {
    if (!moduloExiste(modulo)) return reply.callNotFound();
    const uid = req.usuario.id;
    const pastas = await P.pastas(uid, modulo);
    let pasta = null;
    if (pastaId) {
      pasta = pastas.find(p => p.id === pastaId);
      if (!pasta) return reply.callNotFound();
    } else if (pastas.length) {
      /* sem pasta escolhida, abre a que foi mexida por último */
      pasta = [...pastas].sort((a, b) => (b.mexida_em || b.criada_em) - (a.mexida_em || a.criada_em))[0];
      return reply.redirect(urlPasta(modulo, pasta.id));
    }
    const estudos = pasta ? await P.estudos(uid, pasta.id) : [];
    return reply.pagina(paginaAreaDeTrabalho(config, req.usuario, {
      modulo: MODULOS[modulo], pastas, pasta, estudos, ...lerRecado(req),
    }));
  }

  app.get('/modelagens/:modulo', (req, reply) => area(req, reply, req.params.modulo, null));
  app.get('/modelagens/:modulo/:pasta', (req, reply) => area(req, reply, req.params.modulo, req.params.pasta));

  app.post('/modelagens/:modulo/pastas', async (req, reply) => {
    const { modulo } = req.params;
    if (!moduloExiste(modulo)) return reply.callNotFound();
    const nome = lerNome(req.body?.nome, 120);
    if (!nome) return reply.redirect(`/modelagens/${modulo}?r=nome`, 303);
    const nova = await banco.um(
      'INSERT INTO pasta (usuario_id, modulo, nome) VALUES ($1, $2, $3) RETURNING id',
      [req.usuario.id, modulo, nome]);
    return reply.redirect(urlPasta(modulo, nova.id), 303);
  });
}
