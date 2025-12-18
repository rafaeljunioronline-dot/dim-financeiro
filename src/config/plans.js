// src/config/plans.js

export const PLANS = [
  {
    id: 'TESTE3DIAS',
    name: 'Teste Grátis (3 Dias)',
    description: 'Teste tudo sem compromisso. Cobrança só após 72h.',
    price: 0.00, // Visualmente é grátis na entrada
    futurePrice: 29.90,
    interval: 'mês',
    highlight: true, // Destaque
    features: ['Acesso Total', 'Gestão Pessoal', 'Gestão Empresarial']
  },
  {
    id: 'MENSAL',
    name: 'Plano Mensal',
    description: 'Pagamento mês a mês, cancele quando quiser.',
    price: 29.90,
    interval: 'mês',
    highlight: false,
    features: ['Acesso Total', 'Suporte Básico']
  },
  {
    id: 'ANUAL',
    name: 'Plano Anual',
    description: 'Desconto exclusivo para pagamento anual.',
    price: 299.90,
    interval: 'ano',
    highlight: false,
    features: ['2 Meses Grátis', 'Relatórios Avançados']
  },
  {
    id: 'VIP',
    name: 'Grupo VIP',
    description: 'Acompanhamento próximo e mentoria.',
    price: 99.90,
    interval: 'mês',
    highlight: false,
    features: ['Mentoria', 'Grupo Exclusivo', 'Análise Financeira']
  }
];