@echo off
title AssetFlow - Enterprise Asset Management

echo ========================================
echo        AssetFlow Launcher
echo ========================================
echo.

:: Check if MySQL is running (simple check on port 3306)
netstat -ano | findstr ":3306" >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] MySQL does not appear to be running on port 3306.
    echo         Make sure MySQL is started before continuing.
    echo.
    pause
)

:: Check if .env exists
if not exist "backend\.env" (
    echo [ERROR] backend\.env not found!
    echo         Please create it from the template.
    pause
    exit /b 1
)

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Dependencies not installed. Running npm install...
    call npm install
    echo.
)

echo Starting AssetFlow...
echo   Backend : http://localhost:5000
echo   Frontend: http://localhost:5173
echo.
echo Close this window to stop all servers.
echo ========================================
echo.

:: Open browser after a short delay
start /b "" cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:5173"

:: Run both servers via concurrently
npm run dev

pause
