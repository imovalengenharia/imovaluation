@echo off
rem Imovaluation no seu computador (Windows). Precisa do Docker Desktop aberto.
cd /d "%~dp0"
echo Subindo a Imovaluation... na primeira vez demora alguns minutos.
docker compose up --build -d
if errorlevel 1 (
  echo.
  echo Nao deu certo. O Docker Desktop esta aberto?
  pause
  exit /b 1
)
echo Pronto: abrindo http://localhost:3000
timeout /t 3 >nul
start http://localhost:3000
