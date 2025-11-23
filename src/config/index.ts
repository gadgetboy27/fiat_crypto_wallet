import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  },

  api: {
    key: process.env.API_KEY || 'dev-api-key-change-in-production',
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  },

  crypto: {
    priceApi: {
      coinGeckoApiKey: process.env.COINGECKO_API_KEY,
      cacheTTL: parseInt(process.env.PRICE_CACHE_TTL || '60', 10),
    },
    supported: (process.env.SUPPORTED_CRYPTOS || 'BTC,ETH,USDT,USDC,SOL,BNB').split(','),
  },

  fees: {
    platformFeePercent: parseFloat(process.env.PLATFORM_FEE_PERCENT || '2.5'),
    minTransactionUSD: parseFloat(process.env.MIN_TRANSACTION_USD || '10'),
    maxTransactionUSD: parseFloat(process.env.MAX_TRANSACTION_USD || '10000'),
  },
};

// Validation
export function validateConfig(): void {
  const requiredVars = [
    'STRIPE_SECRET_KEY',
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0 && config.nodeEnv === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}
