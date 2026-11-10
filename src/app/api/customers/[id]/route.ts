import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        loans: {
          include: {
            payments: {
              orderBy: { paymentDate: 'asc' },
            },
          },
          orderBy: { loanDate: 'desc' },
        },
        payments: {
          orderBy: { paymentDate: 'desc' },
          include: {
            loan: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    const now = new Date();
    let totalBorrowed = 0;
    let totalPaid = 0;
    let totalDebtRemaining = 0;
    let totalInterestAccrued = 0;

    const calculatedLoans = customer.loans.map((l) => {
      totalBorrowed += l.originalAmount;
      const calc = calculateLoanState(l as any, now);
      totalPaid += calc.totalPaid;
      totalInterestAccrued += calc.totalInterestAccrued;
      if (!calc.isPaid) {
        totalDebtRemaining += calc.totalUpdatedAmount;
      }

      return {
        ...l,
        calculated: calc,
      };
    });

    return NextResponse.json({
      customer: {
        id: customer.id,
        name: customer.name,
        cpf: customer.cpf,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        notes: customer.notes,
        createdAt: customer.createdAt,
      },
      stats: {
        totalBorrowed,
        totalPaid,
        totalDebtRemaining,
        totalInterestAccrued,
        totalLoans: customer.loans.length,
      },
      loans: calculatedLoans,
      payments: customer.payments,
    });
  } catch (error) {
    console.error('Error fetching customer details:', error);
    return NextResponse.json({ error: 'Erro ao buscar detalhes do cliente.' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, cpf, phone, email, address, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome é obrigatório.' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'O telefone é obrigatório.' }, { status: 400 });
    }

    const updated = await prisma.customer.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        cpf: cpf?.trim() || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Erro ao atualizar dados do cliente.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        loans: {
          include: { payments: true },
        },
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }

    // Check if there is active unpaid debt
    const now = new Date();
    const hasUnpaid = customer.loans.some((l) => {
      const calc = calculateLoanState(l as any, now);
      return !calc.isPaid;
    });

    if (hasUnpaid) {
      return NextResponse.json(
        { error: 'Não é possível excluir este cliente pois ele possui empréstimos com saldo em aberto pendente.' },
        { status: 400 }
      );
    }

    await prisma.customer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Cliente excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Erro ao excluir cliente.' }, { status: 500 });
  }
}

