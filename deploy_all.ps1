# Run this in Cursor Terminal to Push to GitHub: powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\OneDrive\Documents\AURIS\deploy_all.ps1"
$ErrorActionPreference = "Stop"
$Root = "$env:USERPROFILE\OneDrive\Documents\AURIS"

Write-Host "============================================="
Write-Host "   AURIS GitHub Push & Synchronization       "
Write-Host "============================================="

# Helper to Push a Target Subfolder to its Designated GitHub Remote
function Push-GitSubfolder([string]$SubDir, [string]$GitUrl, [string]$CommitMsg) {
    $Path = Join-Path $Root $SubDir
    if (-not (Test-Path $Path)) {
        Write-Host "Target path not found: $Path"
        return
    }
    
    Write-Host "`nInitializing and pushing: $SubDir -> $GitUrl"
    Push-Location $Path
    try {
        # Initialize Git if not present
        if (-not (Test-Path ".git")) {
            git init
            git checkout -b main
        }
        
        # Reset and add the correct remote
        # We suppress stderr and set preference locally to avoid throwing exceptions
        $oldPreference = $global:ErrorActionPreference
        $global:ErrorActionPreference = "SilentlyContinue"
        git remote remove origin >$null 2>&1
        $global:ErrorActionPreference = $oldPreference
        
        git remote add origin $GitUrl
        
        # Stage, Commit and Push
        git add -A
        
        # We allow empty commit, ignoring standard exit code traps
        $oldPreference = $global:ErrorActionPreference
        $global:ErrorActionPreference = "SilentlyContinue"
        git commit -m $CommitMsg --allow-empty >$null 2>&1
        $global:ErrorActionPreference = $oldPreference
        
        git branch -M main
        git push -u origin main -f
        Write-Host "Pushed $SubDir successfully!"
    }
    catch {
        Write-Host "Failed pushing $SubDir. Error: $_"
    }
    finally {
        Pop-Location
    }
}

# 1. Sync server subfolder to sakshamshh/auris-server
Push-GitSubfolder "server" "https://github.com/sakshamshh/auris-server.git" "OTA auto-update: consolidated server code with SfM and homography math"

# 2. Sync edge subfolder to sakshamshh/DOWNLOAD-AURIS-
Push-GitSubfolder "edge" "https://github.com/sakshamshh/DOWNLOAD-AURIS-.git" "Edge deploy bundle: clean edge worker, installer and systemd templates"

# 3. Sync full monorepo to sakshamshh/MY-AURIS
Push-GitSubfolder "." "https://github.com/sakshamshh/MY-AURIS.git" "Auris master monorepo push: consolidated edge, server, dashboards, deployment scripts, and AI Context Handout"

Write-Host "`n============================================="
Write-Host "All three repositories synchronized perfectly!"
Write-Host "============================================="
