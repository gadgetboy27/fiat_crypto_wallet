# API Usage Examples

This document provides practical examples of how to use the Fiat-to-Crypto Onramp API.

## Table of Contents

- [cURL Examples](#curl-examples)
- [JavaScript/TypeScript Examples](#javascripttypescript-examples)
- [Python Examples](#python-examples)
- [Integration Workflows](#integration-workflows)

## cURL Examples

### 1. Health Check

```bash
curl http://localhost:3000/health
```

### 2. Get All Cryptocurrency Prices

```bash
curl http://localhost:3000/api/crypto/prices
```

### 3. Get Specific Cryptocurrency Price

```bash
curl http://localhost:3000/api/crypto/prices/ETH
```

### 4. Get Supported Cryptocurrencies

```bash
curl http://localhost:3000/api/crypto/supported
```

### 5. Get Price Quote

```bash
curl -X POST http://localhost:3000/api/orders/quote \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoSymbol": "BTC",
    "amountUSD": 100
  }'
```

### 6. Create an Order

```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{
    "cryptoSymbol": "ETH",
    "amountUSD": 250,
    "customerEmail": "customer@example.com",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "paymentMethod": "card"
  }'
```

### 7. Get Order by ID

```bash
curl http://localhost:3000/api/orders/550e8400-e29b-41d4-a716-446655440000
```

### 8. Get All Orders (Requires API Key)

```bash
curl -H "X-API-Key: your_api_key" \
  http://localhost:3000/api/orders
```

### 9. Get Orders by Email (Requires API Key)

```bash
curl -H "X-API-Key: your_api_key" \
  http://localhost:3000/api/orders?email=customer@example.com
```

## JavaScript/TypeScript Examples

### Basic Integration

```typescript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

interface PriceQuote {
  cryptoSymbol: string;
  amountUSD: number;
  cryptoAmount: number;
  currentPrice: number;
  platformFee: number;
  totalCharge: number;
  expiresAt: string;
}

interface Order {
  id: string;
  cryptoSymbol: string;
  cryptoAmount: number;
  fiatAmount: number;
  platformFee: number;
  totalCharged: number;
  status: string;
  customerEmail: string;
  walletAddress: string;
  createdAt: string;
}

// Get cryptocurrency prices
async function getCryptoPrices() {
  try {
    const response = await axios.get(`${API_BASE}/crypto/prices`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching prices:', error);
    throw error;
  }
}

// Get price quote
async function getPriceQuote(
  cryptoSymbol: string,
  amountUSD: number
): Promise<PriceQuote> {
  try {
    const response = await axios.post(`${API_BASE}/orders/quote`, {
      cryptoSymbol,
      amountUSD,
    });
    return response.data.data;
  } catch (error: any) {
    console.error('Error getting quote:', error.response?.data || error);
    throw error;
  }
}

// Create order
async function createOrder(orderData: {
  cryptoSymbol: string;
  amountUSD: number;
  customerEmail: string;
  walletAddress: string;
  paymentMethod?: 'card' | 'bank_transfer';
}): Promise<{ order: Order; clientSecret: string }> {
  try {
    const response = await axios.post(`${API_BASE}/orders`, orderData);
    return response.data.data;
  } catch (error: any) {
    console.error('Error creating order:', error.response?.data || error);
    throw error;
  }
}

// Get order status
async function getOrderStatus(orderId: string): Promise<Order> {
  try {
    const response = await axios.get(`${API_BASE}/orders/${orderId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

// Example usage
async function purchaseBitcoin() {
  try {
    // Step 1: Get a quote
    console.log('Getting quote...');
    const quote = await getPriceQuote('BTC', 100);
    console.log('Quote:', quote);

    // Step 2: Show user the quote and get confirmation
    console.log(`You will receive ${quote.cryptoAmount} BTC`);
    console.log(`Total charge: $${quote.totalCharge}`);

    // Step 3: Create order
    console.log('Creating order...');
    const { order, clientSecret } = await createOrder({
      cryptoSymbol: 'BTC',
      amountUSD: 100,
      customerEmail: 'user@example.com',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      paymentMethod: 'card',
    });

    console.log('Order created:', order);
    console.log('Client secret for Stripe:', clientSecret);

    // Step 4: Use clientSecret with Stripe.js to complete payment
    // (See Stripe integration example below)

    return { order, clientSecret };
  } catch (error) {
    console.error('Purchase failed:', error);
    throw error;
  }
}
```

### Complete Stripe Integration (React)

```typescript
import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe('pk_test_your_publishable_key');

const API_BASE = 'http://localhost:3000/api';

function CheckoutForm({ clientSecret, orderId }: { clientSecret: string; orderId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-complete?orderId=${orderId}`,
      },
    });

    if (error) {
      setMessage(error.message || 'Payment failed');
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button disabled={!stripe || isProcessing}>
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
      {message && <div>{message}</div>}
    </form>
  );
}

function CryptoPurchase() {
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState('');
  const [quote, setQuote] = useState<any>(null);

  const getQuote = async (cryptoSymbol: string, amountUSD: number) => {
    const response = await axios.post(`${API_BASE}/orders/quote`, {
      cryptoSymbol,
      amountUSD,
    });
    setQuote(response.data.data);
  };

  const createOrder = async (
    cryptoSymbol: string,
    amountUSD: number,
    email: string,
    walletAddress: string
  ) => {
    const response = await axios.post(`${API_BASE}/orders`, {
      cryptoSymbol,
      amountUSD,
      customerEmail: email,
      walletAddress,
      paymentMethod: 'card',
    });

    const { order, clientSecret: secret } = response.data.data;
    setClientSecret(secret);
    setOrderId(order.id);
  };

  return (
    <div>
      <h1>Purchase Cryptocurrency</h1>

      {!clientSecret ? (
        <div>
          {/* Your purchase form */}
          <button onClick={() => createOrder('BTC', 100, 'user@example.com', 'bc1...')}>
            Buy Bitcoin
          </button>
        </div>
      ) : (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} orderId={orderId} />
        </Elements>
      )}
    </div>
  );
}

export default CryptoPurchase;
```

## Python Examples

```python
import requests
import json

API_BASE = 'http://localhost:3000/api'

def get_crypto_prices():
    """Get all cryptocurrency prices"""
    response = requests.get(f'{API_BASE}/crypto/prices')
    return response.json()

def get_price_quote(crypto_symbol, amount_usd):
    """Get a price quote"""
    response = requests.post(
        f'{API_BASE}/orders/quote',
        json={
            'cryptoSymbol': crypto_symbol,
            'amountUSD': amount_usd
        }
    )
    return response.json()

def create_order(crypto_symbol, amount_usd, email, wallet_address):
    """Create a new order"""
    response = requests.post(
        f'{API_BASE}/orders',
        json={
            'cryptoSymbol': crypto_symbol,
            'amountUSD': amount_usd,
            'customerEmail': email,
            'walletAddress': wallet_address,
            'paymentMethod': 'card'
        }
    )
    return response.json()

def get_order_status(order_id):
    """Get order status"""
    response = requests.get(f'{API_BASE}/orders/{order_id}')
    return response.json()

# Example usage
if __name__ == '__main__':
    # Get prices
    prices = get_crypto_prices()
    print('Current Prices:', json.dumps(prices, indent=2))

    # Get quote
    quote = get_price_quote('ETH', 500)
    print('Quote:', json.dumps(quote, indent=2))

    # Create order
    order_response = create_order(
        crypto_symbol='ETH',
        amount_usd=500,
        email='customer@example.com',
        wallet_address='0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    )
    print('Order:', json.dumps(order_response, indent=2))

    # Check order status
    if order_response['success']:
        order_id = order_response['data']['order']['id']
        status = get_order_status(order_id)
        print('Order Status:', json.dumps(status, indent=2))
```

## Integration Workflows

### Workflow 1: Simple Purchase Flow

```
1. User selects cryptocurrency and amount
   ↓
2. Frontend calls GET /api/crypto/prices/:symbol
   ↓
3. Display current price to user
   ↓
4. User enters wallet address and email
   ↓
5. Frontend calls POST /api/orders/quote
   ↓
6. Display total charge (including fees)
   ↓
7. User confirms purchase
   ↓
8. Frontend calls POST /api/orders
   ↓
9. Receive clientSecret from API
   ↓
10. Initialize Stripe payment with clientSecret
    ↓
11. User completes payment with Stripe
    ↓
12. Stripe sends webhook to /api/webhooks/stripe
    ↓
13. Order status updated to 'completed'
    ↓
14. User receives cryptocurrency (in production)
```

### Workflow 2: Price Monitoring

```typescript
// Monitor prices and alert on changes
async function monitorPrices(symbols: string[], threshold: number) {
  const previousPrices: Record<string, number> = {};

  setInterval(async () => {
    for (const symbol of symbols) {
      const response = await axios.get(`${API_BASE}/crypto/prices/${symbol}`);
      const currentPrice = response.data.data.priceUSD;

      if (previousPrices[symbol]) {
        const change = Math.abs(currentPrice - previousPrices[symbol]);
        const percentChange = (change / previousPrices[symbol]) * 100;

        if (percentChange > threshold) {
          console.log(`Alert: ${symbol} price changed by ${percentChange.toFixed(2)}%`);
          console.log(`Old: $${previousPrices[symbol]}, New: $${currentPrice}`);
        }
      }

      previousPrices[symbol] = currentPrice;
    }
  }, 60000); // Check every minute
}

// Monitor BTC and ETH for changes > 2%
monitorPrices(['BTC', 'ETH'], 2);
```

### Workflow 3: Batch Orders

```typescript
// Process multiple orders
async function processBatchOrders(orders: Array<{
  cryptoSymbol: string;
  amountUSD: number;
  customerEmail: string;
  walletAddress: string;
}>) {
  const results = [];

  for (const orderData of orders) {
    try {
      const result = await createOrder(orderData);
      results.push({ success: true, order: result.order });
    } catch (error) {
      results.push({ success: false, error, orderData });
    }
  }

  return results;
}
```

## Error Handling Examples

```typescript
async function robustOrderCreation(orderData: any) {
  try {
    const response = await axios.post(`${API_BASE}/orders`, orderData);
    return { success: true, data: response.data };
  } catch (error: any) {
    if (error.response) {
      // Server responded with error
      switch (error.response.status) {
        case 400:
          console.error('Validation error:', error.response.data.error);
          break;
        case 429:
          console.error('Rate limit exceeded. Please try again later.');
          break;
        case 500:
          console.error('Server error:', error.response.data.error);
          break;
        default:
          console.error('Unexpected error:', error.response.data);
      }
    } else if (error.request) {
      // Request made but no response
      console.error('No response from server. Check your connection.');
    } else {
      // Error setting up request
      console.error('Error:', error.message);
    }

    return { success: false, error: error.message };
  }
}
```

## Testing Examples

```typescript
// Simple test suite
describe('Crypto Onramp API', () => {
  test('should fetch crypto prices', async () => {
    const prices = await getCryptoPrices();
    expect(prices).toBeInstanceOf(Array);
    expect(prices.length).toBeGreaterThan(0);
    expect(prices[0]).toHaveProperty('symbol');
    expect(prices[0]).toHaveProperty('priceUSD');
  });

  test('should get price quote', async () => {
    const quote = await getPriceQuote('BTC', 100);
    expect(quote.cryptoSymbol).toBe('BTC');
    expect(quote.amountUSD).toBe(100);
    expect(quote.cryptoAmount).toBeGreaterThan(0);
    expect(quote.totalCharge).toBeGreaterThan(100); // includes fees
  });

  test('should create order', async () => {
    const { order } = await createOrder({
      cryptoSymbol: 'ETH',
      amountUSD: 100,
      customerEmail: 'test@example.com',
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    });

    expect(order.status).toBe('pending');
    expect(order.cryptoSymbol).toBe('ETH');
  });
});
```
