# PowerShell script to commit and push Ready2Study to GitHub
# Make sure Git is installed: https://git-scm.com/download/win

$repoPath = "C:\xampp\htdocs\Ready2Study"
$token = "YOUR_GITHUB_TOKEN_HERE"
$repoUrl = "https://github.com/innovfix/ready2study.git"
$remoteUrl = "https://${token}@github.com/innovfix/ready2study.git"

Write-Host "Changing to repository directory..." -ForegroundColor Cyan
Set-Location $repoPath

Write-Host "Initializing git repository..." -ForegroundColor Cyan
git init

Write-Host "Adding remote repository..." -ForegroundColor Cyan
git remote remove origin 2>$null
git remote add origin $remoteUrl

Write-Host "Creating .gitignore file..." -ForegroundColor Cyan
@"
# OS Files
.DS_Store
Thumbs.db
desktop.ini

# Editor
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
*.log
npm-debug.log*

# Temporary files
*.tmp
*.temp
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

Write-Host "Adding all files..." -ForegroundColor Cyan
git add .

Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "Initial commit: Ready2Study application with all features

- Student registration and login system
- PDF upload and processing
- Question generation (1, 2, 3, 10 marks)
- Dashboard with question filtering
- Practice test with 20 marks pattern (1x2 + 2x1 + 3x2 + 1x10)
- Answer evaluation and grading system
- Mark important questions feature
- Saved questions by subject
- Image extraction and display
- Voice and text answer input
- Decorative book and pen images
- Modern UI with responsive design"

Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host "`nDone! Code has been pushed to GitHub." -ForegroundColor Green
Write-Host "Repository: https://github.com/innovfix/ready2study" -ForegroundColor Green
Write-Host "`nIMPORTANT: Revoke this token immediately for security!" -ForegroundColor Yellow
Write-Host "Go to: https://github.com/settings/tokens" -ForegroundColor Yellow

