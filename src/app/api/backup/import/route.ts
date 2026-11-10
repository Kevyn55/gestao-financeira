import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.data) {
      return NextResponse.json({ error: 'Arquivo de backup inválido.' }, { status: 400 });
    }

    const { settings, customers, loans, payments } = body.data;

    // Use Prisma transaction or sequential clean ups
    await prisma.$transaction(async (tx) => {
      // 1. Restore settings if present
      if (Array.isArray(settings) && settings.length > 0) {
        for (const s of settings) {
          await tx.systemSetting.upsert({
            where: { id: s.id },
            update: {
              systemName: s.systemName,
              creditorName: s.creditorName,
              creditorPixKey: s.creditorPixKey,
              creditorPixType: s.creditorPixType,
              defaultAmortization: s.defaultAmortization,
              defaultInterestType: s.defaultInterestType,
              incompleteMonthRule: s.incompleteMonthRule,
              whatsappTemplate: s.whatsappTemplate,
            },
            create: s,
          });
        }
      }

      // 2. Restore customers
      if (Array.isArray(customers)) {
        for (const c of customers) {
          await tx.customer.upsert({
            where: { id: c.id },
            update: {
              name: c.name,
              cpf: c.cpf,
              phone: c.phone,
              email: c.email,
              address: c.address,
              notes: c.notes,
            },
            create: {
              id: c.id,
              name: c.name,
              cpf: c.cpf,
              phone: c.phone,
              email: c.email,
              address: c.address,
              notes: c.notes,
              createdAt: new Date(c.createdAt),
            },
          });
        }
      }

      // 3. Restore loans
      if (Array.isArray(loans)) {
        for (const l of loans) {
          await tx.loan.upsert({
            where: { id: l.id },
            update: {
              customerId: l.customerId,
              code: l.code,
              originalAmount: l.originalAmount,
              loanDate: new Date(l.loanDate),
              monthlyInterestRate: l.monthlyInterestRate,
              interestType: l.interestType,
              dueDate: new Date(l.dueDate),
              billingDay: l.billingDay,
              amortizationRule: l.amortizationRule,
              incompleteMonthRule: l.incompleteMonthRule,
              description: l.description,
              status: l.status,
            },
            create: {
              id: l.id,
              customerId: l.customerId,
              code: l.code,
              originalAmount: l.originalAmount,
              loanDate: new Date(l.loanDate),
              monthlyInterestRate: l.monthlyInterestRate,
              interestType: l.interestType,
              dueDate: new Date(l.dueDate),
              billingDay: l.billingDay,
              amortizationRule: l.amortizationRule,
              incompleteMonthRule: l.incompleteMonthRule,
              description: l.description,
              status: l.status,
              createdAt: new Date(l.createdAt),
            },
          });
        }
      }

      // 4. Restore payments
      if (Array.isArray(payments)) {
        for (const p of payments) {
          await tx.payment.upsert({
            where: { id: p.id },
            update: {
              loanId: p.loanId,
              customerId: p.customerId,
              receiptNumber: p.receiptNumber,
              paymentDate: new Date(p.paymentDate),
              amount: p.amount,
              principalPaid: p.principalPaid,
              interestPaid: p.interestPaid,
              remainingBalance: p.remainingBalance,
              paymentMethod: p.paymentMethod,
              notes: p.notes,
            },
            create: {
              id: p.id,
              loanId: p.loanId,
              customerId: p.customerId,
              receiptNumber: p.receiptNumber,
              paymentDate: new Date(p.paymentDate),
              amount: p.amount,
              principalPaid: p.principalPaid,
              interestPaid: p.interestPaid,
              remainingBalance: p.remainingBalance,
              paymentMethod: p.paymentMethod,
              notes: p.notes,
              createdAt: new Date(p.createdAt),
            },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Backup restaurado com sucesso! Todos os dados foram atualizados.',
    });
  } catch (error) {
    console.error('Error importing backup:', error);
    return NextResponse.json({ error: 'Erro ao restaurar arquivo de backup.' }, { status: 500 });
  }
}

