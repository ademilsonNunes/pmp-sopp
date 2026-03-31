@echo off
echo ==========================================
echo  PMP Sistema - Sobel Suprema
echo  Iniciando Backend (FastAPI)
echo ==========================================

cd /d "%~dp0backend"

if not exist "venv\Scripts\python.exe" (
    echo Criando ambiente virtual...
    python -m venv venv
)

call venv\Scripts\activate

echo Instalando dependencias...
pip install -r requirements.txt -q

if not exist ".env" (
    echo Copiando .env.example para .env...
    copy .env.example .env
)

echo.
echo Iniciando servidor em http://localhost:8000
echo Documentacao da API: http://localhost:8000/docs
echo.
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pause
