@echo off
set "NODEDIR=C:\Program Files\Microsoft Visual Studio\18\Community\MSBuild\Microsoft\VisualStudio\NodeJs"
set "PATH=%NODEDIR%;%PATH%"
cd /d "C:\Users\Admin\Documents\src\suprema_fontes\PCP\PMP\webapp\frontend"
echo Running npm install in %CD%
npm install
echo Exit code: %ERRORLEVEL%
