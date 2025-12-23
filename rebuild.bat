@echo off
echo ================================================
echo Rebuilding and Relinking Esnaad Code (Windows)
echo ================================================
echo.

REM Clean old build
echo 1. Cleaning old build...
if exist dist rmdir /s /q dist
echo    Done
echo.

REM Reinstall dependencies
echo 2. Installing dependencies...
call npm install
echo    Done
echo.

REM Build
echo 3. Building TypeScript...
call npm run build
echo    Done
echo.

REM Unlink old version (ignore errors)
echo 4. Unlinking old global version...
call npm unlink -g esnaad 2>nul
echo    Done
echo.

REM Link new version
echo 5. Linking new version globally...
call npm link
echo    Done
echo.

REM Verify
echo 6. Verifying installation...
where esnaad
echo.

echo ================================================
echo Installation Complete!
echo ================================================
echo.
echo To test the loop:
echo   esnaad
echo.
echo Then try multiple messages:
echo   esnaad^> hi
echo   esnaad^> how are you
echo   esnaad^> /exit
echo.
pause
