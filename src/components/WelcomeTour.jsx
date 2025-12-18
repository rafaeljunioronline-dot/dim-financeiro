import { useState, useEffect } from 'react';

// Recebe setPage para poder navegar entre as telas durante o tour
export default function WelcomeTour({ onClose, setPage }) {
  const [step, setStep] = useState(0);

  // Passos do Tour: target = ID do elemento na tela para destacar
  // page = Qual página deve estar aberta para esse passo
  const steps = [
    {
      target: null, // Passo 0: Boas vindas (Sem destaque)
      page: "dashboard",
      title: "Bem-vindo ao Comando! 🚀",
      text: "Aqui você tem a visão completa do seu negócio e da sua vida pessoal. Vamos fazer um tour rápido?",
      position: "center"
    },
    {
      target: "wallet-switcher", // ID do Header
      page: "dashboard",
      title: "O Poder Híbrido 🔄",
      text: "Aqui você troca de chapéu: clique para ver o caixa da 'Empresa' ou o seu bolso 'Pessoal'.",
      position: "bottom"
    },
    {
      target: "menu-transactions", // ID do Sidebar
      page: "dashboard",
      title: "Extrato Completo 📝",
      text: "Aqui fica seu histórico. Tudo que você lança no Zap aparece aqui instantaneamente.",
      position: "right",
      action: () => setPage("transactions") // Muda a página ao avançar
    },
    {
      target: "menu-future", // ID do Sidebar
      page: "transactions",
      title: "Previsibilidade 🗓️",
      text: "Durma tranquilo. Aqui ficam seus boletos futuros. O DIM te avisa no Zap no dia do vencimento.",
      position: "right",
      action: () => setPage("future-cash")
    },
    {
      target: "menu-reports", // ID do Sidebar
      page: "future-cash",
      title: "A Verdade Nua e Crua 📊",
      text: "Gráficos simples para você saber se está lucrando ou apenas pagando boletos.",
      position: "right",
      action: () => setPage("reports")
    },
    {
      target: null, // Final
      page: "reports",
      title: "Tudo Conectado! 📲",
      text: "Sua conta está zerada e pronta. Que tal fazer seu primeiro lançamento real pelo WhatsApp agora?",
      position: "center"
    }
  ];

  const currentStep = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      const nextStep = steps[step + 1];
      if (nextStep.action) nextStep.action(); // Executa a mudança de página
      if (nextStep.page) setPage(nextStep.page); // Garante a página certa
      setStep(step + 1);
    } else {
      localStorage.setItem('dim_tour_seen', 'true');
      setPage("dashboard"); // Volta pro início
      onClose();
    }
  };

  // Posiciona o Card
  const getPosition = () => {
    if (!currentStep.target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const el = document.getElementById(currentStep.target);
    if (!el) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

    const rect = el.getBoundingClientRect();
    if (currentStep.position === 'bottom') return { top: rect.bottom + 20, left: rect.left };
    if (currentStep.position === 'right') return { top: rect.top, left: rect.right + 20 };
    return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  };

  // Cria o Holofote (Sombra gigante ao redor do elemento)
  const getSpotlightStyle = () => {
    if (!currentStep.target) return {};
    const el = document.getElementById(currentStep.target);
    if (!el) return {};

    const rect = el.getBoundingClientRect();
    return {
      position: 'absolute',
      top: rect.top - 5,
      left: rect.left - 5,
      width: rect.width + 10,
      height: rect.height + 10,
      borderRadius: '8px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)', // A mágica
      pointerEvents: 'none',
      zIndex: 9998
    };
  };

  // Se não tem target, escurece a tela toda
  const overlayStyle = !currentStep.target ? {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9998
  } : {};

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999, pointerEvents: 'none' }}>
      {/* Fundo Escuro */}
      {!currentStep.target ? <div style={overlayStyle} /> : <div style={getSpotlightStyle()} />}

      {/* Card de Texto */}
      <div style={{
        position: 'absolute',
        ...getPosition(),
        backgroundColor: '#18181b',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid #27272a',
        maxWidth: '400px',
        color: 'white',
        zIndex: 9999,
        pointerEvents: 'auto', // Permite clicar no botão
        transition: 'all 0.3s ease'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>{currentStep.title}</h3>
        <p style={{ color: '#a1a1aa', lineHeight: '1.5', marginBottom: '20px' }}>{currentStep.text}</p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: '#52525b' }}>Passo {step + 1} de {steps.length}</span>
          <button onClick={handleNext} style={{ backgroundColor: '#22c55e', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
            {step === steps.length - 1 ? 'Concluir 🚀' : 'Próximo 👉'}
          </button>
        </div>
      </div>
    </div>
  );
}