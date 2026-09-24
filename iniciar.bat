@echo off
chcp 65001 >nul
title Imovaluation
cd /d "%~dp0"

rem A Imovaluation no seu computador (Windows). Precisa só do Node.js.

where node >nul 2>nul
if errorlevel 1 goto sem_node
node -e "process.exit(+process.versions.node.split('.')[0] >= 22 ? 0 : 1)"
if errorlevel 1 goto node_velho

rem Instala os componentes na primeira vez, e de novo só quando o código mudar.
fc /b package-lock.json node_modules\.instalado >nul 2>nul
if not errorlevel 1 goto rodar
echo Instalando os componentes (so na primeira vez e a cada atualizacao; leva 1 a 3 minutos)...
call npm ci --omit=dev --no-audit --no-fund --no-update-notifier --loglevel=error
if errorlevel 1 goto falhou
copy /y package-lock.json node_modules\.instalado >nul

:rodar
node casca\local.js
echo.
pause
exit /b 0

:sem_node
echo O Node.js nao esta instalado.
echo Abrindo https://nodejs.org - baixe a versao LTS, instale e rode este arquivo de novo.
start https://nodejs.org
pause
exit /b 1

:node_velho
echo Seu Node.js e antigo demais. Instale a versao LTS de https://nodejs.org e rode de novo.
start https://nodejs.org
pause
exit /b 1

:falhou
echo.
echo A instalacao dos componentes falhou. Confira a internet e tente de novo.
pause
exit /b 1
