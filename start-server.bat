@echo off
chcp 932 >nul
title Shoninyokkyugram local server
echo ==================================================
echo  Shoninyokkyugram ローカルサーバー起動
echo .
echo  これから貼るAPIキーは「この窓のメモリ」にだけ存在し、
echo  ファイルにもログにも一切保存されません。
echo  （窓を閉じればキーも消えます）
echo ==================================================
echo.
set /p GEMINI_API_KEY=Gemini APIキーを貼り付けて Enter: 
echo.
node "%~dp0local-server.js"
pause
