import { parseISO, format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function DataBR({ valor }) {
  if (!valor) return <span>-</span>;

  const date = parseISO(valor); // Corrige o fuso horário
  let texto = "";

  if (isToday(date)) texto = "Hoje";
  else if (isYesterday(date)) texto = "Ontem";
  else texto = format(date, "dd 'de' MMM", { locale: ptBR });

  return <span className="font-medium text-gray-600">{texto}</span>;
}