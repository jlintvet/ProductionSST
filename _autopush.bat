@echo off
cd /d "C:\Users\jlint\Dropbox\SST Development\SST Development"

:: Check if there are unpushed commits
git log origin/main..HEAD --oneline > "%TEMP%\sst_pending.txt" 2>&1
for %%A in ("%TEMP%\sst_pending.txt") do if %%~zA==0 goto :nopush

echo [%DATE% %TIME%] Pushing unpushed commits...
git push origin main >> "%TEMP%\sst_autopush.log" 2>&1
echo [%DATE% %TIME%] Push complete. >> "%TEMP%\sst_autopush.log"
goto :eof

:nopush
echo [%DATE% %TIME%] Nothing to push. >> "%TEMP%\sst_autopush.log"
