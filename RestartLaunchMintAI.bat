@echo off
title LaunchMint AI - Restarting...
color 0E
setlocal enabledelayedexpansion

set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend
set APP_URL=http://localhost:3000

echo.
echo  ================================================================
echo    LAUNCHMINT AI  ^|  RESTARTING
echo  ================================================================
echo.

:: Step 1: Kill existing backend and frontend processes
echo  [1/4] Killing existing processes...

:: Kill by window title
taskkill /FI "WINDOWTITLE eq LaunchMint-Backend*" /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq LaunchMint-Frontend*" /F >nul 2>&1

:: Also kill by port to be safe
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find "LISTENING" ^| find ":8000"') do (
    taskkill /PID %%a /F >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano 2^>nul ^| find "LISTENING" ^| find ":3000"') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  [+] Processes stopped.
timeout /t 2 /nobreak >nul

:: Step 2: Start backend
echo  [2/4] Starting Backend (Port 8000)...
start "LaunchMint-Backend" cmd /k "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && python -m app.main"

:: Wait for backend to boot
timeout /t 3 /nobreak >nul

:: Step 3: Start frontend
echo  [3/4] Starting Frontend (Port 5173)...
start "LaunchMint-Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

:: Step 4: Wait for frontend to be ready
echo  [4/4] Waiting for app to be ready
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
echo    LAUNCHMINT AI RESTARTED  ^|  %APP_URL%
echo  ================================================================
echo.

:: Open browser
start "" "%APP_URL%"

echo  Restart complete. Close the terminal windows to stop the app.
echo.
pause
