@echo off
REM Script untuk memulai aplikasi dengan Docker di Windows
REM Usage: docker-start.bat [production|development]

setlocal enabledelayedexpansion

set MODE=%1
if "%MODE%"=="" set MODE=production

echo 🚀 Starting Smart E-Arsip API in %MODE% mode...

REM Check if Docker is installed
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed. Please install Docker Desktop first.
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker Compose is not installed. Please install Docker Desktop first.
    exit /b 1
)

REM Check if .env file exists
if not exist .env (
    echo ⚠️  .env file not found. Creating from template...
    if "%MODE%"=="production" (
        copy .env.docker .env
    ) else (
        copy .env.example .env
    )
    echo ✅ .env file created. Please edit it with your configuration.
    echo    IMPORTANT: Change all passwords and secrets!
    exit /b 1
)

REM Start services based on mode
if "%MODE%"=="development" (
    goto :dev_mode
)
if "%MODE%"=="dev" (
    goto :dev_mode
)

:prod_mode
echo 🏭 Starting in production mode...
docker-compose up -d
echo.
echo ✅ Production environment started!
echo    - API: http://localhost:3000
echo.
echo View logs: docker-compose logs -f api
goto :check_status

:dev_mode
echo 🔧 Starting in development mode with hot reload...
docker-compose -f docker-compose.dev.yml up -d
echo.
echo ✅ Development environment started!
echo    - API: http://localhost:3005
echo    - MySQL: localhost:3306
echo    - Redis: localhost:6379
echo    - Debug port: 9229
echo.
echo View logs: docker-compose -f docker-compose.dev.yml logs -f api
goto :check_status

:check_status
echo.
echo 📊 Container status:
if "%MODE%"=="development" (
    docker-compose -f docker-compose.dev.yml ps
) else if "%MODE%"=="dev" (
    docker-compose -f docker-compose.dev.yml ps
) else (
    docker-compose ps
)

echo.
echo 🔍 Waiting for services to be healthy...
timeout /t 5 /nobreak >nul

echo.
echo 🧪 Testing API connection...
curl -s http://localhost:3000/api >nul 2>&1
if errorlevel 1 (
    echo ⚠️  API is not responding yet. Check logs for details.
) else (
    echo ✅ API is responding!
)

echo.
echo 📚 Useful commands:
echo    - View logs: docker-compose logs -f
echo    - Stop: docker-compose down
echo    - Restart: docker-compose restart api
echo    - Database migration: docker-compose exec api npx prisma migrate deploy
echo    - Database GUI: docker-compose exec api npx prisma studio

endlocal
