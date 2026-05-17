@echo off
title LaunchMint AI - Starting...
color 0A
setlocal enabledelayedexpansion

set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend
set APP_URL=http://localhost:3000

echo.
echo  ================================================================
echo    LAUNCHMINT AI  ^|  STARTING UP
echo  ================================================================
echo.

:: Check .env files
if not exist "%BACKEND_DIR%\.env" (
    echo  [!] WARNING: backend\.env missing - API keys may not be set.
)
if not exist "%FRONTEND_DIR%\.env" (
    echo  [!] WARNING: frontend\.env missing - VITE_API_BASE_URL may be missing.
)

:: Kill any leftover processes on ports 8000 and 5173
echo  [1/3] Clearing ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find "LISTENING" ^| find ":8000"') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find "LISTENING" ^| find ":3000"') do taskkill /PID %%a /F >nul 2>&1
timeout /t 1 /nobreak >nul

:: Start backend
echo  [2/3] Starting Backend (Port 8000)...
start "LaunchMint-Backend" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && python -m app.main"

:: Wait 3s for backend to boot before starting frontend
timeout /t 3 /nobreak >nul

:: Start frontend
echo  [3/3] Starting Frontend (Port 5173)...
start "LaunchMint-Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

:: Wait for frontend port to be ready
echo.
echo  Waiting for app to be ready
:WAIT_LOOP
netstat -ano 2>nul | find "LISTENING" | find ":3000" >nul
if errorlevel 1 (
    set /p=. <nul
    timeout /t 1 /nobreak >nul
    goto WAIT_LOOP
)

echo.
echo.
echo  ================================================================
echo    LAUNCHMINT AI IS LIVE  ^|  %APP_URL%
echo  ================================================================
echo.

:: Open browser
start "" "%APP_URL%"

echo  Both windows are running in separate terminals.
echo  Close those terminals to stop the app.
echo.
pause
