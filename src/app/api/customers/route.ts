import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { calculateLoanState } from '@/lib/financialMath';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim() || '';

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { cpf: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        loans: {
          include: {
            payments: {
              orderBy: { paymentDate: 'asc' },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const now = new Date();
    const result = customers.map((c) => {
      let totalBorrowed = 0;
      let totalPaid = 0;
      let currentDebt = 0;
      let activeLoansCount = 0;
      let overdueCount = 0;

      c.loans.forEach((l) => {
        totalBorrowed += l.originalAmount;
        const calc = calculateLoanState(l as any, now);
        totalPaid += calc.totalPaid;
        if (!calc.isPaid) {
          currentDebt += calc.totalUpdatedAmount;
          activeLoansCount++;
          if (calc.isOverdue) overdueCount++;
        }
      });

      return {
        id: c.id,
        name: c.name,
        cpf: c.cpf,
        phone: c.phone,
        email: c.email,
        address: c.address,
        notes: c.notes,
        createdAt: c.createdAt,
        totalLoans: c.loans.length,
        activeLoansCount,
        overdueCount,
        totalBorrowed,
        totalPaid,
        currentDebt,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing customers:', error);
    return NextResponse.json({ error: 'Erro ao listar clientes.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, cpf, phone, email, address, notes } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'O nome do cliente é obrigatório.' }, { status: 400 });
    }

    if (!phone || !phone.trim()) {
      return NextResponse.json({ error: 'O telefone / WhatsApp é obrigatório.' }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        cpf: cpf?.trim() || null,
        phone: phone.trim(),
        email: email?.trim() || null,
        address: address?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Erro ao cadastrar cliente.' }, { status: 500 });
  }
}
