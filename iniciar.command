#!/bin/bash
# A Imovaluation no seu computador (Mac). Não instala nada e não pede senha de
# administrador: sem o Node.js no Mac, baixa a versão portátil oficial
# (nodejs.org) para ~/Library/Application Support/Imovaluation, uma vez só.
cd "$(dirname "$0")"

NODE_VERSAO=22.23.3
case "$(uname -m)" in
  arm64) ARQ=darwin-arm64; SHA=23b25245dcfb9af7262f8ff142e9e2e0af025368117329e7a7458a51e5922f53 ;;
  *)     ARQ=darwin-x64;   SHA=8a677b0219178efd6eb0e475457c4afb452b521a92f6e67845a73bd85727f2a8 ;;
esac
BASE="$HOME/Library/Application Support/Imovaluation"
NODE_DIR="$BASE/node-v$NODE_VERSAO-$ARQ"

pare() { echo; echo "$1"; read -r -p "Enter para fechar"; exit 1; }

if [ -x "$NODE_DIR/bin/node" ]; then
  export PATH="$NODE_DIR/bin:$PATH"
elif ! command -v node >/dev/null 2>&1 || ! node -e "process.exit(+process.versions.node.split('.')[0] >= 22 ? 0 : 1)"; then
  echo "Baixando o Node.js portátil (uma vez só, cerca de 45 MB, sem instalar nada)..."
  mkdir -p "$BASE" && ARQUIVO="$BASE/node.tar.gz"
  curl -fsSL "https://nodejs.org/dist/v$NODE_VERSAO/node-v$NODE_VERSAO-$ARQ.tar.gz" -o "$ARQUIVO" \
    || pare "Não foi possível baixar o Node.js. Confira a internet e tente de novo."
  [ "$(shasum -a 256 "$ARQUIVO" | cut -d' ' -f1)" = "$SHA" ] \
    || { rm -f "$ARQUIVO"; pare "O arquivo baixado não confere com o oficial. Tente de novo."; }
  tar -xzf "$ARQUIVO" -C "$BASE" && rm -f "$ARQUIVO"
  export PATH="$NODE_DIR/bin:$PATH"
fi

# instala os componentes na primeira vez, e de novo só quando o código mudar
if ! cmp -s package-lock.json node_modules/.instalado; then
  echo "Instalando os componentes (só na primeira vez e a cada atualização; leva 1 a 3 minutos)..."
  npm ci --omit=dev --no-audit --no-fund --no-update-notifier --loglevel=error \
    || pare "A instalação dos componentes falhou. Confira a internet e tente de novo."
  cp package-lock.json node_modules/.instalado
fi

node casca/local.js
