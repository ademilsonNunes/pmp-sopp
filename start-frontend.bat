@echo off
echo ==========================================
echo  PMP Sistema - Sobel Suprema
echo  Iniciando Frontend (React + Vite)
echo ==========================================

cd /d "%~dp0frontend"

if not exist "node_modules" (
    echo Instalando dependencias npm...
    npm install
)

echo.
echo Iniciando em http://localhost:5173
echo.
npm run dev
pause
