@echo off
cd /d "%~dp0"
echo ORBIT - http://localhost:8788/
echo Keep this window open. Press Ctrl+C to stop.
start "" "http://localhost:8788/"
python -m http.server 8788 --bind 0.0.0.0 --directory "%~dp0."
pause
