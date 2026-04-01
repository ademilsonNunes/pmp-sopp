@echo off
cd /d "%~dp0"

start "Backend PMP" cmd /k "start-backend.bat"
start "Frontend PMP" cmd /k "start-frontend.bat"