# Gestão Financeira & Controle de Dívidas Pro

Sistema completo e profissional de gestão financeira para controle de empréstimos, dívidas, devedores, pagamentos, juros mensais (simples e compostos) e emissão de comprovantes e relatórios.

Desenvolvido em **Next.js 14**, **TypeScript**, **Tailwind CSS**, **SQLite (Prisma ORM)** e executável nativo Windows **GestaoFinanceira.exe**.

---

## 🚀 Funcionalidades Principais

### 1. Dashboard Principal
- Indicadores financeiros em tempo real:
  - Total de dinheiro emprestado.
  - Total de valores recebidos e recuperados.
  - Total a receber atualizado (saldo principal + juros pendentes).
  - Total acumulado histórico de juros.
  - Quantidade de devedores com pendências ativas.
  - Quantidade de dívidas atrasadas.
  - Previsão de recebimentos do mês corrente.
- Gráficos interativos mensais de evolução (Emprestado vs Recebido vs Juros).
- Alertas visuais com acesso direto para cobrança no WhatsApp.

### 2. Cadastro de Clientes / Devedores
- Nome completo, CPF, Telefone/WhatsApp, Endereço e Observações.
- Busca instantânea e filtros por nome, CPF ou telefone.
- Visão analítica de cada devedor com extrato completo de dívidas e pagamentos.

### 3. Gestão de Empréstimos e Dívidas
- Concessão de empréstimos vinculados a clientes.
- Taxa de juros mensal (%) e dia de vencimento fixo.
- Modalidades de cálculo: **Juros Simples** ($J = C \times i \times t$) ou **Juros Compostos** ($M = C \times (1 + i)^t$).
- Amortização configurável:
  - **Juros Primeiro:** padrão legal brasileiro (Art. 354 do Código Civil) onde pagamentos abatem primeiro os juros vencidos.
  - **Principal Primeiro:** amortiza o capital inicial diretamente, reduzindo de imediato a base de cálculo de juros futuros.
- Regra de meses incompletos: **Pro-Rata Die** (cálculo proporcional aos dias decorridos) ou **Mês Cheio**.
- Simulador em tempo real durante o cadastro do empréstimo.

### 4. Motor Matemático de Alta Precisão
- Cálculos sem arredondamentos intermediários via `Decimal.js` (precisão arbitrária).
- Não cobra juros sobre pagamentos já efetuados.
- Não aplica cobrança duplicada no mesmo período.
- Timeline de auditoria completa registrando cada evento cronológico de juros e amortizações.

### 5. Controle de Pagamentos e Comprovantes
- Registro de pagamentos parciais e quitações integrais.
- Abatimento automático de juros e principal.
- Geração de **Comprovante de Pagamento Oficial** com demonstrativo, código de autenticidade e layout para impressão/PDF.

### 6. Relatórios Financeiros & Exportação
- Filtros por Devedor, Período, Status (Em Aberto, Parcialmente Pago, Quitado, Atrasado) e Regime de Juros.
- Totais consolidados de capital, principal recuperado, juros obtidos e saldo restante.
- **Exportação para planilha Excel (.xlsx)** com um clique.
- **Impressão e exportação para PDF formatado**.

### 7. Alertas & Integração WhatsApp
- Monitoramento de vencimentos próximos (7 dias) e dívidas atrasadas.
- Botão **"Cobrar no WhatsApp"** que abre conversa com mensagem pré-formatada contendo nome, valor original, juros acumulados, saldo total atualizado e Chave PIX cadastrada.

### 8. Design & Usabilidade
- Interface moderna, responsiva para computador, tablet e celular.
- **Tema Claro e Tema Escuro (Dark Mode)** com alternância instantânea e persistente.
- Menu lateral retrátil e busca ágil.

### 9. Segurança, Banco de Dados & Backup
- Banco de dados relacional SQLite persistente via Prisma ORM.
- Autenticação com sessão JWT e senhas criptografadas com `bcryptjs`.
- Sistema de **Backup Completo em JSON** e **Restauração de Dados** com 1 clique.

---

## 💻 Executável Windows (GestaoFinanceira.exe)

O sistema possui um executável nativo Windows:
- **`GestaoFinanceira.exe`**: Inicia o servidor silenciosamente em segundo plano, abre a interface moderna no modo aplicativo e cria um ícone na bandeja do sistema (perto do relógio) com opções para restaurar a janela ou encerrar o sistema.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend & Backend:** Next.js 14 (App Router) + TypeScript
- **Estilização:** Tailwind CSS + Lucide Icons
- **Gráficos:** Recharts
- **Banco de Dados:** SQLite + Prisma ORM
- **Precisão Financeira:** Decimal.js
- **Segurança:** bcryptjs + jose (JWT)
- **Planilhas:** XLSX (SheetJS)
- **Executável Desktop:** Delphi 7 (Win32 Native PE)

---

## 🔑 Acesso Padrão Inicial

- **E-mail:** `admin@gestao.com`
- **Senha:** `admin123`

---

## 📦 Como Executar via Linha de Comando (Desenvolvedor)

```bash
# 1. Instalar dependências
npm install

# 2. Sincronizar o banco de dados SQLite
npx prisma db push

# 3. Executar carga inicial com dados de demonstração (opcional)
npx tsx prisma/seed.ts

# 4. Iniciar em modo de desenvolvimento
npm run dev

# Ou construir e iniciar em produção:
npm run build
npm start
```
Acesse: [http://localhost:3000](http://localhost:3000)
