// Contatos centrais do Canteiro Saudável

export const WHATSAPP_PSICOLOGA = '5531995892351';
export const WHATSAPP_ASSISTENTE_SOCIAL = '5531995892351';

export function whatsappLink(numero: string, mensagem: string) {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

export const VIDEO_GINASTICA_LABORAL =
  'https://www.youtube.com/watch?v=YA1H1J4_8L8'; // Ginástica laboral / alongamento corpo inteiro
