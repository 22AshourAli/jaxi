$logFile = Join-Path $PSScriptRoot ".next\dev-log.txt"
$proc = Start-Process -NoNewWindow -FilePath "npx.cmd" -ArgumentList "next dev -p 3008" -WorkingDirectory $PSScriptRoot -PassThru -RedirectStandardOutput $logFile -RedirectStandardError $logFile
Start-Sleep 20
Get-Content $logFile -Tail 5
Write-Host "PID: $($proc.Id)"
