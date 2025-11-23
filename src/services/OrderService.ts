import { v4 as uuidv4 } from 'uuid';
import { Order, OrderRequest, PriceQuote } from '../types';
import { cryptoPriceService } from './CryptoPriceService';
import { stripeService } from './StripeService';
import { config } from '../config';
import { logger } from '../utils/logger';

class OrderService {
  // In-memory storage (replace with database in production)
  private orders: Map<string, Order> = new Map();

  async createPriceQuote(cryptoSymbol: string, amountUSD: number): Promise<PriceQuote> {
    // Validate amount
    if (amountUSD < config.fees.minTransactionUSD) {
      throw new Error(`Minimum transaction amount is $${config.fees.minTransactionUSD}`);
    }

    if (amountUSD > config.fees.maxTransactionUSD) {
      throw new Error(`Maximum transaction amount is $${config.fees.maxTransactionUSD}`);
    }

    // Check if crypto is supported
    if (!cryptoPriceService.isCryptoSupported(cryptoSymbol)) {
      throw new Error(`Cryptocurrency ${cryptoSymbol} is not supported`);
    }

    // Get current price
    const priceData = await cryptoPriceService.getPrice(cryptoSymbol);

    // Calculate fees and amounts
    const platformFee = amountUSD * (config.fees.platformFeePercent / 100);
    const totalCharge = amountUSD + platformFee;
    const cryptoAmount = cryptoPriceService.calculateCryptoAmount(priceData.priceUSD, amountUSD);

    // Quote expires in 2 minutes
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

    return {
      cryptoSymbol,
      amountUSD,
      cryptoAmount,
      currentPrice: priceData.priceUSD,
      platformFee,
      totalCharge,
      expiresAt,
    };
  }

  async createOrder(orderRequest: OrderRequest): Promise<{ order: Order; clientSecret: string }> {
    const { cryptoSymbol, amountUSD, customerEmail, walletAddress } = orderRequest;

    // Get fresh quote
    const quote = await this.createPriceQuote(cryptoSymbol, amountUSD);

    // Create order
    const orderId = uuidv4();
    const order: Order = {
      id: orderId,
      cryptoSymbol,
      cryptoAmount: quote.cryptoAmount,
      fiatAmount: amountUSD,
      priceAtPurchase: quote.currentPrice,
      platformFee: quote.platformFee,
      totalCharged: quote.totalCharge,
      customerEmail,
      walletAddress,
      status: 'pending',
      createdAt: new Date(),
    };

    // Create Stripe payment intent
    const paymentIntent = await stripeService.createPaymentIntent(
      quote.totalCharge,
      'usd',
      {
        orderId,
        cryptoSymbol,
        cryptoAmount: quote.cryptoAmount.toString(),
        walletAddress,
      }
    );

    order.stripePaymentIntentId = paymentIntent.id;

    // Store order
    this.orders.set(orderId, order);

    logger.info('Order created', {
      orderId,
      cryptoSymbol,
      amountUSD,
      totalCharge: quote.totalCharge,
    });

    return {
      order,
      clientSecret: paymentIntent.client_secret!,
    };
  }

  async getOrder(orderId: string): Promise<Order | undefined> {
    return this.orders.get(orderId);
  }

  async updateOrderStatus(
    orderId: string,
    status: Order['status'],
    completedAt?: Date
  ): Promise<Order> {
    const order = this.orders.get(orderId);

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    order.status = status;
    if (completedAt) {
      order.completedAt = completedAt;
    }

    this.orders.set(orderId, order);

    logger.info('Order status updated', { orderId, status });

    return order;
  }

  async processPaymentSuccess(paymentIntentId: string): Promise<Order> {
    // Find order by payment intent ID
    const order = Array.from(this.orders.values()).find(
      o => o.stripePaymentIntentId === paymentIntentId
    );

    if (!order) {
      throw new Error(`Order not found for payment intent ${paymentIntentId}`);
    }

    // Update order status
    await this.updateOrderStatus(order.id, 'processing');

    // In production, this would trigger:
    // 1. Blockchain transaction to send crypto to wallet
    // 2. Transaction confirmation monitoring
    // 3. Final order completion

    // For now, simulate immediate completion
    await this.updateOrderStatus(order.id, 'completed', new Date());

    logger.info('Payment processed successfully', {
      orderId: order.id,
      paymentIntentId,
    });

    return order;
  }

  async processPaymentFailure(paymentIntentId: string): Promise<Order> {
    const order = Array.from(this.orders.values()).find(
      o => o.stripePaymentIntentId === paymentIntentId
    );

    if (!order) {
      throw new Error(`Order not found for payment intent ${paymentIntentId}`);
    }

    await this.updateOrderStatus(order.id, 'failed');

    logger.warn('Payment failed', {
      orderId: order.id,
      paymentIntentId,
    });

    return order;
  }

  getAllOrders(): Order[] {
    return Array.from(this.orders.values());
  }

  getOrdersByEmail(email: string): Order[] {
    return Array.from(this.orders.values()).filter(
      order => order.customerEmail === email
    );
  }
}

export const orderService = new OrderService();
