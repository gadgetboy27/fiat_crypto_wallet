# Deployment Guide

This guide covers various deployment options for the Fiat-to-Crypto Onramp API.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Deployment](#local-deployment)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [Production Considerations](#production-considerations)
- [Monitoring & Logging](#monitoring--logging)

## Prerequisites

Before deploying, ensure you have:

1. **Stripe Account** - [Sign up](https://stripe.com)
   - Get your API keys from the Stripe Dashboard
   - Set up webhook endpoints

2. **Domain Name** (for production)
   - SSL/TLS certificate (Let's Encrypt recommended)

3. **Environment Variables**
   - See `.env.example` for required variables

## Local Deployment

### Development Mode

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env

# Start development server (with hot reload)
npm run dev
```

The API will be available at `http://localhost:3000`

### Production Build (Local)

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Docker Deployment

### Using Docker

```bash
# Build Docker image
docker build -t crypto-onramp-api .

# Run container
docker run -p 3000:3000 \
  -e STRIPE_SECRET_KEY=sk_test_xxx \
  -e STRIPE_WEBHOOK_SECRET=whsec_xxx \
  -e API_KEY=your_secure_key \
  crypto-onramp-api
```

### Using Docker Compose

1. **Create `.env` file**:

```env
STRIPE_SECRET_KEY=sk_live_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
STRIPE_PUBLISHABLE_KEY=pk_live_your_key
API_KEY=your_secure_random_api_key
COINGECKO_API_KEY=your_coingecko_key
```

2. **Start services**:

```bash
docker-compose up -d
```

3. **View logs**:

```bash
docker-compose logs -f api
```

4. **Stop services**:

```bash
docker-compose down
```

## Cloud Deployment

### AWS Deployment

#### Option 1: AWS ECS (Elastic Container Service)

```bash
# 1. Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t crypto-onramp-api .
docker tag crypto-onramp-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/crypto-onramp-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/crypto-onramp-api:latest

# 2. Create ECS task definition (use AWS Console or CLI)
# 3. Create ECS service with load balancer
# 4. Configure environment variables in task definition
```

#### Option 2: AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/yourusername/fiat_crypto_wallet.git
cd fiat_crypto_wallet

# Install dependencies and build
npm install
npm run build

# Install PM2 for process management
sudo npm install -g pm2

# Start application with PM2
pm2 start dist/index.js --name crypto-onramp-api

# Configure PM2 to start on boot
pm2 startup
pm2 save

# Set up Nginx reverse proxy
sudo apt-get install nginx
# Configure Nginx (see Nginx config below)
```

**Nginx Configuration** (`/etc/nginx/sites-available/crypto-onramp-api`):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Google Cloud Platform (GCP)

#### Cloud Run Deployment

```bash
# Build and deploy
gcloud builds submit --tag gcr.io/your-project-id/crypto-onramp-api

gcloud run deploy crypto-onramp-api \
  --image gcr.io/your-project-id/crypto-onramp-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "STRIPE_SECRET_KEY=sk_live_xxx,API_KEY=xxx"
```

### Azure

#### Azure Container Instances

```bash
# Create resource group
az group create --name crypto-onramp-rg --location eastus

# Create container
az container create \
  --resource-group crypto-onramp-rg \
  --name crypto-onramp-api \
  --image your-docker-image \
  --dns-name-label crypto-onramp \
  --ports 3000 \
  --environment-variables \
    'STRIPE_SECRET_KEY'='sk_live_xxx' \
    'API_KEY'='your_key'
```

### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create your-app-name

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_xxx
heroku config:set API_KEY=your_secure_key

# Deploy
git push heroku main

# Open app
heroku open
```

### Railway

1. Connect your GitHub repository to Railway
2. Configure environment variables in Railway dashboard
3. Deploy automatically on git push

### Render

1. Create a new Web Service
2. Connect your GitHub repository
3. Configure:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add environment variables
5. Deploy

## Production Considerations

### 1. Environment Variables

**Never commit sensitive data!** Use environment variables:

```env
# Production .env
NODE_ENV=production
PORT=443

# Stripe Live Keys
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx

# Secure API Key (use strong random string)
API_KEY=<generate-with-openssl-rand-base64-32>

# CoinGecko Pro API
COINGECKO_API_KEY=your_pro_key

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://yourfrontend.com

# Database (if using)
DATABASE_URL=postgresql://user:pass@host:5432/db
```

### 2. SSL/TLS Certificate

**Required for production!**

Using Let's Encrypt with Certbot:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (Certbot sets this up automatically)
sudo certbot renew --dry-run
```

### 3. Stripe Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
   - `charge.refunded`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Database Setup (Production)

Replace in-memory storage with a database:

```typescript
// Example: PostgreSQL with Prisma
// Install: npm install @prisma/client prisma

// schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Order {
  id                    String   @id @default(uuid())
  cryptoSymbol          String
  cryptoAmount          Float
  fiatAmount            Float
  priceAtPurchase       Float
  platformFee           Float
  totalCharged          Float
  customerEmail         String
  walletAddress         String
  status                String
  stripePaymentIntentId String?
  createdAt             DateTime @default(now())
  completedAt           DateTime?
}
```

### 5. Caching (Redis)

Implement Redis caching for crypto prices:

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedPrice(symbol: string) {
  const cached = await redis.get(`price:${symbol}`);
  if (cached) return JSON.parse(cached);

  const price = await fetchPriceFromAPI(symbol);
  await redis.setex(`price:${symbol}`, 60, JSON.stringify(price));

  return price;
}
```

## Monitoring & Logging

### Application Monitoring

#### Using PM2

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs crypto-onramp-api

# View metrics
pm2 metrics
```

#### Cloud Monitoring

- **AWS**: CloudWatch
- **GCP**: Cloud Logging & Monitoring
- **Azure**: Application Insights

### Error Tracking

Integrate with error tracking services:

**Sentry Integration**:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

// Add to error handler
app.use(Sentry.Handlers.errorHandler());
```

### Logging

Winston is configured for production logging:

```typescript
// Logs are written to:
// - logs/error.log (errors only)
// - logs/combined.log (all logs)
// - Console (formatted)
```

### Health Checks

Configure your monitoring to check `/health`:

```bash
# Example with cron
*/5 * * * * curl -f http://localhost:3000/health || echo "API is down!"
```

### Backup Strategy

1. **Database Backups**:
   - Daily automated backups
   - Store in S3 or equivalent

2. **Configuration Backups**:
   - Version control for code
   - Encrypted backup of environment variables

## Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure API keys
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Use helmet for security headers
- [ ] Implement input validation
- [ ] Enable webhook signature verification
- [ ] Use environment variables for secrets
- [ ] Set up monitoring and alerts
- [ ] Implement proper error handling
- [ ] Regular security audits
- [ ] Keep dependencies updated

## Scaling Considerations

### Horizontal Scaling

Use a load balancer with multiple instances:

```bash
# AWS Application Load Balancer
# GCP Load Balancing
# Azure Load Balancer
```

### Vertical Scaling

Increase server resources based on load.

### Caching Strategy

- Redis for price caching
- CDN for static assets
- Database query optimization

## Troubleshooting

### Common Issues

1. **Stripe Webhook Errors**
   - Verify webhook secret
   - Check webhook URL is accessible
   - Ensure raw body is sent to webhook endpoint

2. **Rate Limiting Issues**
   - Adjust `RATE_LIMIT_MAX_REQUESTS`
   - Implement request queuing

3. **Price Fetching Errors**
   - Check CoinGecko API status
   - Verify API key
   - Implement fallback price sources

### Debug Mode

Enable debug logging:

```env
NODE_ENV=development
LOG_LEVEL=debug
```

## Support

For deployment issues:
- Check logs first: `pm2 logs` or cloud provider logs
- Review error tracking (Sentry)
- GitHub Issues: https://github.com/yourusername/fiat_crypto_wallet/issues
