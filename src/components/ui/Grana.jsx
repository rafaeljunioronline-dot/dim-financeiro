export function Grana({ valor, tipo }) {
  // tipo pode ser 'receita', 'despesa' ou neutro
  const formatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);

  let cor = "text-gray-900"; // Cor padrão
  if (tipo === 'EXPENSE' || valor < 0) cor = "text-red-600";
  if (tipo === 'INCOME' || valor > 0) cor = "text-green-600";

  return <span className={`font-bold ${cor}`}>{formatado}</span>;
}