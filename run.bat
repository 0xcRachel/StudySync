@echo off
chcp 65001 >nul
title StudySync OS 2.4 — Launcher
cd /d "%~dp0"

if exist "C:\Program Files\nodejs\node.exe" (
    set "PATH=C:\Program Files\nodejs;%PATH%"
)

echo ============================================================
echo   STUDYSYNC WORKSPACE LAUNCHER
echo   - Backend API      : http://localhost:8080
echo   - Realtime Socket  : ws://localhost:8090
echo   - Desktop Web App  : http://localhost:19006
echo ============================================================
echo.

echo [1/3] Dang giai phong cac cong 8080, 8090, 19006 neu bi ket...
for %%P in (8080 8090 19006) do (
    for /f "tokens=5" %%A in ('netstat -aon ^| findstr ":%%P " ^| findstr "LISTENING"') do (
        taskkill /F /PID %%A >nul 2>&1
    )
)

echo [2/3] Dang khoi dong Backend PHP + Realtime WebSocket (8080 / 8090)...
start "StudySync API & Realtime" cmd /k "cd /d "%~dp0" && npm run api"

timeout /t 2 /nobreak >nul

echo [3/3] Dang khoi dong Giao dien Web (http://localhost:19006)...
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:19006"
call npm run web
pause
