// Contatos centrais do Canteiro Saudável
// Cada serviço tem um número próprio.

// Psicóloga e Assistente Social — equipe de saúde mental (mesmo número)
export const WHATSAPP_PSICOLOGA = '5531995892351';
export const WHATSAPP_ASSISTENTE_SOCIAL = '5531995892351';

// Saúde Ocupacional — médico/enfermagem do trabalho
export const WHATSAPP_SAUDE_OCUPACIONAL = '5521998225493';

// SOS oficial — CVV (Centro de Valorização da Vida)
export const SOS_TELEFONE = '188';
export const SOS_CHAT_URL = 'https://www.cvv.org.br/chat/';
export const SOS_EMAIL = 'mailto:atendimento@cvv.org.br';

// Link mais robusto para abrir conversa do WhatsApp (api.whatsapp.com é mais
// confiável em alguns dispositivos do que wa.me e evita bloqueio de redirect).
export function whatsappLink(numero: string, mensagem: string) {
  const limpo = numero.replace(/\D/g, '');
  return `https://api.whatsapp.com/send?phone=${limpo}&text=${encodeURIComponent(mensagem)}`;
}

export const VIDEO_GINASTICA_LABORAL =
  'https://www.youtube.com/watch?v=YA1H1J4_8L8';
