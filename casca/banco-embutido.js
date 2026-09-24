/* O banco para rodar no computador de quem usa. O PGlite é o próprio Postgres
   compilado para WebAssembly, rodando dentro do processo do Node: nenhum
   programa nativo, nenhuma instalação, nenhuma senha de administrador — e o
   mesmo SQL do servidor. Mesma interface de banco.js. */
import { PGlite } from '@electric-sql/pglite';

/* SQL sem parâmetros com mais de um comando (as migrações) vai por exec. */
const varios = (sql, params) => !params?.length && /;\s*\S/.test(sql);

async function rodar(alvo, sql, params) {
  const r = varios(sql, params) ? (await alvo.exec(sql)).at(-1) : await alvo.query(sql, params);
  return { rows: r?.rows || [], rowCount: r?.affectedRows ?? r?.rows?.length ?? 0 };
}

/* pasta = onde os dados moram no disco; sem pasta, só na memória (testes). */
export async function criarBancoEmbutido(pasta) {
  const db = await PGlite.create(pasta);
  return {
    db,
    consulta: (sql, params) => rodar(db, sql, params),
    async um(sql, params) { return (await rodar(db, sql, params)).rows[0] || null; },
    async todos(sql, params) { return (await rodar(db, sql, params)).rows; },
    /* Uma conexão só: o PGlite enfileira o resto enquanto a transação corre.
       Por isso, dentro de fn, use só c.query — nunca o banco de fora. */
    transacao: fn => db.transaction(tx => fn({ query: (sql, params) => rodar(tx, sql, params) })),
    fechar: () => db.close(),
  };
}
