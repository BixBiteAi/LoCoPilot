@echo off
REM Create Windows EXE installers (user + system setup). Run on Windows only.
REM Requires: LoCoPilot-win32-x64 (or arm64) folder in the parent of this repo.
REM Requires: Inno Setup installed (ISCC.exe on PATH).
REM Run from LoCoPilot directory: scripts\build-and-ship-win.bat

cd /d "%~dp0\.."

echo Building LoCoPilot Windows installers...
echo.

echo [1/2] User installer (x64)...
call npm run gulp vscode-win32-x64-user-setup
if errorlevel 1 goto err

echo.
echo [2/2] System installer (x64)...
call npm run gulp vscode-win32-x64-system-setup
if errorlevel 1 goto err

echo.
echo Done. Installer .exe files are in:
echo   .build\win32-x64\user-setup\
echo   .build\win32-x64\system-setup\
echo.
echo For ARM64 (if you have LoCoPilot-win32-arm64), run:
echo   npm run gulp vscode-win32-arm64-user-setup
echo   npm run gulp vscode-win32-arm64-system-setup
goto end

:err
echo Build failed.
exit /b 1

:end
