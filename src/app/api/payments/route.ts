import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';
import { parseDateSafe } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const loanId = searchParams.get('loanId');
    const customerId = searchParams.get('customerId');

    const where: any = {};
    if (loanId) where.loanId = loanId;
    if (customerId) where.customerId = customerId;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        customer: true,
        loan: true,
      },
      orderBy: { paymentDate: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json({ error: 'Erro ao listar pagamentos.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loanId, paymentDate, amount, paymentMethod = 'PIX', notes } = body;

    if (!loanId) {
      return NextResponse.json({ error: 'O empréstimo é obrigatório.' }, { status: 400 });
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'O valor do pagamento deve ser maior que zero.' }, { status: 400 });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        payments: {
          orderBy: { paymentDate: 'asc' },
        },
      },
    });

    if (!loan) {
      return NextResponse.json({ error: 'Empréstimo não encontrado.' }, { status: 404 });
    }

    const pDate = parseDateSafe(paymentDate || new Date());

    // Generate unique receipt number: REC-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const paymentCount = await prisma.payment.count();
    const receiptNumber = `REC-${currentYear}-${String(paymentCount + 1).padStart(4, '0')}`;

    // Simulate calculation with this new payment added to loan
    const hypotheticalPayments = [
      ...loan.payments.map((p) => ({
        id: p.id,
        receiptNumber: p.receiptNumber,
        paymentDate: p.paymentDate,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        notes: p.notes,
      })),
      {
        id: 'new-temp',
        receiptNumber,
        paymentDate: pDate,
        amount: numAmount,
        paymentMethod,
        notes,
      },
    ];

    const calcResult = calculateLoanState(
      {
        ...loan,
        payments: hypotheticalPayments,
      },
      pDate
    );

    // Find the specific timeline event corresponding to this payment
    const paymentEvent = calcResult.timeline
      .filter((e) => e.type === 'PAYMENT')
      .slice(-1)[0];

    const principalPaid = paymentEvent?.principalPaid ?? 0;
    const interestPaid = paymentEvent?.interestPaid ?? 0;
    const remainingBalance = calcResult.totalUpdatedAmount;

    // Create the payment in DB
    const payment = await prisma.payment.create({
      data: {
        loanId: loan.id,
        customerId: loan.customerId,
        receiptNumber,
        paymentDate: pDate,
        amount: numAmount,
        principalPaid,
        interestPaid,
        remainingBalance,
        paymentMethod,
        notes: notes?.trim() || null,
      },
      include: {
        customer: true,
        loan: true,
      },
    });

    // Update loan status
    await prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: calcResult.computedStatus,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Error registering payment:', error);
    return NextResponse.json({ error: 'Erro ao registrar pagamento.' }, { status: 500 });
  }
}
