# 🚀 Fiat-to-Crypto Onramp API

A production-ready, enterprise-grade cryptocurrency onramp API service built with TypeScript, Node.js, and Stripe. Enable your users to seamlessly purchase cryptocurrencies using traditional payment methods.

## 📋 Table of Contents

- [Features](#features)
- [Industry Applications](#industry-applications)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Third-Party API Integration](#third-party-api-integration)
- [Deployment](#deployment)
- [Business Model](#business-model)

## ✨ Features

- **💳 Stripe Payment Integration**: Accept credit/debit cards and bank transfers
- **📊 Real-time Crypto Pricing**: Live cryptocurrency prices via CoinGecko API
- **🔒 Enterprise Security**: Rate limiting, API key authentication, input validation
- **🪝 Webhook Support**: Automated payment status updates
- **💰 Multi-Crypto Support**: BTC, ETH, USDT, USDC, SOL, BNB
- **📱 RESTful API**: Clean, well-documented endpoints
- **⚡ High Performance**: Built with TypeScript for type safety and reliability
- **🔍 Comprehensive Logging**: Winston-powered logging system
- **✅ Input Validation**: Zod schema validation for all inputs

## 🏢 Industry Applications

This API can be integrated into various platforms:

### **Primary Use Cases**
1. **Cryptocurrency Exchanges** - Fiat entry points for new users
2. **NFT Marketplaces** - Enable fiat purchases of NFTs
3. **DeFi Platforms** - Onboard traditional finance users
4. **Gaming Platforms** - In-game crypto purchases
5. **E-commerce** - Accept crypto payments with fiat conversion
6. **P2P Marketplaces** - Facilitate crypto transactions
7. **Wallets** - Built-in purchase functionality
8. **Neobanks** - Crypto banking services

### **Revenue Opportunities**
- **Transaction Fees**: 1-5% per conversion
- **White-Label Licensing**: Rebrand and resell
- **API Subscription Tiers**: Free, Pro, Enterprise
- **Volume-Based Pricing**: Discounts for high-volume clients

## 🛠 Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript 5.3
- **Framework**: Express.js
- **Payment Processing**: Stripe
- **Price Feeds**: CoinGecko API
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Zod
- **Logging**: Winston

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Stripe account ([Sign up](https://stripe.com))
- CoinGecko API key (optional, for higher rate limits)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/fiat_crypto_wallet.git
cd fiat_crypto_wallet
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server
PORT=3000
NODE_ENV=development

# Stripe (Required)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here

# API Security
API_KEY=your_secure_api_key_change_this

# Optional: CoinGecko Pro API
COINGECKO_API_KEY=your_coingecko_api_key
```

4. **Build the project**
```bash
npm run build
```

5. **Start development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication

Most endpoints are public. Admin endpoints require an API key:

```bash
curl -H "X-API-Key: your_api_key" http://localhost:3000/api/orders
```

### Endpoints

#### 1. Get Cryptocurrency Prices

**GET** `/crypto/prices`

Get current prices for all supported cryptocurrencies.

```bash
curl http://localhost:3000/api/crypto/prices
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "priceUSD": 45000.50,
      "priceChange24h": 2.5,
      "lastUpdated": "2025-01-15T10:30:00.000Z"
    }
  ]
}
```

#### 2. Get Specific Crypto Price

**GET** `/crypto/prices/:symbol`

```bash
curl http://localhost:3000/api/crypto/prices/BTC
```

#### 3. Get Supported Cryptocurrencies

**GET** `/crypto/supported`

```bash
curl http://localhost:3000/api/crypto/supported
```

#### 4. Get Price Quote

**POST** `/orders/quote`

Get a price quote before creating an order.

```bash
curl -X POST http://localhost:3000/api/orders/quote \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoSymbol": "BTC",
    "amountUSD": 100
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cryptoSymbol": "BTC",
    "amountUSD": 100,
    "cryptoAmount": 0.00222222,
    "currentPrice": 45000,
    "platformFee": 2.5,
    "totalCharge": 102.5,
    "expiresAt": "2025-01-15T10:32:00.000Z"
  }
}
```

#### 5. Create Order

**POST** `/orders`

Create a new purchase order.

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoSymbol": "BTC",
    "amountUSD": 100,
    "customerEmail": "user@example.com",
    "walletAddress": "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    "paymentMethod": "card"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "cryptoSymbol": "BTC",
      "cryptoAmount": 0.00222222,
      "fiatAmount": 100,
      "platformFee": 2.5,
      "totalCharged": 102.5,
      "status": "pending",
      "createdAt": "2025-01-15T10:30:00.000Z"
    },
    "clientSecret": "pi_xxxxx_secret_yyyyy"
  },
  "message": "Order created successfully. Use the clientSecret to complete payment."
}
```

#### 6. Get Order Status

**GET** `/orders/:orderId`

```bash
curl http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000
```

#### 7. Webhook Endpoint

**POST** `/webhooks/stripe`

Stripe webhook endpoint for payment status updates. Configure in your Stripe dashboard:

```
https://yourdomain.com/api/webhooks/stripe
```

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing API key)
- `403` - Forbidden (invalid API key)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## 🔒 Security Features

### 1. Rate Limiting
- 100 requests per 15 minutes per IP address
- Configurable via environment variables

### 2. Input Validation
- Zod schema validation on all inputs
- Wallet address format validation per cryptocurrency
- Amount limits (min: $10, max: $10,000)

### 3. API Key Authentication
- Required for admin endpoints
- Secure key storage via environment variables

### 4. Helmet Security Headers
- XSS protection
- Clickjacking prevention
- Content Security Policy

### 5. CORS Configuration
- Configurable allowed origins
- Credentials support

## 🔌 Third-Party API Integration

This API is designed to be integrated as a white-label solution.

### Integration Example (React)

```typescript
import axios from 'axios';

const API_BASE = 'https://your-api-domain.com/api';

// 1. Get a price quote
async function getQuote(cryptoSymbol: string, amountUSD: number) {
  const response = await axios.post(`${API_BASE}/orders/quote`, {
    cryptoSymbol,
    amountUSD,
  });
  return response.data.data;
}

// 2. Create an order
async function createOrder(orderData) {
  const response = await axios.post(`${API_BASE}/orders`, orderData);
  return response.data.data;
}

// 3. Complete payment with Stripe
import { loadStripe } from '@stripe/stripe-js';

async function purchaseCrypto(
  cryptoSymbol: string,
  amountUSD: number,
  email: string,
  walletAddress: string
) {
  // Create order
  const { order, clientSecret } = await createOrder({
    cryptoSymbol,
    amountUSD,
    customerEmail: email,
    walletAddress,
    paymentMethod: 'card',
  });

  // Initialize Stripe
  const stripe = await loadStripe('pk_test_your_publishable_key');

  // Redirect to Stripe payment page
  const { error } = await stripe.confirmPayment({
    clientSecret,
    confirmParams: {
      return_url: 'https://yoursite.com/payment-complete',
    },
  });

  if (error) {
    console.error(error.message);
  }
}
```

### White-Label Deployment

This API can be deployed as a white-label service for:

1. **SaaS Platforms** - Integrate crypto purchases into your platform
2. **Fintech Apps** - Add crypto capabilities to financial apps
3. **E-commerce** - Enable crypto payment options
4. **Custom Solutions** - Build tailored crypto onramp experiences

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure production Stripe keys
- [ ] Set secure `API_KEY`
- [ ] Configure CORS allowed origins
- [ ] Set up SSL/TLS certificates
- [ ] Configure webhook endpoint in Stripe dashboard
- [ ] Set up database (replace in-memory storage)
- [ ] Configure monitoring and logging
- [ ] Set up backup systems
- [ ] Implement KYC/AML compliance (if required)

### Deployment Options

#### Option 1: Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### Option 2: Cloud Platforms

- **AWS**: Deploy on EC2, ECS, or Lambda
- **Google Cloud**: Cloud Run or App Engine
- **Azure**: App Service or Container Instances
- **Heroku**: One-click deployment
- **Railway**: Modern deployment platform
- **Render**: Simple cloud platform

### Environment Setup

For production, use environment-specific configuration:

```bash
# Production
NODE_ENV=production
PORT=443
STRIPE_SECRET_KEY=sk_live_your_key
# ... other production configs
```

## 💼 Business Model

### Revenue Streams

1. **Transaction Fees**: 2.5% per transaction
2. **API Subscriptions**:
   - Free: 100 requests/month
   - Pro: $99/month - 10,000 requests
   - Enterprise: Custom pricing

3. **White-Label Licensing**: $500-5000/month
4. **Custom Integration Services**: Professional services

### Market Opportunity

- Global crypto market: $2+ trillion
- Fiat onramp market growing 40% YoY
- Major players: Transak, Onramper, MoonPay, Wyre
- Average transaction: $100-500
- Potential revenue per 1000 transactions: $2,500+

## 📖 Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [CoinGecko API](https://www.coingecko.com/en/api)
- [Express.js Guide](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this in your commercial projects.

## 🆘 Support

For questions or support:
- Create an issue on GitHub
- Email: support@example.com
- Documentation: https://docs.example.com

---

**Built with ❤️ using modern TypeScript and Node.js**