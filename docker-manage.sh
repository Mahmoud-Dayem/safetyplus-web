#!/bin/bash

# SafetyPlus Docker Management Scripts

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Development environment
dev() {
    print_status "Starting SafetyPlus in development mode..."
    check_docker
    docker-compose up --build -d
    print_success "Development environment started!"
    print_status "Access your app at: http://localhost:3000"
    print_status "View logs with: docker-compose logs -f"
}

# Production environment
prod() {
    print_status "Starting SafetyPlus in production mode..."
    check_docker
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
    print_success "Production environment started!"
    print_status "Access your app at: http://localhost:80"
}

# Stop all services
stop() {
    print_status "Stopping all SafetyPlus services..."
    docker-compose down
    docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
    print_success "All services stopped!"
}

# Clean up containers, images, and volumes
clean() {
    print_warning "This will remove all SafetyPlus containers, images, and volumes!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up..."
        docker-compose down -v --rmi all
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Show logs
logs() {
    SERVICE=${2:-safetyplus-web}
    if [ "$1" = "-f" ]; then
        docker-compose logs -f $SERVICE
    else
        docker-compose logs $SERVICE
    fi
}

# Show running containers status
status() {
    print_status "SafetyPlus Container Status:"
    docker-compose ps
}

# Restart services
restart() {
    print_status "Restarting SafetyPlus services..."
    docker-compose restart
    print_success "Services restarted!"
}

# Build images without starting
build() {
    print_status "Building SafetyPlus images..."
    docker-compose build
    print_success "Images built successfully!"
}

# Show help
help() {
    echo "SafetyPlus Docker Management Script"
    echo ""
    echo "Usage: ./docker-manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  dev       Start in development mode"
    echo "  prod      Start in production mode"
    echo "  stop      Stop all services"
    echo "  restart   Restart all services"
    echo "  build     Build images without starting"
    echo "  clean     Remove all containers, images, and volumes"
    echo "  logs      Show logs (use -f for follow mode)"
    echo "  status    Show container status"
    echo "  help      Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-manage.sh dev"
    echo "  ./docker-manage.sh logs -f"
    echo "  ./docker-manage.sh logs safetyplus-web"
}

# Main script logic
case "$1" in
    dev)
        dev
        ;;
    prod)
        prod
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    build)
        build
        ;;
    clean)
        clean
        ;;
    logs)
        logs $2 $3
        ;;
    status)
        status
        ;;
    help|--help|-h)
        help
        ;;
    *)
        print_error "Unknown command: $1"
        help
        exit 1
        ;;
esac