Write-Host "Installing dependencies and building HQ Dashboard (Vite)..." -ForegroundColor Green
Push-Location "auris-hq"
npm install
npm run build
Pop-Location

Write-Host "Running deploy_hq.ps1..." -ForegroundColor Green
& ".\deploy_hq.ps1"
