export type SupportedCurrency = 'TZS' | 'USD' | 'EUR' | 'GBP' | 'KES';

export interface CurrencyInfo {
  code: SupportedCurrency;
  symbol: string;
  name: string;
  flag: string;
  rateVsTzs: number; // TZS conversion rate multiplier
}

export const TOP_5_CURRENCIES: CurrencyInfo[] = [
  {
    code: 'TZS',
    symbol: 'TZS',
    name: 'Tanzanian Shilling',
    flag: '🇹🇿',
    rateVsTzs: 1,
  },
  {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    flag: '🌐',
    rateVsTzs: 2600,
  },
  {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    flag: '🇪🇺',
    rateVsTzs: 2800,
  },
  {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    flag: '🇬🇧',
    rateVsTzs: 3300,
  },
  {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    flag: '🇰🇪',
    rateVsTzs: 20,
  },
];

export function formatPrice(amountInTzs: number, targetCurrency: SupportedCurrency): string {
  const currency = TOP_5_CURRENCIES.find((c) => c.code === targetCurrency) || TOP_5_CURRENCIES[0];

  if (amountInTzs === 0) return 'FREE';

  if (targetCurrency === 'TZS') {
    return `TZS ${amountInTzs.toLocaleString()}`;
  }

  const converted = amountInTzs / currency.rateVsTzs;
  const rounded = converted >= 100 ? Math.round(converted) : Number(converted.toFixed(2));

  return `${currency.symbol}${rounded.toLocaleString()}`;
}
