@echo off
title LaunchMint AI - Intelligent Startup Command Center
color 0B
setlocal

echo.
echo ======================================================================
echo    LAUNCHMINT AI: INITIALIZING STRATEGIC TERMINAL SYSTEMS...
echo ======================================================================
echo.

:: 1. START BACKEND ENGINE
echo [+] Deploying High-Availability Backend (Port 8000)...
start "LaunchMint Backend" /min cmd /c "cd /d %~dp0backend && .\venv\Scripts\activate && python -m app.main"

:: 2. START FRONTEND TERMINAL
echo [+] Initializing Strategic Interface (Port 3000)...
start "LaunchMint Frontend" /min cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo [!] Waiting for Virtual Grid to stabilize...
echo [!] This will auto-launch the Tactical UI once Ready.
echo.

:: 3. WAIT FOR FRONTEND (Check Port 3000)
:WAIT_LOOP
netstat -ano | find "LISTENING" | find ":3000" > nul
if errorlevel 1 (
    set /p="." <nul
    timeout /t 1 /nobreak > nul
    goto WAIT_LOOP
)

echo.
echo.
echo [✓] SYSTEMS ONLINE. Strategic Dominance Engaged.
echo [✓] Launching Tactical Control Panel...
echo.

:: 3. LAUNCH BROWSER
start "" "http://localhost:3000"

echo [!] Script completed. You can minimize this window.
timeout /t 5
exit
