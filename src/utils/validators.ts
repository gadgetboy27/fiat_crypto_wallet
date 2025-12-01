import { z } from 'zod';

export const orderRequestSchema = z.object({
  cryptoSymbol: z.string().min(1).max(10).toUpperCase(),
  amountUSD: z.number().positive(),
  customerEmail: z.string().email(),
  walletAddress: z.string().min(10),
  paymentMethod: z.enum(['card', 'bank_transfer']).optional().default('card'),
});

export const priceQuoteSchema = z.object({
  cryptoSymbol: z.string().min(1).max(10).toUpperCase(),
  amountUSD: z.number().positive(),
});

export const walletAddressValidators: Record<string, (address: string) => boolean> = {
  BTC: (address: string) => /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/.test(address),
  ETH: (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address),
  USDT: (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address), // ERC-20
  USDC: (address: string) => /^0x[a-fA-F0-9]{40}$/.test(address), // ERC-20
  SOL: (address: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address),
  BNB: (address: string) => /^0x[a-fA-F0-9]{40}$|^bnb1[a-z0-9]{38}$/.test(address),
};

export function validateWalletAddress(cryptoSymbol: string, address: string): boolean {
  const validator = walletAddressValidators[cryptoSymbol];
  if (!validator) {
    return false;
  }
  return validator(address);
}
