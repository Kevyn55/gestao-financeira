import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';
import { generateWhatsAppReminder } from '@/lib/whatsapp';
import { parseDateSafe } from '@/lib/formatters';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const loan = await prisma.loan.findUnique({
      where: { id: params.id },
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

    const settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });

    const now = new Date();
    const calculated = calculateLoanState(loan as any, now);

    // Update database status if changed
    if (loan.status !== calculated.computedStatus) {
      await prisma.loan.update({
        where: { id: loan.id },
        data: { status: calculated.computedStatus },
      });
    }

    // Generate WhatsApp reminder link
    const whatsapp = generateWhatsAppReminder({
      customerName: loan.customer.name,
      customerPhone: loan.customer.phone,
      loanDescription: loan.description,
      dueDate: loan.dueDate,
      originalAmount: loan.originalAmount,
      totalUpdatedAmount: calculated.totalUpdatedAmount,
      interestAccrued: calculated.totalInterestRemaining,
      daysLate: calculated.daysLate,
      creditorName: settings?.creditorName || 'Gestor Financeiro',
      pixKey: settings?.creditorPixKey || '',
      pixType: settings?.creditorPixType || 'CHAVE_ALEATORIA',
      customTemplate: settings?.whatsappTemplate,
    });

    return NextResponse.json({
      ...loan,
      calculated,
      whatsapp,
      settings,
    });
  } catch (error) {
    console.error('Error getting loan details:', error);
    return NextResponse.json({ error: 'Erro ao carregar detalhes do empréstimo.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      originalAmount,
      loanDate,
      monthlyInterestRate,
      interestType,
      dueDate,
      billingDay,
      amortizationRule,
      incompleteMonthRule,
      description,
    } = body;

    const updated = await prisma.loan.update({
      where: { id: params.id },
      data: {
        originalAmount: Number(originalAmount),
        loanDate: parseDateSafe(loanDate),
        monthlyInterestRate: Number(monthlyInterestRate),
        interestType,
        dueDate: parseDateSafe(dueDate),
        billingDay: Number(billingDay) || 10,
        amortizationRule,
        incompleteMonthRule,
        description: description?.trim() || null,
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating loan:', error);
    return NextResponse.json({ error: 'Erro ao atualizar empréstimo.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.loan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Empréstimo excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting loan:', error);
    return NextResponse.json({ error: 'Erro ao excluir empréstimo.' }, { status: 500 });
  }
}

