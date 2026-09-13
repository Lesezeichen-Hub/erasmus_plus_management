@echo off
cd /d "%~dp0"
if not exist "ErasmusPlusManagementServer.exe" (
  echo ErasmusPlusManagementServer.exe wurde nicht gefunden.
  echo Bitte zuerst bauen: go build -trimpath -ldflags "-s -w" -o ErasmusPlusManagementServer.exe local_server.go
  pause
  exit /b 1
)
ErasmusPlusManagementServer.exe -updates=true
pause
