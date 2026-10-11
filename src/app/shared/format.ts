/** Formatação pt-BR usada nas telas do cliente. Valores vêm da API como número. */
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatBrl = (v: number | null | undefined): string => (v == null ? '–' : brl.format(v));

/** Decimal (0.242) → "24,2%" */
export const formatPercent = (v: number | null | undefined): string => (v == null || !isFinite(v) ? '–' : pct.format(v));

/** Valor já em pontos percentuais (1.63) → "1,63%" (tabela mensal) */
export const formatPoints = (v: number | null | undefined): string => (v == null ? '–' : `${pct2.format(v)}%`);

export const signed = (v: number): string => (v > 0 ? '+' : '') + formatBrl(v);

export const MONTHS_SHORT = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
export const MONTHS_LONG = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

/** Data de início para filtros locais a partir do enum de período. */
export function periodStart(period: string, now = new Date()): Date | null {
  const months = period === 'mes' ? 1 : period === '6m' ? 6 : period === 'ano' ? 12 : null;
  if (months === null) return null;
  return new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
}

/**
 * Data de hoje no fuso do navegador, em YYYY-MM-DD.
 * Nunca usar `new Date().toISOString().slice(0, 10)` para isso: toISOString é UTC,
 * e depois das 21h em Brasília já é o dia seguinte em UTC.
 */
export function todayLocalIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
