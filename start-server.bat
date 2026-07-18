@echo off
title Shoninyokkyugram local server
echo ==================================================
echo  Shoninyokkyugram local server
echo.
echo  Your API key will exist ONLY in this window.
echo  It is never saved to any file or log.
echo  Close this window and the key is gone.
echo ==================================================
echo.
set /p GEMINI_API_KEY=Paste Gemini API key + Enter: 
echo.
node "%~dp0local-server.js"
pause
