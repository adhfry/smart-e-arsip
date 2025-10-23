@echo off
REM Quick restart script untuk development
REM Gunakan setelah melakukan perubahan code

echo.
echo ========================================
echo  Restarting API Container...
echo ========================================
echo.

docker-compose -f docker-compose.dev.yml restart api

echo.
echo Waiting for application to start...
timeout /t 10 /nobreak > nul

echo.
echo ========================================
echo  Application Logs:
echo ========================================
echo.

docker logs smart-arsip-api-dev --tail 30

echo.
echo ========================================
echo  Press Ctrl+C to exit log viewing
echo  or wait to see real-time logs...
echo ========================================
echo.

docker logs smart-arsip-api-dev -f
