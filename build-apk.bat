@echo off
call npm install
call npx eas-cli build --platform android --profile preview
pause
