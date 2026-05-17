# Run this in Cursor Terminal:  powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\OneDrive\Documents\AURIS\RUN-ME.ps1"
$ErrorActionPreference = "Stop"
$Root = "$env:USERPROFILE\OneDrive\Documents\AURIS"

@("server","edge","dashboard","docs") | ForEach-Object {
  New-Item -ItemType Directory -Force -Path (Join-Path $Root $_) | Out-Null
}

function Copy-Tree($from, $to, [string[]]$xd, [string[]]$xf) {
  if (-not (Test-Path $from)) { Write-Host "SKIP missing: $from"; return }
  $a = @($from, $to, "/E", "/COPY:DAT", "/R:1", "/W:1")
  foreach ($d in $xd) { $a += "/XD"; $a += $d }
  foreach ($f in $xf) { $a += "/XF"; $a += $f }
  & robocopy @a | Out-Host
  Write-Host "-> $to (robocopy exit $LASTEXITCODE)`n"
}

Copy-Tree "C:\Users\SAKSHAM\auris-server" "$Root\server" @(".git","__pycache__",".venv") @(".env",".env.local")
Copy-Tree "C:\Users\SAKSHAM\Auris" "$Root\edge" @(".git","logs","__pycache__","videos") @(".env",".env.local","*.mp4")
Copy-Tree "C:\Users\SAKSHAM\auris-app" "$Root\dashboard" @("node_modules",".expo","dist",".git") @(".env")

$utc = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
"Tool=Cursor`nDate=$utc`nSummary=RUN-ME.ps1 consolidated all Auris folders" | Set-Content "$Root\AI_LAST_TOUCH.md"

Write-Host "`n=== DONE ==="
Write-Host "Folder: $Root"
@("server","edge","dashboard") | ForEach-Object {
  $p = Join-Path $Root $_
  if (Test-Path $p) {
    $n = (Get-ChildItem $p -Recurse -File | Measure-Object).Count
    Write-Host "  $_ : $n files"
  }
}
Write-Host "`nPush server to GitHub:"
Write-Host "  cd $Root\server"
Write-Host "  git remote add origin https://github.com/sakshamshh/auris-server.git"
Write-Host "  git push -u origin main"
