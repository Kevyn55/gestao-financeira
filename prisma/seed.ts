import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de dados iniciais (Seed)...');

  // 1. Configurações do Sistema
  await prisma.systemSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      systemName: 'Gestão Financeira & Dívidas',
      creditorName: 'Gestor Financeiro Pro',
      creditorPixKey: 'financeiro@empresa.com.br',
      creditorPixType: 'EMAIL',
      defaultAmortization: 'INTEREST_FIRST',
      defaultInterestType: 'COMPOUND',
      incompleteMonthRule: 'PRO_RATA',
      whatsappTemplate: 'Olá {nome}! Consta em nosso sistema uma pendência no valor de {saldo} referente ao empréstimo ({descricao}). Vencimento: {vencimento}. Chave PIX: {chavePix} ({credor}).',
    },
  });

  // 2. Usuário Administrador
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gestao.com' },
    update: {},
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@gestao.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin criado/verificado:', admin.email);

  // 3. Clientes
  const customer1 = await prisma.customer.upsert({
    where: { id: 'cust-1' },
    update: {},
    create: {
      id: 'cust-1',
      name: 'Carlos Eduardo Silva',
      cpf: '12345678900',
      phone: '11987654321',
      email: 'carlos.silva@email.com',
      address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
      notes: 'Cliente antigo. Faz pagamentos parciais no dia 10.',
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { id: 'cust-2' },
    update: {},
    create: {
      id: 'cust-2',
      name: 'Mariana Souza Santos',
      cpf: '98765432199',
      phone: '21976543210',
      email: 'mariana.souza@email.com',
      address: 'Rua Barata Ribeiro, 450 - Copacabana, Rio de Janeiro - RJ',
      notes: 'Contato preferencial por WhatsApp.',
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { id: 'cust-3' },
    update: {},
    create: {
      id: 'cust-3',
      name: 'Roberto Alcântara Ferreira',
      cpf: '45678901234',
      phone: '31991234567',
      email: 'roberto.alcantara@email.com',
      address: 'Rua da Bahia, 800 - Centro, Belo Horizonte - MG',
      notes: 'Empréstimo para reforma comercial.',
    },
  });

  const customer4 = await prisma.customer.upsert({
    where: { id: 'cust-4' },
    update: {},
    create: {
      id: 'cust-4',
      name: 'Fernanda Lima Duarte',
      cpf: '78901234567',
      phone: '41988776655',
      email: 'fernanda.duarte@email.com',
      address: 'Rua XV de Novembro, 250 - Centro, Curitiba - PR',
      notes: 'Excelente pagadora, já quitou empréstimos anteriores.',
    },
  });

  // 4. Empréstimos e Pagamentos
  const today = new Date();
  
  // Empréstimo 1: Carlos Eduardo - R$ 5.000, 4% a.m., concedido há 60 dias, parcialmente pago
  const dateLoan1 = new Date(today);
  dateLoan1.setDate(dateLoan1.getDate() - 60);
  const dueLoan1 = new Date(today);
  dueLoan1.setDate(dueLoan1.getDate() + 30);

  const loan1 = await prisma.loan.upsert({
    where: { code: 'EMP-2026-0001' },
    update: {},
    create: {
      id: 'loan-1',
      customerId: customer1.id,
      code: 'EMP-2026-0001',
      originalAmount: 5000.0,
      loanDate: dateLoan1,
      monthlyInterestRate: 4.0,
      interestType: 'COMPOUND',
      dueDate: dueLoan1,
      billingDay: 10,
      amortizationRule: 'INTEREST_FIRST',
      incompleteMonthRule: 'PRO_RATA',
      description: 'Capital de giro para microempresa',
      status: 'PARTIALLY_PAID',
    },
  });

  // Pagamento parcial de R$ 1.500 no loan 1
  const payDate1 = new Date(today);
  payDate1.setDate(payDate1.getDate() - 20);
  await prisma.payment.upsert({
    where: { receiptNumber: 'REC-2026-0001' },
    update: {},
    create: {
      id: 'pay-1',
      loanId: loan1.id,
      customerId: customer1.id,
      receiptNumber: 'REC-2026-0001',
      paymentDate: payDate1,
      amount: 1500.0,
      principalPaid: 1100.0,
      interestPaid: 400.0,
      remainingBalance: 3900.0,
      paymentMethod: 'PIX',
      notes: 'Primeira parcela acordada via PIX',
    },
  });

  // Empréstimo 2: Mariana Souza - R$ 10.000, 5% a.m., concedido há 75 dias, vencimento há 15 dias (ATRASADO!)
  const dateLoan2 = new Date(today);
  dateLoan2.setDate(dateLoan2.getDate() - 75);
  const dueLoan2 = new Date(today);
  dueLoan2.setDate(dueLoan2.getDate() - 15);

  await prisma.loan.upsert({
    where: { code: 'EMP-2026-0002' },
    update: {},
    create: {
      id: 'loan-2',
      customerId: customer2.id,
      code: 'EMP-2026-0002',
      originalAmount: 10000.0,
      loanDate: dateLoan2,
      monthlyInterestRate: 5.0,
      interestType: 'SIMPLE',
      dueDate: dueLoan2,
      billingDay: 15,
      amortizationRule: 'INTEREST_FIRST',
      incompleteMonthRule: 'PRO_RATA',
      description: 'Empréstimo pessoal com taxa fixa',
      status: 'OVERDUE',
    },
  });

  // Empréstimo 3: Roberto Alcântara - R$ 3.000, 3.5% a.m., vencendo em 4 dias (VENCIMENTO PRÓXIMO!)
  const dateLoan3 = new Date(today);
  dateLoan3.setDate(dateLoan3.getDate() - 26);
  const dueLoan3 = new Date(today);
  dueLoan3.setDate(dueLoan3.getDate() + 4);

  await prisma.loan.upsert({
    where: { code: 'EMP-2026-0003' },
    update: {},
    create: {
      id: 'loan-3',
      customerId: customer3.id,
      code: 'EMP-2026-0003',
      originalAmount: 3000.0,
      loanDate: dateLoan3,
      monthlyInterestRate: 3.5,
      interestType: 'COMPOUND',
      dueDate: dueLoan3,
      billingDay: 20,
      amortizationRule: 'INTEREST_FIRST',
      incompleteMonthRule: 'PRO_RATA',
      description: 'Compra de equipamentos de informática',
      status: 'OPEN',
    },
  });

  // Empréstimo 4: Fernanda Lima - R$ 4.000, 3% a.m., TOTALMENTE QUITADO!
  const dateLoan4 = new Date(today);
  dateLoan4.setDate(dateLoan4.getDate() - 90);
  const dueLoan4 = new Date(today);
  dueLoan4.setDate(dueLoan4.getDate() - 30);

  const loan4 = await prisma.loan.upsert({
    where: { code: 'EMP-2026-0004' },
    update: {},
    create: {
      id: 'loan-4',
      customerId: customer4.id,
      code: 'EMP-2026-0004',
      originalAmount: 4000.0,
      loanDate: dateLoan4,
      monthlyInterestRate: 3.0,
      interestType: 'COMPOUND',
      dueDate: dueLoan4,
      billingDay: 5,
      amortizationRule: 'INTEREST_FIRST',
      incompleteMonthRule: 'PRO_RATA',
      description: 'Financiamento de cursos de especialização',
      status: 'PAID',
    },
  });

  // Pagamento integral do loan 4
  const payDate4 = new Date(today);
  payDate4.setDate(payDate4.getDate() - 35);
  await prisma.payment.upsert({
    where: { receiptNumber: 'REC-2026-0002' },
    update: {},
    create: {
      id: 'pay-2',
      loanId: loan4.id,
      customerId: customer4.id,
      receiptNumber: 'REC-2026-0002',
      paymentDate: payDate4,
      amount: 4243.60,
      principalPaid: 4000.0,
      interestPaid: 243.60,
      remainingBalance: 0.0,
      paymentMethod: 'TRANSFERENCIA',
      notes: 'Quitação antecipada total com juros calculados',
    },
  });

  console.log('Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

