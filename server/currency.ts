import { db } from './db.js';
import type { SubscriptionPlan } from './types.js';

/**
 * The ledger holds a single running balance per owner with no per-currency
 * separation, so every credit and debit has to be denominated in one currency.
 * That currency is the platform default; anything else would silently add
 * shillings to dollars.
 */
export function getPlatformCurrency(): string {
  return (db.settings.get().defaultCurrency || 'USD').toUpperCase();
}

export const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'TZS', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
]);

export function roundMoney(value: number, currency: string): number {
  if (!Number.isFinite(value)) return 0;
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(value)
    : Math.round(value * 100) / 100;
}

/**
 * Plans carry both a TZS and a USD price. Charging the USD figure while the
 * ledger is denominated in TZS credited a 19 unit balance for a 47,500 shilling
 * subscription, so the price has to follow the platform currency.
 */
export function getPlanPrice(plan: SubscriptionPlan, billingInterval: 'MONTHLY' | 'ANNUAL'): number {
  const currency = getPlatformCurrency();
  const annual = currency === 'TZS' ? plan.annualPriceTzs : plan.annualPriceUsd;
  const monthly = currency === 'TZS' ? plan.monthlyPriceTzs : plan.monthlyPriceUsd;
  return (billingInterval === 'ANNUAL' ? annual : monthly) ?? 0;
}
