@echo off
chcp 65001 >nul
title Imovaluation
cd /d "%~dp0"

rem A Imovaluation no seu computador (Windows). Nao instala nada e nao pede
rem administrador: se o Windows nao tiver o Node.js, este atalho baixa a versao
rem portatil oficial (nodejs.org) para %LOCALAPPDATA%\Imovaluation, uma vez so.

set "NODE_VERSAO=22.23.3"
set "NODE_SHA=2b0ff57b049cda1bbcea2240eec20467018713c1efe1f7360c2681859b90ed71"
set "NODE_DIR=%LOCALAPPDATA%\Imovaluation\node-v%NODE_VERSAO%-win-x64"

if exist "%NODE_DIR%\node.exe" goto node_portatil
where node >nul 2>nul
if errorlevel 1 goto baixar_node
node -e "process.exit(+process.versions.node.split('.')[0] >= 22 ? 0 : 1)"
if errorlevel 1 goto baixar_node
set "NODE=node"
set "NPM=npm"
goto instalar

:baixar_node
echo Baixando o Node.js portatil (uma vez so, cerca de 35 MB, sem instalar nada)...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'; [Net.ServicePointManager]::SecurityProtocol=[Net.SecurityProtocolType]::Tls12; $d=Join-Path $env:LOCALAPPDATA 'Imovaluation'; New-Item -ItemType Directory -Force $d | Out-Null; $z=Join-Path $d 'node.zip'; Invoke-WebRequest -UseBasicParsing 'https://nodejs.org/dist/v%NODE_VERSAO%/node-v%NODE_VERSAO%-win-x64.zip' -OutFile $z; if ((Get-FileHash $z -Algorithm SHA256).Hash -ne '%NODE_SHA%') { Remove-Item $z; throw 'o arquivo baixado nao confere com o oficial' }; Unblock-File $z; Expand-Archive $z -DestinationPath $d -Force; Remove-Item $z"
if errorlevel 1 goto falhou_node
if not exist "%NODE_DIR%\node.exe" goto falhou_node

:node_portatil
set "PATH=%NODE_DIR%;%PATH%"
set "NODE=%NODE_DIR%\node.exe"
set "NPM=%NODE_DIR%\npm.cmd"

:instalar
rem Instala os componentes na primeira vez, e de novo so quando o codigo mudar.
fc /b package-lock.json node_modules\.instalado >nul 2>nul
if not errorlevel 1 goto rodar
echo Instalando os componentes (so na primeira vez e a cada atualizacao; leva 1 a 3 minutos)...
call "%NPM%" ci --omit=dev --no-audit --no-fund --no-update-notifier --loglevel=error
if errorlevel 1 goto falhou
copy /y package-lock.json node_modules\.instalado >nul

:rodar
"%NODE%" casca\local.js
echo.
pause
exit /b 0

:falhou_node
echo.
echo Nao foi possivel baixar o Node.js. Confira a internet e tente de novo.
echo Se a rede da empresa bloquear, baixe manualmente o arquivo abaixo, descompacte
echo dentro de %LOCALAPPDATA%\Imovaluation e rode este atalho de novo:
echo   https://nodejs.org/dist/v%NODE_VERSAO%/node-v%NODE_VERSAO%-win-x64.zip
pause
exit /b 1

:falhou
echo.
echo A instalacao dos componentes falhou. Confira a internet e tente de novo.
pause
exit /b 1
