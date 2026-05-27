@echo off
echo ========================================
echo ZAQONE.FORM - Deploy Script
echo ========================================
echo.

cd /d "%~dp0"

echo [1/5] Initializing git repository...
git init >nul 2>&1

echo [2/5] Adding all files...
git add -A

echo [3/5] Creating initial commit...
git commit -m "Initial commit: ZAQONE.FORM complete build" >nul 2>&1

echo [4/5] Setting up remote...
git branch -M main >nul 2>&1
git remote remove origin >nul 2>&1
git remote add origin https://github.com/zaqone12/FORM.CURSOR.git

echo [5/5] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done! Pushed to https://github.com/zaqone12/FORM.CURSOR
echo ========================================
echo.
pause
