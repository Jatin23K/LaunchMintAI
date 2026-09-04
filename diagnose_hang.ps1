Write-Host "--- STARTING LAUNCHMINT AI DIAGNOSTIC ---" -ForegroundColor Cyan

# 1. Check for Locked Files
Write-Host "`n[1] Checking for file locks in project..." -ForegroundColor Yellow
$lockedFiles = Get-Process | ForEach-Object { $_.Modules } | Where-Object { $_.FileName -like "*LaunchMintAI*" }
if ($lockedFiles) {
    Write-Host "CRITICAL: The following processes are locking project files:" -ForegroundColor Red
    $lockedFiles | Select-Object -Property ModuleName, FileName | Unique
} else {
    Write-Host "No direct file locks found by running processes." -ForegroundColor Green
}

# 2. Check Git Index Bloat
Write-Host "`n[2] Auditing Git Index..." -ForegroundColor Yellow
try {
    $indexSize = (git ls-files --stage | Measure-Object).Count
    Write-Host "Total tracked files in Git: $indexSize"
    if ($indexSize -gt 500) {
        Write-Host "WARNING: Your Git index is huge ($indexSize files). Antigravity is likely hanging while trying to diff these." -ForegroundColor Red
    }
} catch {
    Write-Host "Git not initialized or not in path." -ForegroundColor Gray
}

# 3. Detect Large/Binary Files
Write-Host "`n[3] Searching for binaries/logs over 5MB..." -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -ErrorAction SilentlyContinue | Where-Object { $_.Length -gt 5MB } | Select-Object FullName, @{Name="Size(MB)";Expression={$_.Length / 1MB}}

# 4. Antigravity Cache Status
Write-Host "`n[4] Checking IDE Cache..." -ForegroundColor Yellow
if (Test-Path ".claude") {
    $cacheSize = (Get-ChildItem ".claude" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "Agent Cache (.claude) size: $cacheSize MB"
}

Write-Host "`n--- DIAGNOSTIC COMPLETE ---" -ForegroundColor Cyan
Write-Host "Press ENTER to close this window..." -ForegroundColor White
Read-Host # <--- THIS KEEPS THE WINDOW OPEN