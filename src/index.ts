import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import cryptoRoutes from './routes/crypto.routes';
import orderRoutes from './routes/order.routes';
import webhookRoutes from './routes/webhook.routes';

// Validate configuration
try {
  validateConfig();
} catch (error: any) {
  logger.error('Configuration error', { error: error.message });
  process.exit(1);
}

const app: Express = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.api.rateLimit.windowMs,
  max: config.api.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// Webhook route needs raw body for signature verification
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Body parsing middleware (applied after webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Documentation endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Fiat-to-Crypto Onramp API',
    version: '1.0.0',
    description: 'Professional cryptocurrency onramp service with Stripe integration',
    documentation: '/api/docs',
    endpoints: {
      crypto: {
        prices: 'GET /api/crypto/prices',
        priceBySymbol: 'GET /api/crypto/prices/:symbol',
        supported: 'GET /api/crypto/supported',
      },
      orders: {
        quote: 'POST /api/orders/quote',
        create: 'POST /api/orders',
        getById: 'GET /api/orders/:orderId',
        getAll: 'GET /api/orders (requires API key)',
      },
      webhooks: {
        stripe: 'POST /api/webhooks/stripe',
      },
    },
    support: {
      email: 'support@example.com',
      documentation: 'https://docs.example.com',
    },
  });
});

// API routes
app.use('/api/crypto', cryptoRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = config.port;

app.listen(PORT, () => {
  logger.info(`🚀 Fiat-to-Crypto Onramp API server started`, {
    port: PORT,
    environment: config.nodeEnv,
    nodeVersion: process.version,
  });

  logger.info('📊 Supported cryptocurrencies:', {
    cryptos: config.crypto.supported,
  });

  logger.info('💳 Stripe integration:', {
    enabled: !!config.stripe.secretKey,
    webhooksEnabled: !!config.stripe.webhookSecret,
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
