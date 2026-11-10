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
    const search = searchParams.get('search')?.trim();

    const where: any = {};
    if (customerId) where.customerId = customerId;

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { description: { contains: search } },
        { customer: { name: { contains: search } } },
      ];
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
    const result = loans.map((l) => {
      const calc = calculateLoanState(l as any, now);
      return {
        ...l,
        calculated: calc,
      };
    });

    // If status filter is applied, filter on the dynamically computed status
    let filtered = result;
    if (status && status !== 'ALL') {
      filtered = result.filter((l) => l.calculated.computedStatus === status);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Error fetching loans:', error);
    return NextResponse.json({ error: 'Erro ao listar empréstimos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      originalAmount,
      loanDate,
      monthlyInterestRate,
      interestType = 'COMPOUND',
      dueDate,
      billingDay = 10,
      amortizationRule = 'INTEREST_FIRST',
      incompleteMonthRule = 'PRO_RATA',
      description,
    } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Selecione o devedor vinculado.' }, { status: 400 });
    }

    const numAmount = Number(originalAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'O valor original do empréstimo deve ser maior que zero.' }, { status: 400 });
    }

    const numRate = Number(monthlyInterestRate);
    if (isNaN(numRate) || numRate < 0) {
      return NextResponse.json({ error: 'A taxa de juros mensal deve ser um número válido.' }, { status: 400 });
    }

    if (!loanDate) {
      return NextResponse.json({ error: 'A data do empréstimo é obrigatória.' }, { status: 400 });
    }

    if (!dueDate) {
      return NextResponse.json({ error: 'A data de vencimento prevista é obrigatória.' }, { status: 400 });
    }

    // Generate unique code: EMP-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await prisma.loan.count();
    const code = `EMP-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const loan = await prisma.loan.create({
      data: {
        code,
        customerId,
        originalAmount: numAmount,
        loanDate: parseDateSafe(loanDate),
        monthlyInterestRate: numRate,
        interestType: interestType === 'SIMPLE' ? 'SIMPLE' : 'COMPOUND',
        dueDate: parseDateSafe(dueDate),
        billingDay: Number(billingDay) || 10,
        amortizationRule: amortizationRule === 'PRINCIPAL_FIRST' ? 'PRINCIPAL_FIRST' : 'INTEREST_FIRST',
        incompleteMonthRule: incompleteMonthRule === 'FULL_MONTH' ? 'FULL_MONTH' : 'PRO_RATA',
        description: description?.trim() || null,
        status: 'OPEN',
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(loan, { status: 201 });
  } catch (error) {
    console.error('Error creating loan:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar empréstimo.' }, { status: 500 });
  }
}
