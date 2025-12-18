// src/pages/Pricing.jsx
import React from 'react';
import { PLANS } from '../config/plans'; // Importa a config que criamos
import { supabase } from '../supabaseClient';

export default function Pricing({ user }) {

  const handleSubscribe = async (plan) => {
    // AQUI entra a integração com Stripe/Asaas depois.
    // Por enquanto, vamos simular que ele assinou o TESTE no banco para você testar.
    
    alert(`Você escolheu: ${plan.name}. (Simulando assinatura...)`);

    // SIMULAÇÃO DE ASSINATURA NO BANCO (Para você testar o fluxo)
    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_code: plan.id,
        status: 'active',
        created_at: new Date()
      });

    if (error) alert('Erro ao salvar: ' + error.message);
    else window.location.reload(); // Recarrega para entrar no app
  };

  return (
    <div style={{ padding: '40px', backgroundColor: '#09090b', minHeight: '100vh', color: 'white', textAlign: 'center' }}>
      <h1>Escolha seu Plano</h1>
      <p style={{ color: '#a1a1aa' }}>Libere seu acesso agora mesmo.</p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '40px' }}>
        {PLANS.map((plan) => (
          <div key={plan.id} style={{ 
            border: plan.highlight ? '2px solid #22c55e' : '1px solid #3f3f46', 
            padding: '20px', 
            borderRadius: '10px', 
            width: '250px',
            backgroundColor: '#18181b'
          }}>
            <h3>{plan.name}</h3>
            <h2 style={{ fontSize: '2rem', margin: '10px 0' }}>
              {plan.price === 0 ? 'Grátis' : `R$ ${plan.price}`}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#d4d4d8' }}>{plan.description}</p>
            
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', textAlign: 'left' }}>
              {plan.features.map((f, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>✅ {f}</li>
              ))}
            </ul>

            <button 
              onClick={() => handleSubscribe(plan)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: plan.highlight ? '#22c55e' : '#e4e4e7',
                color: plan.highlight ? '#fff' : '#000',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {plan.id === 'TESTE3DIAS' ? 'Começar Teste' : 'Assinar Agora'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}