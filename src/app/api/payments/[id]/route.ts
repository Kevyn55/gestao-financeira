import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        loan: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Comprovante não encontrado.' }, { status: 404 });
    }

    const settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });

    return NextResponse.json({
      payment,
      settings,
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    return NextResponse.json({ error: 'Erro ao buscar comprovante.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { loan: true },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Pagamento não encontrado.' }, { status: 404 });
    }

    const loanId = payment.loanId;

    // Delete the payment
    await prisma.payment.delete({
      where: { id: params.id },
    });

    // Recalculate loan status without this payment
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { payments: true },
    });

    if (loan) {
      const calc = calculateLoanState(loan as any, new Date());
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: calc.computedStatus },
      });
    }

    return NextResponse.json({ success: true, message: 'Pagamento estornado com sucesso.' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json({ error: 'Erro ao estornar pagamento.' }, { status: 500 });
  }
}

