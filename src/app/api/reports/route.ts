import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';
import { parseDateSafe } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const status = searchParams.get('status');
    const interestType = searchParams.get('interestType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {};
    if (customerId && customerId !== 'ALL') where.customerId = customerId;
    if (interestType && interestType !== 'ALL') where.interestType = interestType;

    if (startDate || endDate) {
      where.loanDate = {};
      if (startDate) where.loanDate.gte = parseDateSafe(startDate);
      if (endDate) {
        const end = parseDateSafe(endDate);
        end.setUTCHours(23, 59, 59, 999);
        where.loanDate.lte = end;
      }
    }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        customer: true,
        payments: {
          orderBy: { paymentDate: 'asc' },
        },
      },
      orderBy: { loanDate: 'desc' },
    });

    const now = new Date();
    let totalEmprestado = 0;
    let totalRecebido = 0;
    let totalPrincipalRecuperado = 0;
    let totalJurosRecebidos = 0;
    let totalSaldoDevedorRestante = 0;
    let totalJurosPendentes = 0;

    const list = loans
      .map((l) => {
        const calc = calculateLoanState(l as any, now);
        return {
          id: l.id,
          code: l.code,
          customerName: l.customer.name,
          customerCpf: l.customer.cpf,
          customerPhone: l.customer.phone,
          originalAmount: l.originalAmount,
          loanDate: l.loanDate,
          dueDate: l.dueDate,
          monthlyInterestRate: l.monthlyInterestRate,
          interestType: l.interestType,
          amortizationRule: l.amortizationRule,
          description: l.description,
          calculated: calc,
        };
      })
      .filter((item) => {
        if (!status || status === 'ALL') return true;
        return item.calculated.computedStatus === status;
      });

    for (const item of list) {
      totalEmprestado += item.originalAmount;
      totalRecebido += item.calculated.totalPaid;
      totalPrincipalRecuperado += item.calculated.totalPrincipalPaid;
      totalJurosRecebidos += item.calculated.totalInterestPaid;
      if (!item.calculated.isPaid) {
        totalSaldoDevedorRestante += item.calculated.totalUpdatedAmount;
        totalJurosPendentes += item.calculated.totalInterestRemaining;
      }
    }

    return NextResponse.json({
      summary: {
        totalEmprestado,
        totalRecebido,
        totalPrincipalRecuperado,
        totalJurosRecebidos,
        totalSaldoDevedorRestante,
        totalJurosPendentes,
        quantidadeOperacoes: list.length,
      },
      records: list,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ error: 'Erro ao gerar relatório financeiro.' }, { status: 500 });
  }
}
