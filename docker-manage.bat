@echo off
REM SafetyPlus Docker Management Script for Windows

setlocal EnableDelayedExpansion

REM Colors (Windows doesn't support colors easily, but we'll use echo messages)
set "INFO=[INFO]"
set "SUCCESS=[SUCCESS]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Check if Docker is running
:check_docker
docker info >nul 2>&1
if errorlevel 1 (
    echo %ERROR% Docker is not running. Please start Docker first.
    exit /b 1
)
goto :eof

REM Development environment
:dev
echo %INFO% Starting SafetyPlus in development mode...
call :check_docker
docker-compose up --build -d
echo %SUCCESS% Development environment started!
echo %INFO% Access your app at: http://localhost:3000
echo %INFO% View logs with: docker-compose logs -f
goto :eof

REM Production environment
:prod
echo %INFO% Starting SafetyPlus in production mode...
call :check_docker
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
echo %SUCCESS% Production environment started!
echo %INFO% Access your app at: http://localhost:80
goto :eof

REM Stop all services
:stop
echo %INFO% Stopping all SafetyPlus services...
docker-compose down
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
echo %SUCCESS% All services stopped!
goto :eof

REM Clean up containers, images, and volumes
:clean
echo %WARNING% This will remove all SafetyPlus containers, images, and volumes!
set /p confirm="Are you sure? (y/N): "
if /i "!confirm!"=="y" (
    echo %INFO% Cleaning up...
    docker-compose down -v --rmi all
    docker system prune -f
    echo %SUCCESS% Cleanup completed!
) else (
    echo %INFO% Cleanup cancelled.
)
goto :eof

REM Show logs
:logs
if "%2"=="-f" (
    docker-compose logs -f %3%
) else (
    docker-compose logs %2%
)
goto :eof

REM Show running containers status
:status
echo %INFO% SafetyPlus Container Status:
docker-compose ps
goto :eof

REM Restart services
:restart
echo %INFO% Restarting SafetyPlus services...
docker-compose restart
echo %SUCCESS% Services restarted!
goto :eof

REM Build images without starting
:build
echo %INFO% Building SafetyPlus images...
docker-compose build
echo %SUCCESS% Images built successfully!
goto :eof

REM Show help
:help
echo SafetyPlus Docker Management Script
echo.
echo Usage: docker-manage.bat [command]
echo.
echo Commands:
echo   dev       Start in development mode
echo   prod      Start in production mode
echo   stop      Stop all services
echo   restart   Restart all services
echo   build     Build images without starting
echo   clean     Remove all containers, images, and volumes
echo   logs      Show logs (use -f for follow mode)
echo   status    Show container status
echo   help      Show this help message
echo.
echo Examples:
echo   docker-manage.bat dev
echo   docker-manage.bat logs -f
echo   docker-manage.bat logs safetyplus-web
goto :eof

REM Main script logic
if "%1"=="dev" goto :dev
if "%1"=="prod" goto :prod
if "%1"=="stop" goto :stop
if "%1"=="restart" goto :restart
if "%1"=="build" goto :build
if "%1"=="clean" goto :clean
if "%1"=="logs" goto :logs
if "%1"=="status" goto :status
if "%1"=="help" goto :help
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help

echo %ERROR% Unknown command: %1
call :help
exit /b 1