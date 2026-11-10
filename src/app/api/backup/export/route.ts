import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [settings, users, customers, loans, payments] = await Promise.all([
      prisma.systemSetting.findMany(),
      prisma.user.findMany({ select: { id: true, name: true, email: true, password: true, role: true } }),
      prisma.customer.findMany(),
      prisma.loan.findMany(),
      prisma.payment.findMany(),
    ]);

    const backupPayload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'GestaoFinanceiraDividas',
      data: {
        settings,
        users,
        customers,
        loans,
        payments,
      },
    };

    const filename = `backup-financeiro-${new Date().toISOString().split('T')[0]}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting backup:', error);
    return NextResponse.json({ error: 'Erro ao gerar arquivo de backup.' }, { status: 500 });
  }
}
