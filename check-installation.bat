@echo off
echo ================================================
echo Checking Esnaad Installation
echo ================================================
echo.

echo 1. Current directory:
cd
echo.

echo 2. Which esnaad command is being used:
where esnaad
echo.

echo 3. Checking if it's the right one...
node -e "console.log('Expected path:', process.cwd() + '\\dist\\cli.js')"
echo.

echo ================================================
echo If the paths don't match, you need to relink!
echo ================================================
echo.

echo To fix:
echo   1. npm unlink -g esnaad
echo   2. npm link
echo.
pause
