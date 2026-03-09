@echo off
chcp 65001 >nul 2>&1
title FinanceFlow

cd /d "%~dp0"

echo Starting FinanceFlow...

start "FinanceFlow" cmd /k "npm run dev"

echo.
echo Done! Visit http://localhost:3000
timeout /t 3 >nul
