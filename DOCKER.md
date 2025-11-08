# SafetyPlus Docker Setup

This document explains how to run SafetyPlus using Docker and Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Docker Compose v3.8+
- Git (for cloning the repository)

## Quick Start

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd safetyplus-web
cp .env.example .env
# Edit .env with your actual configuration values
```

### 2. Development Mode

```bash
# Using the management script (recommended)
./docker-manage.sh dev
# OR
chmod +x docker-manage.sh && ./docker-manage.sh dev

# Using docker-compose directly
docker-compose up --build
```

### 3. Production Mode

```bash
# Using the management script
./docker-manage.sh prod

# Using docker-compose directly
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

```

## Docker Compose Files

### `docker-compose.yml` (Main Configuration)

- **safetyplus-web**: Main React application container
- **safetyplus-dev**: Development server (profile: dev)
- **redis**: Redis cache (profile: cache)
- **nginx-proxy**: Reverse proxy (profile: proxy)
- **portainer**: Container management UI (profile: monitoring)

### `docker-compose.override.yml` (Development Override)

Automatically loaded in development mode with hot reloading enabled.

### `docker-compose.prod.yml` (Production Configuration)

Production-optimized settings with resource limits and health checks.

## Available Profiles

Use profiles to enable optional services:

```bash
# Enable Redis caching
docker-compose --profile cache up -d

# Enable monitoring with Portainer
docker-compose --profile monitoring up -d

# Enable reverse proxy
docker-compose --profile proxy up -d

# Enable all profiles
docker-compose --profile dev --profile cache --profile monitoring --profile proxy up -d
```

## Management Scripts

### Linux/Mac: `docker-manage.sh`

```bash
chmod +x docker-manage.sh

# Available commands
./docker-manage.sh dev      # Start development environment
./docker-manage.sh prod     # Start production environment
./docker-manage.sh stop     # Stop all services
./docker-manage.sh restart  # Restart services
./docker-manage.sh build    # Build images
./docker-manage.sh clean    # Clean up everything
./docker-manage.sh logs     # Show logs
./docker-manage.sh status   # Show container status
./docker-manage.sh help     # Show help
```

### Windows: `docker-manage.bat`

```cmd
# Available commands
docker-manage.bat dev      # Start development environment
docker-manage.bat prod     # Start production environment
docker-manage.bat stop     # Stop all services
docker-manage.bat restart  # Restart services
docker-manage.bat build    # Build images
docker-manage.bat clean    # Clean up everything
docker-manage.bat logs     # Show logs
docker-manage.bat status   # Show container status
docker-manage.bat help     # Show help
```

## Port Mapping

| Service | Development Port | Production Port | Description |
|---------|------------------|-----------------|-------------|
| React App | 3000 | 80 | Main application |
| React Dev | 3001 | - | Development server |
| Redis | 6379 | 6379 | Cache server |
| Nginx Proxy | - | 443 | HTTPS proxy |
| Portainer | 9000 | 9000 | Container management |

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Application
NODE_ENV=production
PORT=3000

# Firebase
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id

# Redis (optional)
REDIS_PASSWORD=safetyplus123

# Development
CHOKIDAR_USEPOLLING=true
WATCHPACK_POLLING=true
```

## Volume Mounts

### Development
- Source code: `.:/app` (hot reloading)
- Node modules: `/app/node_modules` (performance)

### Production
- Logs: `./logs:/var/log/nginx`
- SSL certificates: `./nginx/ssl:/etc/nginx/ssl:ro`

## Health Checks

The production setup includes health checks:

- **Main app**: HTTP check on port 80 every 30 seconds
- **Start period**: 40 seconds for initial startup
- **Retries**: 3 attempts before marking unhealthy

## Resource Limits (Production)

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      cpus: '0.5'
      memory: 512M
```

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Stop existing containers
   docker-compose down
   
   # Check what's using the port
   netstat -tulpn | grep :3000
   ```

2. **Build failures**
   ```bash
   # Clean build cache
   docker builder prune
   
   # Rebuild without cache
   docker-compose build --no-cache
   ```

3. **Permission issues (Linux/Mac)**
   ```bash
   # Fix script permissions
   chmod +x docker-manage.sh
   
   # Fix Docker permissions
   sudo usermod -aG docker $USER
   # Then logout and login again
   ```

4. **Hot reloading not working**
   ```bash
   # Make sure polling is enabled in .env
   CHOKIDAR_USEPOLLING=true
   WATCHPACK_POLLING=true
   ```

### Debugging

```bash
# View logs
docker-compose logs -f safetyplus-web

# Execute commands in container
docker-compose exec safetyplus-web sh

# Check container status
docker-compose ps

# View resource usage
docker stats
```

## Security Considerations

### Production Deployment

1. **Use HTTPS**: Configure SSL certificates in `nginx/ssl/`
2. **Environment Variables**: Never commit `.env` files
3. **Firewall**: Only expose necessary ports
4. **Updates**: Regularly update base images
5. **Secrets**: Use Docker secrets for sensitive data

### SSL Setup (Optional)

1. Create SSL directory:
   ```bash
   mkdir -p nginx/ssl
   ```

2. Add your certificates:
   ```bash
   # Copy your SSL certificates
   cp your-cert.pem nginx/ssl/cert.pem
   cp your-key.pem nginx/ssl/key.pem
   ```

3. Enable the proxy profile:
   ```bash
   docker-compose --profile proxy up -d
   ```

## Monitoring

### Portainer (Container Management)

1. Enable monitoring profile:
   ```bash
   docker-compose --profile monitoring up -d
   ```

2. Access Portainer at: http://localhost:9000

3. Set up admin user on first visit

### Application Logs

```bash
# Follow all logs
docker-compose logs -f

# Follow specific service logs
docker-compose logs -f safetyplus-web

# View last 100 lines
docker-compose logs --tail=100 safetyplus-web
```

## Backup and Restore

### Backup Volumes

```bash
# Backup Redis data
docker run --rm -v safetyplus-web_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis-backup.tar.gz -C /data .

# Backup logs
cp -r logs/ backups/logs-$(date +%Y%m%d)
```

### Restore Volumes

```bash
# Restore Redis data
docker run --rm -v safetyplus-web_redis_data:/data -v $(pwd):/backup alpine tar xzf /backup/redis-backup.tar.gz -C /data
```

## Contributing

When contributing to the Docker setup:

1. Test both development and production modes
2. Update documentation for any new services
3. Ensure scripts work on both Linux/Mac and Windows
4. Add appropriate health checks for new services
5. Consider security implications of any changes