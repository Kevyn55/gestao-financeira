import { cleanDigits, formatCurrency, formatDate } from './formatters';

export interface WhatsAppMessageParams {
  customerName: string;
  customerPhone: string;
  loanDescription?: string | null;
  dueDate: Date | string;
  originalAmount: number;
  totalUpdatedAmount: number;
  interestAccrued: number;
  daysLate?: number;
  creditorName: string;
  pixKey: string;
  pixType?: string;
  customTemplate?: string;
}

/**
 * Builds a friendly, professional Brazilian Portuguese WhatsApp reminder message
 * and returns the direct WhatsApp URL (wa.me)
 */
export function generateWhatsAppReminder(params: WhatsAppMessageParams): { message: string; url: string } {
  const phoneDigits = cleanDigits(params.customerPhone);
  // Ensure Brazil country code 55 if 10 or 11 digits
  const fullPhone = phoneDigits.startsWith('55')
    ? phoneDigits
    : phoneDigits.length >= 10
    ? `55${phoneDigits}`
    : phoneDigits;

  let message = '';

  if (params.customTemplate && params.customTemplate.trim()) {
    message = params.customTemplate
      .replace(/{nome}/g, params.customerName)
      .replace(/{descricao}/g, params.loanDescription || 'Empréstimo')
      .replace(/{vencimento}/g, formatDate(params.dueDate))
      .replace(/{valorOriginal}/g, formatCurrency(params.originalAmount))
      .replace(/{juros}/g, formatCurrency(params.interestAccrued))
      .replace(/{saldo}/g, formatCurrency(params.totalUpdatedAmount))
      .replace(/{chavePix}/g, params.pixKey)
      .replace(/{credor}/g, params.creditorName);
  } else {
    const isLate = (params.daysLate || 0) > 0;
    
    if (isLate) {
      message = `Olá, *${params.customerName}*! Tudo bem?

Consta em nosso sistema uma pendência em atraso referente ao empréstimo *${params.loanDescription || 'Financeiro'}*.

📅 *Vencimento original:* ${formatDate(params.dueDate)} (${params.daysLate} dias em atraso)
💰 *Valor original:* ${formatCurrency(params.originalAmount)}
📈 *Juros acumulados:* ${formatCurrency(params.interestAccrued)}
🎯 *Saldo total atualizado:* *${formatCurrency(params.totalUpdatedAmount)}*

Para sua comodidade, você pode efetuar o pagamento via *PIX*:
🔑 *Chave PIX:* \`${params.pixKey}\`
👤 *Favorecido:* ${params.creditorName}

Por favor, nos envie o comprovante por aqui assim que efetuar o pagamento. Caso já tenha realizado, favor desconsiderar esta mensagem.

Obrigado!`;
    } else {
      message = `Olá, *${params.customerName}*! Tudo bem?

Passando para lembrar sobre o vencimento programado do seu empréstimo *${params.loanDescription || 'Financeiro'}*.

📅 *Data de Vencimento:* ${formatDate(params.dueDate)}
💰 *Saldo devedor atual:* *${formatCurrency(params.totalUpdatedAmount)}*

Dados para pagamento via *PIX*:
🔑 *Chave PIX:* \`${params.pixKey}\`
👤 *Favorecido:* ${params.creditorName}

Ficamos à disposição caso precise tirar qualquer dúvida!

Atenciosamente,
*${params.creditorName}*`;
    }
  }

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${fullPhone}?text=${encoded}`;

  return { message, url };
}

