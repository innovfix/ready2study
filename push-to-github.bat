@echo off
echo ========================================
echo Ready2Study - Push to GitHub
echo ========================================
echo.

cd /d "C:\xampp\htdocs\Ready2Study"

echo Checking if Git is installed...
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    echo.
    pause
    exit /b 1
)

echo Git is installed. Proceeding...
echo.

echo Initializing git repository...
git init

echo Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://YOUR_TOKEN@github.com/innovfix/ready2study.git

echo Creating .gitignore file...
(
echo # OS Files
echo .DS_Store
echo Thumbs.db
echo desktop.ini
echo.
echo # Editor
echo .vscode/
echo .idea/
echo *.swp
echo *.swo
echo *~
echo.
echo # Logs
echo *.log
echo npm-debug.log*
echo.
echo # Temporary files
echo *.tmp
echo *.temp
) > .gitignore

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Initial commit: Ready2Study application with all features - Student registration and login system - PDF upload and processing - Question generation (1, 2, 3, 10 marks) - Dashboard with question filtering - Practice test with 20 marks pattern - Answer evaluation and grading system - Mark important questions feature - Saved questions by subject - Image extraction and display - Voice and text answer input - Decorative book and pen images - Modern UI with responsive design"

echo Pushing to GitHub...
git branch -M main
git push -u origin main

echo.
echo ========================================
echo Done! Code has been pushed to GitHub.
echo Repository: https://github.com/innovfix/ready2study
echo ========================================
echo.
echo IMPORTANT: Revoke this token immediately for security!
echo Go to: https://github.com/settings/tokens
echo.
pause

