/* Consultas de pastas e estudos. Toda consulta leva o usuario_id: o que não é
   do usuário simplesmente não existe para ele (404, nunca 403). */

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
        ORDER BY lower(p.nome)`, [uid, modulo]),

    estudos: (uid, pastaId) => banco.todos(
      `SELECT id, nome, resumo, vista, criado_em, atualizado_em, aberto_em FROM estudo
        WHERE usuario_id = $1 AND pasta_id = $2
        ORDER BY atualizado_em DESC`, [uid, pastaId]),
  };
}
