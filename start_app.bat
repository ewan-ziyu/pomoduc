@echo off
echo Starting Pomoduc...
cd /d "%~dp0"
npm run electron:dev
pause
