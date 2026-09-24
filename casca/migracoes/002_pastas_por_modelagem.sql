-- A navegação vira: modelagem → pastas de trabalho → estudos.
-- A pasta passa a ser de uma modelagem, e o estudo mora sempre numa pasta
-- da mesma modelagem — o banco garante as duas coisas.

ALTER TABLE pasta ADD COLUMN modulo text;
UPDATE pasta SET modulo = coalesce(
  (SELECT e.modulo FROM estudo e WHERE e.pasta_id = pasta.id LIMIT 1), 'involutivo');
ALTER TABLE pasta ALTER COLUMN modulo SET NOT NULL;

-- Pastas agora são de um nível só: as que estavam dentro de outras sobem.
UPDATE pasta SET pai_id = NULL WHERE pai_id IS NOT NULL;

-- Estudo solto na raiz ganha uma pasta "Meus estudos" da sua modelagem.
INSERT INTO pasta (usuario_id, modulo, nome)
SELECT DISTINCT usuario_id, modulo, 'Meus estudos' FROM estudo WHERE pasta_id IS NULL;
UPDATE estudo e SET pasta_id = (
  SELECT p.id FROM pasta p
   WHERE p.usuario_id = e.usuario_id AND p.modulo = e.modulo AND p.nome = 'Meus estudos'
   ORDER BY p.criada_em DESC LIMIT 1)
 WHERE e.pasta_id IS NULL;
-- Estudo numa pasta de outra modelagem (não deveria haver) vai para a pasta certa.
INSERT INTO pasta (usuario_id, modulo, nome)
SELECT DISTINCT e.usuario_id, e.modulo, 'Meus estudos'
  FROM estudo e JOIN pasta p ON p.id = e.pasta_id WHERE p.modulo <> e.modulo;
UPDATE estudo e SET pasta_id = (
  SELECT p.id FROM pasta p
   WHERE p.usuario_id = e.usuario_id AND p.modulo = e.modulo AND p.nome = 'Meus estudos'
   ORDER BY p.criada_em DESC LIMIT 1)
 WHERE EXISTS (SELECT 1 FROM pasta p WHERE p.id = e.pasta_id AND p.modulo <> e.modulo);

ALTER TABLE estudo ALTER COLUMN pasta_id SET NOT NULL;
ALTER TABLE pasta ADD CONSTRAINT pasta_usuario_id_modulo_key UNIQUE (usuario_id, id, modulo);
ALTER TABLE estudo DROP CONSTRAINT estudo_usuario_id_pasta_id_fkey;
ALTER TABLE estudo ADD CONSTRAINT estudo_pasta_da_mesma_modelagem
  FOREIGN KEY (usuario_id, pasta_id, modulo) REFERENCES pasta (usuario_id, id, modulo);

CREATE INDEX pasta_modulo ON pasta (usuario_id, modulo);

-- O que o módulo manda além das premissas, guardado sem ser lido:
--   resumo  — os números que ele escolhe mostrar no cartão do estudo
--   vista   — onde a leitura parou (aba, rolagem), para reabrir ali
ALTER TABLE estudo ADD COLUMN resumo jsonb;
ALTER TABLE estudo ADD COLUMN vista jsonb;
ALTER TABLE estudo ADD COLUMN aberto_em timestamptz;
CREATE INDEX estudo_recentes ON estudo (usuario_id, modulo, aberto_em DESC NULLS LAST);
