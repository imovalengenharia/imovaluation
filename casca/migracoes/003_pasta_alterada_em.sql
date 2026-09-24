-- A pasta mostra quando foi criada e quando foi alterada pela última vez.
-- alterada_em marca o que acontece com a própria pasta (renomear, estudo que
-- entra por mudança de pasta, estudo apagado); a edição de um estudo já está
-- em estudo.atualizado_em, e a data mostrada é a mais recente das duas.
ALTER TABLE pasta ADD COLUMN alterada_em timestamptz NOT NULL DEFAULT now();
UPDATE pasta p SET alterada_em = greatest(p.criada_em,
  coalesce((SELECT max(e.atualizado_em) FROM estudo e WHERE e.pasta_id = p.id), p.criada_em));
