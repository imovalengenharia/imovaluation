#!/bin/bash
# Imovaluation no seu computador (Mac). Precisa do Docker Desktop aberto.
cd "$(dirname "$0")"
echo "Subindo a Imovaluation... na primeira vez demora alguns minutos."
if ! docker compose up --build -d; then
  echo; echo "Não deu certo. O Docker Desktop está aberto?"; read -r -p "Enter para fechar"; exit 1
fi
echo "Pronto: abrindo http://localhost:3000"
sleep 3
open http://localhost:3000
