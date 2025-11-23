import axios from 'axios';
import { CryptoPrice, SupportedCrypto } from '../types';
import { config } from '../config';
import { logger } from '../utils/logger';

class CryptoPriceService {
  private priceCache: Map<string, { price: CryptoPrice; timestamp: number }> = new Map();
  private readonly cacheTTL: number;

  // CoinGecko ID mappings
  private readonly coinGeckoIds: Record<string, string> = {
    BTC: 'bitcoin',
    ETH: 'ethereum',
    USDT: 'tether',
    USDC: 'usd-coin',
    SOL: 'solana',
    BNB: 'binancecoin',
  };

  private readonly cryptoInfo: Record<string, SupportedCrypto> = {
    BTC: { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', minPurchase: 10, maxPurchase: 50000, enabled: true },
    ETH: { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', minPurchase: 10, maxPurchase: 50000, enabled: true },
    USDT: { symbol: 'USDT', name: 'Tether', network: 'ERC-20', minPurchase: 10, maxPurchase: 10000, enabled: true },
    USDC: { symbol: 'USDC', name: 'USD Coin', network: 'ERC-20', minPurchase: 10, maxPurchase: 10000, enabled: true },
    SOL: { symbol: 'SOL', name: 'Solana', network: 'Solana', minPurchase: 10, maxPurchase: 10000, enabled: true },
    BNB: { symbol: 'BNB', name: 'BNB', network: 'BSC', minPurchase: 10, maxPurchase: 10000, enabled: true },
  };

  constructor() {
    this.cacheTTL = config.crypto.priceApi.cacheTTL * 1000; // Convert to milliseconds
  }

  async getPrice(symbol: string): Promise<CryptoPrice> {
    const cached = this.priceCache.get(symbol);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTTL) {
      logger.debug(`Cache hit for ${symbol}`);
      return cached.price;
    }

    logger.debug(`Fetching fresh price for ${symbol}`);
    const price = await this.fetchPrice(symbol);
    this.priceCache.set(symbol, { price, timestamp: now });

    return price;
  }

  async getPrices(symbols: string[]): Promise<CryptoPrice[]> {
    const promises = symbols.map(symbol => this.getPrice(symbol));
    return Promise.all(promises);
  }

  private async fetchPrice(symbol: string): Promise<CryptoPrice> {
    const coinGeckoId = this.coinGeckoIds[symbol];

    if (!coinGeckoId) {
      throw new Error(`Unsupported cryptocurrency: ${symbol}`);
    }

    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price`,
        {
          params: {
            ids: coinGeckoId,
            vs_currencies: 'usd',
            include_24hr_change: true,
          },
          headers: config.crypto.priceApi.coinGeckoApiKey
            ? { 'X-Cg-Pro-Api-Key': config.crypto.priceApi.coinGeckoApiKey }
            : {},
          timeout: 5000,
        }
      );

      const data = response.data[coinGeckoId];

      if (!data) {
        throw new Error(`No price data for ${symbol}`);
      }

      return {
        symbol,
        name: this.cryptoInfo[symbol]?.name || symbol,
        priceUSD: data.usd,
        priceChange24h: data.usd_24h_change || 0,
        lastUpdated: new Date(),
      };
    } catch (error) {
      logger.error('Error fetching crypto price', { symbol, error });
      throw new Error(`Failed to fetch price for ${symbol}`);
    }
  }

  calculateCryptoAmount(priceUSD: number, amountUSD: number): number {
    return amountUSD / priceUSD;
  }

  getSupportedCryptos(): SupportedCrypto[] {
    return config.crypto.supported
      .map(symbol => this.cryptoInfo[symbol])
      .filter(Boolean);
  }

  isCryptoSupported(symbol: string): boolean {
    return config.crypto.supported.includes(symbol);
  }

  getCryptoInfo(symbol: string): SupportedCrypto | undefined {
    return this.cryptoInfo[symbol];
  }
}

export const cryptoPriceService = new CryptoPriceService();
