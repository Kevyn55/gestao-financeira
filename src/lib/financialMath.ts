import Decimal from 'decimal.js';
import { parseDateSafe } from './formatters';

// Configure high precision for Decimal operations
Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });

export type InterestType = 'SIMPLE' | 'COMPOUND';
export type AmortizationRule = 'INTEREST_FIRST' | 'PRINCIPAL_FIRST';
export type IncompleteMonthRule = 'PRO_RATA' | 'FULL_MONTH';

export interface PaymentInput {
  id: string;
  receiptNumber?: string;
  paymentDate: Date | string;
  amount: number;
  paymentMethod?: string;
  notes?: string | null;
}

export interface LoanInput {
  id?: string;
  code?: string;
  originalAmount: number;
  loanDate: Date | string;
  monthlyInterestRate: number; // e.g. 5 for 5%
  interestType: InterestType | string;
  dueDate: Date | string;
  billingDay?: number;
  amortizationRule?: AmortizationRule | string;
  incompleteMonthRule?: IncompleteMonthRule | string;
  payments?: PaymentInput[];
}

export interface TimelineEvent {
  date: Date;
  type: 'INITIAL' | 'INTEREST_ACCRUAL' | 'PAYMENT' | 'CURRENT_STATUS';
  description: string;
  principalBase: number;
  interestRate: number;
  elapsedMonths: number;
  elapsedDays: number;
  interestAccrued: number;
  paymentAmount?: number;
  principalPaid?: number;
  interestPaid?: number;
  principalRemaining: number;
  interestRemaining: number;
  totalUpdatedAmount: number;
  receiptNumber?: string;
  paymentMethod?: string;
}

export interface LoanCalculationResult {
  originalAmount: number;
  monthlyInterestRate: number;
  interestType: InterestType;
  amortizationRule: AmortizationRule;
  incompleteMonthRule: IncompleteMonthRule;
  totalPaid: number;
  totalPrincipalPaid: number;
  totalInterestPaid: number;
  totalPrincipalRemaining: number;
  totalInterestRemaining: number;
  totalUpdatedAmount: number;
  totalInterestAccrued: number;
  currentMonthInterest: number;
  daysLate: number;
  monthsLate: number;
  isOverdue: boolean;
  isPaid: boolean;
  computedStatus: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  timeline: TimelineEvent[];
}

/**
 * Calculates time in months between two dates with high precision.
 */
export function calculateElapsedMonths(
  startDate: Date | string,
  endDate: Date | string,
  rule: IncompleteMonthRule = 'PRO_RATA'
): { fullMonths: number; remainingDays: number; totalMonthsDecimal: Decimal } {
  const start = parseDateSafe(startDate);
  const end = parseDateSafe(endDate);

  if (end <= start) {
    return { fullMonths: 0, remainingDays: 0, totalMonthsDecimal: new Decimal(0) };
  }

  // Exact calendar difference
  let fullMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  
  // Create reference date for full month check
  const refDate = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + fullMonths, start.getUTCDate(), 12, 0, 0));

  if (refDate > end) {
    fullMonths--;
    refDate.setUTCMonth(refDate.getUTCMonth() - 1);
  }

  // Remaining days after full months
  const diffTime = end.getTime() - refDate.getTime();
  const remainingDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  let totalMonthsDecimal: Decimal;

  if (rule === 'FULL_MONTH') {
    const total = remainingDays > 0 ? fullMonths + 1 : fullMonths;
    totalMonthsDecimal = new Decimal(total);
  } else {
    // Commercial month of 30 days standard for pro-rata die
    const fraction = new Decimal(remainingDays).dividedBy(30);
    totalMonthsDecimal = new Decimal(fullMonths).plus(fraction);
  }

  return { fullMonths, remainingDays, totalMonthsDecimal };
}

/**
 * Calculates interest on a given principal over a specified duration.
 * Simple: J = C * i * t
 * Compound: M = C * (1 + i)^t, J = M - C
 */
export function calculateInterest(
  principal: Decimal,
  monthlyRateDecimal: Decimal, // e.g. 0.05 for 5%
  durationInMonths: Decimal,
  type: InterestType
): { interest: Decimal; amount: Decimal } {
  if (principal.isZero() || durationInMonths.isZero() || monthlyRateDecimal.isZero()) {
    return { interest: new Decimal(0), amount: principal };
  }

  if (type === 'SIMPLE') {
    // J = C * i * t
    const interest = principal.times(monthlyRateDecimal).times(durationInMonths);
    const amount = principal.plus(interest);
    return { interest, amount };
  } else {
    // Compound interest: M = C * (1 + i)^t
    const onePlusI = new Decimal(1).plus(monthlyRateDecimal);
    const multiplier = onePlusI.pow(durationInMonths);
    const amount = principal.times(multiplier);
    const interest = amount.minus(principal);
    return { interest, amount };
  }
}

/**
 * Core engine: evaluates loan chronologically, applying payments, amortizing according to
 * legal / contractual rules, and avoiding any duplicate interest or interest on paid amounts.
 */
export function calculateLoanState(
  loan: LoanInput,
  asOfDate: Date | string = new Date()
): LoanCalculationResult {
  const asOf = parseDateSafe(asOfDate);
  const loanDate = parseDateSafe(loan.loanDate);
  const dueDate = parseDateSafe(loan.dueDate);

  const interestType: InterestType = loan.interestType === 'SIMPLE' ? 'SIMPLE' : 'COMPOUND';
  const amortizationRule: AmortizationRule =
    loan.amortizationRule === 'PRINCIPAL_FIRST' ? 'PRINCIPAL_FIRST' : 'INTEREST_FIRST';
  const incompleteMonthRule: IncompleteMonthRule =
    loan.incompleteMonthRule === 'FULL_MONTH' ? 'FULL_MONTH' : 'PRO_RATA';

  const monthlyRateDecimal = new Decimal(loan.monthlyInterestRate).dividedBy(100);

  // Initial state
  let currentPrincipal = new Decimal(loan.originalAmount);
  let pendingInterest = new Decimal(0);
  let totalInterestAccrued = new Decimal(0);
  let totalPaid = new Decimal(0);
  let totalPrincipalPaid = new Decimal(0);
  let totalInterestPaid = new Decimal(0);

  const timeline: TimelineEvent[] = [];

  // Record initial event
  timeline.push({
    date: loanDate,
    type: 'INITIAL',
    description: 'Empréstimo Concedido / Capital Inicial',
    principalBase: currentPrincipal.toNumber(),
    interestRate: loan.monthlyInterestRate,
    elapsedMonths: 0,
    elapsedDays: 0,
    interestAccrued: 0,
    principalRemaining: currentPrincipal.toNumber(),
    interestRemaining: 0,
    totalUpdatedAmount: currentPrincipal.toNumber(),
  });

  // Sort payments chronologically
  const sortedPayments = [...(loan.payments || [])]
    .map((p) => ({
      ...p,
      parsedDate: parseDateSafe(p.paymentDate),
    }))
    .filter((p) => p.parsedDate >= loanDate)
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime());

  let lastCheckpointDate = loanDate;

  // Process each payment chronologically
  for (const payment of sortedPayments) {
    if (payment.parsedDate > asOf) {
      break; // ignore future payments beyond asOf
    }

    // 1. Accrue interest from lastCheckpointDate to payment date on current principal
    if (payment.parsedDate > lastCheckpointDate && currentPrincipal.greaterThan(0.001)) {
      const { fullMonths, remainingDays, totalMonthsDecimal } = calculateElapsedMonths(
        lastCheckpointDate,
        payment.parsedDate,
        incompleteMonthRule
      );

      if (totalMonthsDecimal.greaterThan(0)) {
        const { interest: periodInterest } = calculateInterest(
          currentPrincipal,
          monthlyRateDecimal,
          totalMonthsDecimal,
          interestType
        );

        pendingInterest = pendingInterest.plus(periodInterest);
        totalInterestAccrued = totalInterestAccrued.plus(periodInterest);

        timeline.push({
          date: payment.parsedDate,
          type: 'INTEREST_ACCRUAL',
          description: `Juros acumulados até o pagamento (${fullMonths}m ${remainingDays}d)`,
          principalBase: currentPrincipal.toNumber(),
          interestRate: loan.monthlyInterestRate,
          elapsedMonths: fullMonths,
          elapsedDays: remainingDays,
          interestAccrued: periodInterest.toNumber(),
          principalRemaining: currentPrincipal.toNumber(),
          interestRemaining: pendingInterest.toNumber(),
          totalUpdatedAmount: currentPrincipal.plus(pendingInterest).toNumber(),
        });
      }
    }

    // 2. Apply payment amortization
    const paymentAmount = new Decimal(payment.amount);
    totalPaid = totalPaid.plus(paymentAmount);

    let principalPaid = new Decimal(0);
    let interestPaid = new Decimal(0);

    if (amortizationRule === 'INTEREST_FIRST') {
      // Art. 354 CC: Amortize accrued interest first
      if (paymentAmount.lessThanOrEqualTo(pendingInterest)) {
        interestPaid = paymentAmount;
        principalPaid = new Decimal(0);
        pendingInterest = pendingInterest.minus(paymentAmount);
      } else {
        interestPaid = pendingInterest;
        const remainder = paymentAmount.minus(pendingInterest);
        pendingInterest = new Decimal(0);

        if (remainder.lessThanOrEqualTo(currentPrincipal)) {
          principalPaid = remainder;
          currentPrincipal = currentPrincipal.minus(remainder);
        } else {
          // Overpayment or exact payoff
          principalPaid = currentPrincipal;
          currentPrincipal = new Decimal(0);
        }
      }
    } else {
      // PRINCIPAL_FIRST: Amortize principal first to quickly lower interest base
      if (paymentAmount.lessThanOrEqualTo(currentPrincipal)) {
        principalPaid = paymentAmount;
        interestPaid = new Decimal(0);
        currentPrincipal = currentPrincipal.minus(paymentAmount);
      } else {
        principalPaid = currentPrincipal;
        const remainder = paymentAmount.minus(currentPrincipal);
        currentPrincipal = new Decimal(0);

        if (remainder.lessThanOrEqualTo(pendingInterest)) {
          interestPaid = remainder;
          pendingInterest = pendingInterest.minus(remainder);
        } else {
          interestPaid = pendingInterest;
          pendingInterest = new Decimal(0);
        }
      }
    }

    totalPrincipalPaid = totalPrincipalPaid.plus(principalPaid);
    totalInterestPaid = totalInterestPaid.plus(interestPaid);

    timeline.push({
      date: payment.parsedDate,
      type: 'PAYMENT',
      description: `Pagamento recebido via ${payment.paymentMethod || 'PIX'} (${payment.receiptNumber || 'Comprovante'})`,
      principalBase: currentPrincipal.toNumber(),
      interestRate: loan.monthlyInterestRate,
      elapsedMonths: 0,
      elapsedDays: 0,
      interestAccrued: 0,
      paymentAmount: paymentAmount.toNumber(),
      principalPaid: principalPaid.toNumber(),
      interestPaid: interestPaid.toNumber(),
      principalRemaining: currentPrincipal.toNumber(),
      interestRemaining: pendingInterest.toNumber(),
      totalUpdatedAmount: currentPrincipal.plus(pendingInterest).toNumber(),
      receiptNumber: payment.receiptNumber,
      paymentMethod: payment.paymentMethod,
    });

    lastCheckpointDate = payment.parsedDate;

    // If completely paid off, stop further interest
    if (currentPrincipal.lessThanOrEqualTo(0.001) && pendingInterest.lessThanOrEqualTo(0.001)) {
      currentPrincipal = new Decimal(0);
      pendingInterest = new Decimal(0);
      break;
    }
  }

  // 3. Accrue interest from last payment/checkpoint to asOfDate if principal remains
  if (asOf > lastCheckpointDate && currentPrincipal.greaterThan(0.001)) {
    const { fullMonths, remainingDays, totalMonthsDecimal } = calculateElapsedMonths(
      lastCheckpointDate,
      asOf,
      incompleteMonthRule
    );

    if (totalMonthsDecimal.greaterThan(0)) {
      const { interest: periodInterest } = calculateInterest(
        currentPrincipal,
        monthlyRateDecimal,
        totalMonthsDecimal,
        interestType
      );

      pendingInterest = pendingInterest.plus(periodInterest);
      totalInterestAccrued = totalInterestAccrued.plus(periodInterest);

      timeline.push({
        date: asOf,
        type: 'INTEREST_ACCRUAL',
        description: `Juros atualizados até hoje (${fullMonths}m ${remainingDays}d)`,
        principalBase: currentPrincipal.toNumber(),
        interestRate: loan.monthlyInterestRate,
        elapsedMonths: fullMonths,
        elapsedDays: remainingDays,
        interestAccrued: periodInterest.toNumber(),
        principalRemaining: currentPrincipal.toNumber(),
        interestRemaining: pendingInterest.toNumber(),
        totalUpdatedAmount: currentPrincipal.plus(pendingInterest).toNumber(),
      });
    }
  }

  // Clean precision for zero threshold
  if (currentPrincipal.lessThan(0.001)) currentPrincipal = new Decimal(0);
  if (pendingInterest.lessThan(0.001)) pendingInterest = new Decimal(0);

  const totalUpdatedAmount = currentPrincipal.plus(pendingInterest);

  // Interest generated specifically in the current calendar month cycle
  const currentMonthInterest = currentPrincipal.greaterThan(0)
    ? currentPrincipal.times(monthlyRateDecimal).toNumber()
    : 0;

  // Overdue calculations
  let daysLate = 0;
  let monthsLate = 0;
  let isOverdue = false;

  const isPaid = totalUpdatedAmount.lessThanOrEqualTo(0.01);

  if (!isPaid && asOf > dueDate) {
    const diffMs = asOf.getTime() - dueDate.getTime();
    daysLate = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    monthsLate = Math.floor(daysLate / 30);
    isOverdue = true;
  }

  // Status computation
  let computedStatus: 'OPEN' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' = 'OPEN';
  if (isPaid) {
    computedStatus = 'PAID';
  } else if (isOverdue) {
    computedStatus = 'OVERDUE';
  } else if (totalPaid.greaterThan(0)) {
    computedStatus = 'PARTIALLY_PAID';
  } else {
    computedStatus = 'OPEN';
  }

  return {
    originalAmount: new Decimal(loan.originalAmount).toNumber(),
    monthlyInterestRate: loan.monthlyInterestRate,
    interestType,
    amortizationRule,
    incompleteMonthRule,
    totalPaid: totalPaid.toNumber(),
    totalPrincipalPaid: totalPrincipalPaid.toNumber(),
    totalInterestPaid: totalInterestPaid.toNumber(),
    totalPrincipalRemaining: currentPrincipal.toNumber(),
    totalInterestRemaining: pendingInterest.toNumber(),
    totalUpdatedAmount: totalUpdatedAmount.toNumber(),
    totalInterestAccrued: totalInterestAccrued.toNumber(),
    currentMonthInterest,
    daysLate,
    monthsLate,
    isOverdue,
    isPaid,
    computedStatus,
    timeline,
  };
}
