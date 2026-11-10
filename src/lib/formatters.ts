/**
 * Normalizes any date input (string YYYY-MM-DD, ISO string, or Date object)
 * to a clean UTC Date at noon (12:00:00) to prevent timezone shifts (e.g. UTC-3 in Brazil).
 */
export function parseDateSafe(input: Date | string | number | undefined | null): Date {
  if (!input) return new Date();
  
  if (typeof input === 'string') {
    // If it's a date-only string like "2026-05-15"
    if (/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) {
      const [year, month, day] = input.trim().split('-').map(Number);
      return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    }
  }

  const d = new Date(input);
  if (isNaN(d.getTime())) return new Date();

  // Return UTC noon to prevent date jump across timezones
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

/**
 * Formats a number to Brazilian Real (R$ 1.250,50)
 */
export function formatCurrency(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  if (isNaN(num)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Parses user currency input "1.250,50" or "R$ 1.250,50" to number 1250.50
 */
export function parseCurrencyInput(value: string | number | undefined | null): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') return value;

  const cleaned = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a date to DD/MM/YYYY
 */
export function formatDate(input: Date | string | undefined | null): string {
  if (!input) return '-';
  const d = parseDateSafe(input);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formats a date to YYYY-MM-DD for HTML input[type="date"]
 */
export function formatDateForInput(input: Date | string | undefined | null): string {
  if (!input) return '';
  const d = parseDateSafe(input);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${year}-${month}-${day}`;
}

/**
 * Formats a percentage value (e.g. 5.5 -> "5,50%")
 */
export function formatPercent(value: number | undefined | null): string {
  const num = value ?? 0;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num) + '%';
}

/**
 * Formats CPF: 000.000.000-00
 */
export function formatCPF(cpf: string | undefined | null): string {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 3) return clean;
  if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
  if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
  return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9, 11)}`;
}

/**
 * Formats Phone: (00) 00000-0000 or (00) 0000-0000
 */
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '').slice(0, 11);
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
}

/**
 * Strips all non-digit characters
 */
export function cleanDigits(value: string | undefined | null): string {
  if (!value) return '';
  return value.replace(/\D/g, '');
}

