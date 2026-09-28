export function formatCurrencyDraft(value: string, supportsDecimals: boolean): string {
  const normalized = value.replace(/[^\d,]/g, '');
  const decimalIndex = supportsDecimals ? normalized.indexOf(',') : -1;
  const rawIntegerPart = (decimalIndex >= 0 ? normalized.slice(0, decimalIndex) : normalized).replace(/\D/g, '');
  const integerPart = rawIntegerPart.replace(/^0+(?=\d)/, '');
  const fractionPart = decimalIndex >= 0
    ? normalized.slice(decimalIndex + 1).replace(/\D/g, '').slice(0, 2)
    : '';
  const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (!groupedInteger && decimalIndex < 0) return '';
  return `${groupedInteger || '0'}${decimalIndex >= 0 ? `,${fractionPart}` : ''}`;
}

export function parseCurrencyInput(value: string): number {
  const parsed = Number(value.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatNumberInput(value: number, supportsDecimals: boolean): string {
  if (!value) return '';
  return new Intl.NumberFormat('id-ID', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: supportsDecimals ? 2 : 0,
  }).format(value);
}