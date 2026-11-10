import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';
import { ensureDefaultAdminAndSettings } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await ensureDefaultAdminAndSettings();

    const [loans, payments, customers, settings] = await Promise.all([
      prisma.loan.findMany({
        include: {
          customer: true,
          payments: {
            orderBy: { paymentDate: 'asc' },
          },
        },
      }),
      prisma.payment.findMany({
        orderBy: { paymentDate: 'desc' },
        take: 10,
        include: {
          customer: true,
          loan: true,
        },
      }),
      prisma.customer.findMany(),
      prisma.systemSetting.findUnique({ where: { id: 'default' } }),
    ]);

    const now = new Date();
    let totalEmprestado = 0;
    let totalRecebido = 0;
    let totalAReceber = 0;
    let totalJurosAcumulados = 0;
    let totalJurosRecebidos = 0;
    let dividasAtrasadasCount = 0;
    let previsaoRecebimentoMes = 0;

    const debtorSet = new Set<string>();
    const overdueLoansList: any[] = [];
    const upcomingLoansList: any[] = [];

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Map for monthly evolution chart (last 6 months)
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthlyDataMap = new Map<string, { month: string; emprestado: number; recebido: number; juros: number }>();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]}/${String(d.getFullYear()).slice(-2)}`;
      monthlyDataMap.set(key, { month: label, emprestado: 0, recebido: 0, juros: 0 });
    }

    // Process all loans
    for (const loan of loans) {
      totalEmprestado += loan.originalAmount;

      // Group loan date into evolution chart
      const lDate = new Date(loan.loanDate);
      const lKey = `${lDate.getFullYear()}-${String(lDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap.has(lKey)) {
        monthlyDataMap.get(lKey)!.emprestado += loan.originalAmount;
      }

      // Calculate state
      const calc = calculateLoanState(loan as any, now);
      totalJurosAcumulados += calc.totalInterestAccrued;
      totalRecebido += calc.totalPaid;
      totalJurosRecebidos += calc.totalInterestPaid;

      if (!calc.isPaid) {
        totalAReceber += calc.totalUpdatedAmount;
        debtorSet.add(loan.customerId);

        // Previsão de recebimentos do mês
        const dueDate = new Date(loan.dueDate);
        if (dueDate.getFullYear() === currentYear && dueDate.getMonth() === currentMonth) {
          previsaoRecebimentoMes += calc.totalUpdatedAmount;
        } else {
          // ou soma os juros previstos do mês atual
          previsaoRecebimentoMes += calc.currentMonthInterest;
        }

        if (calc.isOverdue) {
          dividasAtrasadasCount++;
          overdueLoansList.push({
            id: loan.id,
            code: loan.code,
            customerName: loan.customer.name,
            customerPhone: loan.customer.phone,
            originalAmount: loan.originalAmount,
            totalUpdatedAmount: calc.totalUpdatedAmount,
            interestAccrued: calc.totalInterestRemaining,
            dueDate: loan.dueDate,
            daysLate: calc.daysLate,
            monthsLate: calc.monthsLate,
            monthlyInterestRate: loan.monthlyInterestRate,
            interestType: loan.interestType,
            description: loan.description,
          });
        } else {
          // Check if due within next 7 days
          const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 0 && diffDays <= 7) {
            upcomingLoansList.push({
              id: loan.id,
              code: loan.code,
              customerName: loan.customer.name,
              customerPhone: loan.customer.phone,
              originalAmount: loan.originalAmount,
              totalUpdatedAmount: calc.totalUpdatedAmount,
              interestAccrued: calc.totalInterestRemaining,
              dueDate: loan.dueDate,
              daysRemaining: diffDays,
              description: loan.description,
            });
          }
        }
      }
    }

    // Process payments for evolution chart
    for (const p of payments) {
      const pDate = new Date(p.paymentDate);
      const pKey = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyDataMap.has(pKey)) {
        monthlyDataMap.get(pKey)!.recebido += p.amount;
        monthlyDataMap.get(pKey)!.juros += p.interestPaid;
      }
    }

    const evolucaoMensal = Array.from(monthlyDataMap.values());

    return NextResponse.json({
      metrics: {
        totalEmprestado,
        totalRecebido,
        totalAReceber,
        totalJurosAcumulados,
        totalJurosRecebidos,
        devedoresEmAbertoCount: debtorSet.size,
        totalDevedoresCount: customers.length,
        dividasAtrasadasCount,
        previsaoRecebimentoMes,
        totalEmprestimos: loans.length,
      },
      evolucaoMensal,
      ultimosPagamentos: payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate,
        amount: p.amount,
        principalPaid: p.principalPaid,
        interestPaid: p.interestPaid,
        paymentMethod: p.paymentMethod,
        customerName: p.customer.name,
        loanCode: p.loan.code,
      })),
      emprestimosAtrasados: overdueLoansList.sort((a, b) => b.daysLate - a.daysLate),
      vencimentosProximos: upcomingLoansList.sort((a, b) => a.daysRemaining - b.daysRemaining),
      settings,
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados do dashboard.' }, { status: 500 });
  }
}
