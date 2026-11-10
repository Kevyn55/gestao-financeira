import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, comparePassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let settings = await prisma.systemSetting.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.systemSetting.create({
        data: {
          id: 'default',
          systemName: 'Gestão Financeira & Dívidas',
          creditorName: 'Minha Empresa / Gestor',
          creditorPixKey: 'financeiro@empresa.com.br',
          creditorPixType: 'EMAIL',
          defaultAmortization: 'INTEREST_FIRST',
          defaultInterestType: 'COMPOUND',
          incompleteMonthRule: 'PRO_RATA',
        },
      });
    }

    const admin = await prisma.user.findFirst({
      select: { id: true, name: true, email: true, role: true },
    });

    return NextResponse.json({ settings, user: admin });
  } catch (error) {
    console.error('Error getting settings:', error);
    return NextResponse.json({ error: 'Erro ao carregar configurações.' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      systemName,
      creditorName,
      creditorPixKey,
      creditorPixType,
      defaultAmortization,
      defaultInterestType,
      incompleteMonthRule,
      whatsappTemplate,
      adminName,
      adminEmail,
      currentPassword,
      newPassword,
    } = body;

    // Update settings
    const updated = await prisma.systemSetting.upsert({
      where: { id: 'default' },
      update: {
        systemName: systemName?.trim() || 'Gestão Financeira & Dívidas',
        creditorName: creditorName?.trim() || 'Gestor Financeiro',
        creditorPixKey: creditorPixKey?.trim() || '',
        creditorPixType: creditorPixType || 'CHAVE_ALEATORIA',
        defaultAmortization: defaultAmortization || 'INTEREST_FIRST',
        defaultInterestType: defaultInterestType || 'COMPOUND',
        incompleteMonthRule: incompleteMonthRule || 'PRO_RATA',
        whatsappTemplate: whatsappTemplate?.trim() || '',
      },
      create: {
        id: 'default',
        systemName: systemName?.trim() || 'Gestão Financeira & Dívidas',
        creditorName: creditorName?.trim() || 'Gestor Financeiro',
        creditorPixKey: creditorPixKey?.trim() || '',
        creditorPixType: creditorPixType || 'CHAVE_ALEATORIA',
        defaultAmortization: defaultAmortization || 'INTEREST_FIRST',
        defaultInterestType: defaultInterestType || 'COMPOUND',
        incompleteMonthRule: incompleteMonthRule || 'PRO_RATA',
        whatsappTemplate: whatsappTemplate?.trim() || '',
      },
    });

    // Optional admin profile/password change
    if (adminEmail || newPassword) {
      const admin = await prisma.user.findFirst();
      if (admin) {
        const updateUserData: any = {};
        if (adminName) updateUserData.name = adminName.trim();
        if (adminEmail) updateUserData.email = adminEmail.trim().toLowerCase();

        if (newPassword) {
          if (!currentPassword) {
            return NextResponse.json(
              { error: 'Para alterar a senha, informe a senha atual.' },
              { status: 400 }
            );
          }
          const isMatch = await comparePassword(currentPassword, admin.password);
          if (!isMatch) {
            return NextResponse.json(
              { error: 'Senha atual incorreta.' },
              { status: 400 }
            );
          }
          updateUserData.password = await hashPassword(newPassword);
        }

        await prisma.user.update({
          where: { id: admin.id },
          data: updateUserData,
        });
      }
    }

    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
