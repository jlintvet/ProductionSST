# Run this once to set up automatic git push every 15 minutes
# Right-click -> "Run with PowerShell"

$taskName = "SST-AutoPush"
$batFile   = "C:\Users\jlint\Dropbox\SST Development\SST Development\_autopush.bat"

# Remove existing task if present
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue

# Trigger: every 15 minutes, indefinitely
$trigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 15) -Once -At (Get-Date)

# Action: run the batch file hidden (no console window)
$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batFile`""

# Settings: run only when logged on, allow on battery
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Minutes 5) -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries

Register-ScheduledTask -TaskName $taskName -Trigger $trigger -Action $action -Settings $settings -RunLevel Limited -Force

Write-Host ""
Write-Host "Done! SST-AutoPush task created." -ForegroundColor Green
Write-Host "Git will push automatically every 15 minutes whenever there are unpushed commits." -ForegroundColor Green
Write-Host "Log: $env:TEMP\sst_autopush.log" -ForegroundColor Cyan
Write-Host ""
Write-Host "To remove: Unregister-ScheduledTask -TaskName 'SST-AutoPush' -Confirm:`$false"
pause
