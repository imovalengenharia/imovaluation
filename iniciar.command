#!/bin/bash
# A Imovaluation no seu computador (Mac). Precisa só do Node.js.
cd "$(dirname "$0")"

if ! command -v node >/dev/null 2>&1; then
  echo "O Node.js não está instalado. Abrindo https://nodejs.org — baixe a versão LTS, instale e rode de novo."
  open https://nodejs.org; read -r -p "Enter para fechar"; exit 1
fi
if ! node -e "process.exit(+process.versions.node.split('.')[0] >= 22 ? 0 : 1)"; then
  echo "Seu Node.js é antigo demais. Instale a versão LTS de https://nodejs.org e rode de novo."
  open https://nodejs.org; read -r -p "Enter para fechar"; exit 1
fi

# instala os componentes na primeira vez, e de novo só quando o código mudar
if ! cmp -s package-lock.json node_modules/.instalado; then
  echo "Instalando os componentes (só na primeira vez e a cada atualização; leva 1 a 3 minutos)..."
  if ! npm ci --omit=dev --no-audit --no-fund --no-update-notifier --loglevel=error; then
    echo; echo "A instalação dos componentes falhou. Confira a internet e tente de novo."
    read -r -p "Enter para fechar"; exit 1
  fi
  cp package-lock.json node_modules/.instalado
fi

node casca/local.js
