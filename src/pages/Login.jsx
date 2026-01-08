import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' ou 'SIGNUP'
  const [step, setStep] = useState(1); // Passo do cadastro (1=Dados, 2=Plano)
  
  // Dados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); 
  const [selectedPlan, setSelectedPlan] = useState('TRIAL'); // TRIAL, MONTHLY, YEARLY

  // 1. FAZER LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      alert('Erro ao entrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. AVANÇAR PARA ESCOLHA DE PLANO
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!email || !password || !phone) {
        alert("Preencha todos os campos!");
        return;
    }
    setStep(2);
  };

  // 3. FINALIZAR CADASTRO (Cria conta + Define Plano)
  const handleSignUp = async (planType) => {
    setLoading(true);
    
    // Formata telefone
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length <= 11) cleanPhone = '55' + cleanPhone;

    // Calcula validade baseado no plano
    const hoje = new Date();
    let validUntil = new Date();
    let status = 'ACTIVE'; // Por padrão ativo

    if (planType === 'TRIAL') {
        validUntil.setDate(hoje.getDate() + 3);
        status = 'TRIAL';
    } else if (planType === 'MONTHLY') {
        validUntil.setDate(hoje.getDate() + 30);
        status = 'WAITING_PAYMENT'; // Mensal/Anual entra como aguardando pagto
    } else if (planType === 'YEARLY') {
        validUntil.setDate(hoje.getDate() + 365);
        status = 'WAITING_PAYMENT';
    }

    try {
      // 1. Cria Auth
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;

      if (data?.user) {
        // 2. Salva Perfil e Assinatura
        const { error: profileError } = await supabase.from('profiles').upsert({
            id: data.user.id,
            phone: cleanPhone,
            plan_status: status, 
            valid_until: validUntil.toISOString()
        });

        // Opcional: Criar registro na tabela subscriptions se você usa ela
        // await supabase.from('subscriptions').insert({...})

        if (profileError) throw profileError;
        
        alert('Conta criada com sucesso!');
        // Se for TRIAL, já loga direto (o App.jsx cuida do resto)
        // Se for PAGAMENTO, poderia redirecionar, mas vamos logar e mostrar bloqueio depois
        window.location.reload(); 
      }
    } catch (error) {
      alert('Erro ao cadastrar: ' + error.message);
      setLoading(false);
    }
  };

  // ESTILOS (Mantive os seus e adicionei novos para os Cards)
  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#09090b', color: 'white', fontFamily: 'sans-serif', padding: '20px' },
    card: { backgroundColor: '#18181b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #27272a' },
    title: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', color: '#f4f4f5' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', marginBottom: '15px', fontSize: '1rem', outline: 'none' },
    btn: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' },
    backBtn: { background: 'none', border: 'none', color: '#a1a1aa', marginTop: '10px', cursor: 'pointer' },
    switchBtn: { background: 'none', border: 'none', color: '#a1a1aa', marginTop: '20px', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' },
    
    // Estilos dos Cards de Plano
    planCard: { border: '1px solid #3f3f46', borderRadius: '8px', padding: '15px', marginBottom: '10px', cursor: 'pointer', textAlign: 'left', transition: '0.2s' },
    planTitle: { fontWeight: 'bold', fontSize: '1.1rem', color: 'white' },
    planPrice: { color: '#facc15', fontWeight: 'bold', fontSize: '1rem' },
    planDesc: { fontSize: '0.8rem', color: '#a1a1aa' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
            {mode === 'LOGIN' ? 'Acessar DIM' : (step === 1 ? 'Criar Conta' : 'Escolha seu Plano')}
        </h1>
        
        {/* MODO LOGIN */}
        {mode === 'LOGIN' && (
            <form onSubmit={handleLogin}>
                <input type="email" placeholder="Seu E-mail" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
                <button type="submit" style={styles.btn} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
                <button onClick={() => setMode('SIGNUP')} style={styles.switchBtn}>Não tem conta? Cadastre-se</button>
            </form>
        )}

        {/* MODO SIGNUP - PASSO 1 (DADOS) */}
        {mode === 'SIGNUP' && step === 1 && (
            <form onSubmit={handleNextStep}>
                <input type="tel" placeholder="Seu WhatsApp (Ex: 11999999999)" value={phone} onChange={e => setPhone(e.target.value)} required style={styles.input} />
                <input type="email" placeholder="Seu E-mail" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
                <input type="password" placeholder="Sua Senha" value={password} onChange={e => setPassword(e.target.value)} required style={styles.input} />
                <button type="submit" style={styles.btn}>Próximo Passo</button>
                <button onClick={() => setMode('LOGIN')} style={styles.switchBtn}>Já tem conta? Entrar</button>
            </form>
        )}

        {/* MODO SIGNUP - PASSO 2 (PLANOS) */}
        {mode === 'SIGNUP' && step === 2 && (
            <div>
                <div style={{...styles.planCard, borderColor: '#22c55e', backgroundColor: '#22c55e10'}} onClick={() => handleSignUp('TRIAL')}>
                    <div style={styles.planTitle}>🧪 Teste Grátis (Recomendado)</div>
                    <div style={styles.planDesc}>3 Dias de acesso total para conhecer.</div>
                    <div style={{fontSize:'0.8rem', color:'#22c55e', marginTop:'5px'}}>Sem cartão de crédito.</div>
                </div>

                <div style={styles.planCard} onClick={() => handleSignUp('MONTHLY')}>
                    <div style={styles.planTitle}>📅 Mensal</div>
                    <div style={styles.planPrice}>R$ 29,90 / mês</div>
                    <div style={styles.planDesc}>Acesso completo + Suporte VIP.</div>
                </div>

                <div style={styles.planCard} onClick={() => handleSignUp('YEARLY')}>
                    <div style={styles.planTitle}>📆 Anual (Desconto)</div>
                    <div style={styles.planPrice}>R$ 297,00 / ano</div>
                    <div style={styles.planDesc}>Economize 2 meses.</div>
                </div>

                {loading && <p>Criando conta...</p>}
                <button onClick={() => setStep(1)} style={styles.backBtn}>Voltar</button>
            </div>
        )}

      </div>
    </div>
  );
}