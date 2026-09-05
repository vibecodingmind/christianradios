export type SupportedCurrency = 'USD';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  rateVsTzs: number;
}

export const TOP_5_CURRENCIES: CurrencyInfo[] = [
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🌐',
    rateVsTzs: 1,
  },
];

export function formatPrice(amount: number, _targetCurrency?: string): string {
  if (amount === 0) return 'FREE';
  return `$${Number(amount).toLocaleString()}`;
}
