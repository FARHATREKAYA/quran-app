# CI/CD Documentation

## Overview
This document covers the Continuous Integration and Continuous Deployment (CI/CD) setup for the Quran App.

## GitHub Actions Workflows

### 1. Tests Workflow (`test.yml`)
**Trigger**: Push/PR to `main` or `develop` branches

**Jobs**:
- **Backend Tests**: Runs Python pytest with coverage
- **Frontend Tests**: Runs Cypress E2E tests
- **Integration Tests**: Runs full stack integration tests

**Commands**:
```bash
# Run backend tests
cd quran-app/backend && pytest --cov=. --cov-report=xml

# Run frontend tests
cd quran-app/frontend && npm run test:e2e
```

### 2. Code Quality Workflow (`code-quality.yml`)
**Trigger**: Push/PR to `main` or `develop` branches

**Jobs**:
- **Python Linting**: flake8, black, isort, mypy
- **JavaScript/TypeScript Linting**: ESLint, TypeScript compiler
- **Security Scan**: Trivy, npm audit, pip-audit

### 3. Build Workflow (`build.yml`)
**Trigger**: Push to `main` or tags starting with `v`

**Jobs**:
- **Build Backend Docker Image**: Multi-stage build with caching
- **Build Frontend Docker Image**: Optimized Next.js build
- **Build Static Assets**: Exports for static hosting

**Docker Images**:
- Backend: `ghcr.io/<org>/quran-app-backend`
- Frontend: `ghcr.io/<org>/quran-app-frontend`

### 4. Deploy Workflow (`deploy.yml`)
**Trigger**: Push to `main`, tags, or manual dispatch

**Environments**:
- **Staging**: Auto-deploy on `develop` branch
- **Production**: Deploy on tags or manual approval

## Docker Setup

### Local Development with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Services

1. **Backend** (`quran-backend`)
   - Port: 8000
   - SQLite database mounted as read-only volume
   - Health check endpoint

2. **Frontend** (`quran-frontend`)
   - Port: 3000
   - Built with Next.js
   - Depends on backend health

3. **Nginx** (Optional, production profile)
   - Port: 80/443
   - Reverse proxy configuration
   - SSL/TLS termination

## Environment Variables

### Backend
```env
DATABASE_URL=sqlite:///./data/quran.db
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Frontend
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=production
```

## Deployment Options

### Option 1: Docker Compose (Recommended for Self-Hosting)

```bash
# Clone repository
git clone https://github.com/yourusername/quran-app.git
cd quran-app

# Start services
docker-compose up -d

# Access application
# Frontend: http://localhost
# Backend: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Option 2: GitHub Container Registry

```bash
# Pull images
docker pull ghcr.io/yourusername/quran-app-backend:latest
docker pull ghcr.io/yourusername/quran-app-frontend:latest

# Run
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Static Hosting (Frontend Only)

```bash
# Build static export
cd quran-app/frontend
npm run build

# Deploy to Netlify/Vercel
npx netlify-cli deploy --prod --dir=dist
```

### Option 4: Cloud Providers

#### AWS (ECS/Fargate)
```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker build -t quran-app-backend ./quran-app/backend
docker tag quran-app-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/quran-app-backend:latest
docker push <account>.dkr.ecr.<region>.amazonaws.com/quran-app-backend:latest
```

#### Vercel (Frontend)
```bash
# Connect GitHub repo to Vercel
# Automatic deployments on push
```

#### Railway/Render (Backend)
```bash
# Connect GitHub repo
# Automatic deployments with environment variables
```

## Security Best Practices

1. **Non-root Containers**: Both frontend and backend run as non-root users
2. **Health Checks**: All services have health check endpoints
3. **Read-only Volumes**: Database mounted as read-only
4. **Security Scanning**: Trivy scans for vulnerabilities
5. **Secrets Management**: Use GitHub Secrets for sensitive data

## Required GitHub Secrets

Go to Settings → Secrets and variables → Actions, add:

- `SERVER_HOST`: Production server IP/hostname
- `SERVER_USER`: SSH username
- `SSH_PRIVATE_KEY`: Private key for deployment
- `PROD_API_URL`: Production backend URL
- `GITHUB_TOKEN`: Automatically provided

## Monitoring

### Health Checks
- Backend: `GET /health` returns `{"status": "healthy"}`
- Frontend: Built-in Next.js health check

### Logging
- Backend: Structured logging with uvicorn
- Frontend: Client-side error tracking (Sentry recommended)

### Metrics (Optional)
```bash
# Prometheus metrics endpoint
GET /metrics
```

## Rollback Strategy

```bash
# Quick rollback to previous version
docker-compose pull <service>:<previous-tag>
docker-compose up -d

# Or use git tags
git checkout v1.0.0
docker-compose up -d --build
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify database exists
ls -la quran-app/backend/data/quran.db

# Check health
curl http://localhost:8000/health
```

### Frontend build fails
```bash
# Clear cache
cd quran-app/frontend
rm -rf .next node_modules
npm install
npm run build
```

### Database locked
```bash
# Check for existing connections
lsof quran-app/backend/data/quran.db

# Restart backend
docker-compose restart backend
```

## Performance Optimization

### Backend
- Use `--workers 4` in production
- Enable Gzip compression
- Add Redis caching (optional)

### Frontend
- Enable Next.js static optimization
- Use CDN for assets
- Implement service worker for offline

### Database
- SQLite is sufficient for current scale
- Consider PostgreSQL if > 10,000 concurrent users

## Cost Estimation (Monthly)

### Self-Hosted (VPS)
- VPS (2CPU, 4GB): $10-20/month
- Domain: $10-15/year
- SSL Certificate: Free (Let's Encrypt)
- **Total: ~$15/month**

### Cloud Providers
- AWS ECS (Fargate): $30-50/month
- Vercel Pro: $20/month
- Railway: $5-20/month
- **Total: ~$50/month**

## CI/CD Pipeline Diagram

```
Developer Push
    ↓
GitHub Actions
    ↓
┌─────────────────┐
│  1. Code Quality │
│  - Linting       │
│  - Security      │
└─────────────────┘
    ↓
┌─────────────────┐
│  2. Tests        │
│  - Unit tests    │
│  - E2E tests     │
│  - Integration   │
└─────────────────┘
    ↓
┌─────────────────┐
│  3. Build        │
│  - Docker images │
│  - Push to GHCR  │
└─────────────────┘
    ↓
┌─────────────────┐
│  4. Deploy       │
│  - Staging       │
│  - Production    │
└─────────────────┘
    ↓
Live Application
```

## Contact & Support

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions
- **Documentation**: This file and README.md
