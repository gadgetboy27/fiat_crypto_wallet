import { Router, Request, Response } from 'express';
import { stripeService } from '../services/StripeService';
import { orderService } from '../services/OrderService';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

const router = Router();

// POST /api/webhooks/stripe - Handle Stripe webhooks
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    res.status(400).json({
      success: false,
      error: 'Missing stripe-signature header',
    });
    return;
  }

  try {
    const event = stripeService.constructWebhookEvent(
      req.body,
      signature
    );

    logger.info('Webhook received', { type: event.type, id: event.id });

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        logger.debug('Unhandled webhook event type', { type: event.type });
    }

    res.json({ success: true, received: true });
  } catch (error: any) {
    logger.error('Webhook error', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    await orderService.processPaymentSuccess(paymentIntent.id);
    logger.info('Payment succeeded', { paymentIntentId: paymentIntent.id });
  } catch (error) {
    logger.error('Error processing payment success', { error, paymentIntentId: paymentIntent.id });
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    await orderService.processPaymentFailure(paymentIntent.id);
    logger.warn('Payment failed', { paymentIntentId: paymentIntent.id });
  } catch (error) {
    logger.error('Error processing payment failure', { error, paymentIntentId: paymentIntent.id });
  }
}

async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    await orderService.processPaymentFailure(paymentIntent.id);
    logger.info('Payment canceled', { paymentIntentId: paymentIntent.id });
  } catch (error) {
    logger.error('Error processing payment cancellation', { error, paymentIntentId: paymentIntent.id });
  }
}

async function handleRefund(charge: Stripe.Charge): Promise<void> {
  logger.info('Refund processed', { chargeId: charge.id, amount: charge.amount_refunded });
  // Additional refund handling logic here
}

export default router;
