import { Router, Request, Response } from 'express';
import { orderService } from '../services/OrderService';
import { ApiResponse, OrderRequest, PriceQuote, Order } from '../types';
import { orderRequestSchema, priceQuoteSchema, validateWalletAddress } from '../utils/validators';
import { logger } from '../utils/logger';
import { apiKeyAuth } from '../middleware/auth';

const router = Router();

// POST /api/orders/quote - Get a price quote
router.post('/quote', async (req: Request, res: Response) => {
  try {
    const validated = priceQuoteSchema.parse(req.body);
    const quote = await orderService.createPriceQuote(
      validated.cryptoSymbol,
      validated.amountUSD
    );

    const response: ApiResponse<PriceQuote> = {
      success: true,
      data: quote,
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error creating quote', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create price quote',
    });
  }
});

// POST /api/orders - Create a new order
router.post('/', async (req: Request, res: Response) => {
  try {
    const validated = orderRequestSchema.parse(req.body) as OrderRequest;

    // Validate wallet address
    if (!validateWalletAddress(validated.cryptoSymbol, validated.walletAddress)) {
      res.status(400).json({
        success: false,
        error: `Invalid wallet address for ${validated.cryptoSymbol}`,
      });
      return;
    }

    const result = await orderService.createOrder(validated);

    const response: ApiResponse<{
      order: Order;
      clientSecret: string;
    }> = {
      success: true,
      data: result,
      message: 'Order created successfully. Use the clientSecret to complete payment.',
    };

    res.json(response);
  } catch (error: any) {
    logger.error('Error creating order', { error, body: req.body });
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to create order',
    });
  }
});

// GET /api/orders/:orderId - Get order details
router.get('/:orderId', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const order = await orderService.getOrder(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
      return;
    }

    const response: ApiResponse<Order> = {
      success: true,
      data: order,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching order', { error, orderId: req.params.orderId });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch order',
    });
  }
});

// GET /api/orders - Get all orders (requires API key)
router.get('/', apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { email } = req.query;

    let orders: Order[];

    if (email) {
      orders = orderService.getOrdersByEmail(email as string);
    } else {
      orders = orderService.getAllOrders();
    }

    const response: ApiResponse<Order[]> = {
      success: true,
      data: orders,
    };

    res.json(response);
  } catch (error) {
    logger.error('Error fetching orders', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch orders',
    });
  }
});

export default router;
