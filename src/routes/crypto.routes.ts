import { Router, Request, Response } from 'express';
import { cryptoPriceService } from '../services/CryptoPriceService';
import { ApiResponse, CryptoPrice, SupportedCrypto } from '../types';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/crypto/prices - Get all supported crypto prices
router.get('/prices', async (req: Request, res: Response) => {
  try {
    const symbols = cryptoPriceService.getSupportedCryptos().map(c => c.symbol);
    const prices = await cryptoPriceService.getPrices(symbols);

    const response: ApiResponse<CryptoPrice[]> = {
      success: true,
      data: prices,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching prices', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cryptocurrency prices',
    });
  }
});

// GET /api/crypto/prices/:symbol - Get specific crypto price
router.get('/prices/:symbol', async (req: Request, res: Response) => {
  try {
    const { symbol } = req.params;
    const upperSymbol = symbol.toUpperCase();

    if (!cryptoPriceService.isCryptoSupported(upperSymbol)) {
      res.status(400).json({
        success: false,
        error: `Cryptocurrency ${upperSymbol} is not supported`,
      });
      return;
    }

    const price = await cryptoPriceService.getPrice(upperSymbol);

    const response: ApiResponse<CryptoPrice> = {
      success: true,
      data: price,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching price', { error, symbol: req.params.symbol });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cryptocurrency price',
    });
  }
});

// GET /api/crypto/supported - Get list of supported cryptocurrencies
router.get('/supported', (req: Request, res: Response) => {
  const supported = cryptoPriceService.getSupportedCryptos();

  const response: ApiResponse<SupportedCrypto[]> = {
    success: true,
    data: supported,
  };

  res.json(response);
});

export default router;
