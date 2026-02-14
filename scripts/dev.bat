@echo off
setlocal

title LoCoPilot Dev Environment

pushd %~dp0\..

echo Starting development environment...
echo This will:
echo   1. Start watch tasks (auto-compile on file changes)
echo   2. Launch the app
echo.
echo Press Ctrl+C to stop everything
echo.

:: Start watch tasks in background
echo Starting watch tasks...
start /B npm run watch-clientd
start /B npm run watch-extensionsd

:: Wait a bit for initial compilation
echo Waiting for initial compilation...
timeout /t 5 /nobreak >nul

echo.
echo Watch tasks are running. Starting app...
echo.

:: Run the app
call scripts\code.bat %*

:: Cleanup when app exits
echo.
echo Stopping watch processes...
call npm run kill-watch-clientd >nul 2>&1
call npm run kill-watch-extensionsd >nul 2>&1

popd
endlocal
