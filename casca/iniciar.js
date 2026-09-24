import { fileURLToPath } from 'node:url';
import { lerConfig } from './config.js';
import { criarBanco } from './banco.js';
import { migrar } from './migrar.js';
import { criarServidor } from './servidor.js';

/* Migra o banco e sobe a casca. Devolve como descer, para quem chama
   (este arquivo, ou o local.js) decidir quando. */
export async function subir(config = lerConfig()) {
  const banco = criarBanco(config.urlBanco);
  await migrar(banco);
  const app = await criarServidor({ config, banco });
  await app.listen({ port: config.porta, host: config.host || '0.0.0.0' });
  return { app, config, async descer() { await app.close(); await banco.fechar(); } };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { descer } = await subir();
  for (const sinal of ['SIGINT', 'SIGTERM']) {
    process.once(sinal, async () => { await descer(); process.exit(0); });
  }
}
