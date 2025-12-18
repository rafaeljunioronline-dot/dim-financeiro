// ARQUIVO: src/utils/formatters.js

import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- FORMATAR DINHEIRO (R$ 1.500,00) ---
export const formatCurrency = (value) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value || 0);
};

// --- FORMATAR DATA AMIGÁVEL ("Hoje", "Ontem", "02 de Dez") ---
// Essa função resolve o problema do fuso horário usando parseISO
export const formatDateFriendly = (dateString) => {
  if (!dateString) return '-';
  
  // O segredo: parseISO lê a data do Supabase sem inventar fuso horário
  const date = parseISO(dateString);

  if (isToday(date)) {
    return 'Hoje';
  }
  
  if (isYesterday(date)) {
    return 'Ontem';
  }

  // Se for outro dia, mostra dia e mês (Ex: 02 de Dez)
  return format(date, "dd 'de' MMM", { locale: ptBR });
};