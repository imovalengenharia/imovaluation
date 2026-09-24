/* Consultas de pastas e estudos. Toda consulta leva o usuario_id: o que não é
   do usuário simplesmente não existe para ele (404, nunca 403). */

/* Ordem alfabética e numérica, como uma pessoa lê: "Estudo 2" antes de
   "Estudo 10", sem diferença entre maiúscula, minúscula e acento. */
const ordem = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
const emOrdem = linhas => linhas.sort((a, b) => ordem.compare(a.nome, b.nome));

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidValido = v => typeof v === 'string' && UUID.test(v);

export function criarPastas(banco) {
  return {
    pasta: (uid, id) => uuidValido(id)
      ? banco.um(
        `SELECT p.id, p.modulo, p.nome, p.criada_em,
                greatest(p.alterada_em, (SELECT max(e.atualizado_em) FROM estudo e WHERE e.pasta_id = p.id)) AS alterada_em
           FROM pasta p WHERE p.usuario_id = $1 AND p.id = $2`, [uid, id])
      : null,

    estudo: (uid, id) => uuidValido(id)
      ? banco.um(
        `SELECT e.id, e.nome, e.modulo, e.pasta_id, p.nome AS pasta_nome
           FROM estudo e JOIN pasta p ON p.id = e.pasta_id
          WHERE e.usuario_id = $1 AND e.id = $2`, [uid, id])
      : null,

    /* As pastas de uma modelagem, com quantos estudos cada uma tem. */
    pastas: (uid, modulo) => banco.todos(
      `SELECT p.id, p.nome, p.criada_em,
              (SELECT count(*) FROM estudo e WHERE e.pasta_id = p.id)::int AS estudos,
              greatest(p.alterada_em, (SELECT max(e.atualizado_em) FROM estudo e WHERE e.pasta_id = p.id)) AS alterada_em
         FROM pasta p WHERE p.usuario_id = $1 AND p.modulo = $2
        `, [uid, modulo]).then(emOrdem),

    estudos: (uid, pastaId) => banco.todos(
      `SELECT id, nome, resumo, vista, criado_em, atualizado_em, aberto_em FROM estudo
        WHERE usuario_id = $1 AND pasta_id = $2
        `, [uid, pastaId]).then(emOrdem),
  };
}
