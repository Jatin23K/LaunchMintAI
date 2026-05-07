@echo off
title LaunchMint AI - Tactical Deployment Console
color 0B
setlocal enabledelayedexpansion

:: --- CONSTANTS ---
set BACKEND_DIR=%~dp0backend
set FRONTEND_DIR=%~dp0frontend
set BROWSER_URL=http://127.0.0.1:3000

echo.
echo ======================================================================
echo    LAUNCHMINT AI: INITIALIZING HIGH-OCTANE INTELLIGENCE SYSTEMS...
echo ======================================================================
echo.

:: 1. PREREQUISITE CHECK
echo [+] Checking environment integrity...

if not exist "%BACKEND_DIR%\.env" (
    echo [!] WARNING: Backend .env file missing. API keys may be unconfigured.
)
if not exist "%FRONTEND_DIR%\.env" (
    echo [!] WARNING: Frontend .env file missing. VITE_API_BASE_URL may be missing.
)

:: 2. DEPLOY BACKEND
echo [+] Deploying Backend Reflex Engine (Port 8000)...
start "LaunchMint Backend" cmd /c "cd /d %BACKEND_DIR% && .\venv\Scripts\activate && python -m app.main"

:: 3. DEPLOY FRONTEND
echo [+] Initializing Stealth Terminal Interface (Port 3000)...
start "LaunchMint Frontend" cmd /c "cd /d %FRONTEND_DIR% && npm run dev"

echo.
echo [!] Waiting for Tactical Grid to stabilize...
echo.

:: 4. WAIT FOR FRONTEND PORT
set "DOTS=."
:WAIT_LOOP
netstat -ano | find "LISTENING" | find ":3000" > nul
if errorlevel 1 (
    set /p="!DOTS!" <nul
    timeout /t 1 /nobreak > nul
    goto WAIT_LOOP
)

echo.
echo.
echo [!] SYSTEMS ONLINE. Strategic Dominance Engaged.
echo [!] Launching Mission Control at %BROWSER_URL%...
echo.

:: 5. LAUNCH BROWSER
start "" "%BROWSER_URL%"

echo [!] Deployment Complete. Keep this console open to monitor heartbeats.
echo.
pause
