import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('LOGIN'); // 'LOGIN' ou 'SIGNUP'
  
  // Dados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(''); // Só usado no cadastro

  // 1. FAZER LOGIN (Entrar no sistema)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      // O App.jsx vai detectar a mudança de usuário e redirecionar
    } catch (error) {
      alert('Erro ao entrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. CRIAR CONTA (Cadastrar Email + Senha + Zap do Robô)
  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Formata o telefone para garantir o 55 (padrão do robô)
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length > 0 && cleanPhone.length <= 11) {
        cleanPhone = '55' + cleanPhone; // Adiciona o 55 se o usuário esqueceu
    }

    try {
      // Cria o usuário no Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data?.user) {
        // O PULO DO GATO: Salva o WhatsApp na tabela de perfis para o robô reconhecer!
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({ 
            id: data.user.id, 
            phone: cleanPhone,
            plan_status: 'VIP' // Já dá VIP pra você testar
          });
          
        if (profileError) {
             console.error("Erro ao salvar perfil:", profileError);
             alert("Conta criada, mas erro ao salvar telefone. Fale com suporte.");
        } else {
            alert('Conta criada com sucesso! Pode entrar.');
            setMode('LOGIN');
        }
      }
    } catch (error) {
      alert('Erro ao cadastrar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#18181b', color: 'white', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#27272a', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #3f3f46' },
    title: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: 'white', marginBottom: '15px', fontSize: '1rem', outline: 'none' },
    btn: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem', marginTop: '10px' },
    switchBtn: { background: 'none', border: 'none', color: '#a1a1aa', marginTop: '20px', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>
            {mode === 'LOGIN' ? 'Acessar DIM' : 'Criar Nova Conta'}
        </h1>
        
        <form onSubmit={mode === 'LOGIN' ? handleLogin : handleSignUp}>
            
            {/* Campo de WhatsApp (Só aparece no Cadastro) */}
            {mode === 'SIGNUP' && (
                <input 
                  type="tel" 
                  placeholder="Seu WhatsApp (Ex: 11999999999)" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  style={styles.input}
                />
            )}

            <input 
              type="email" 
              placeholder="Seu E-mail" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              style={styles.input}
            />

            <input 
              type="password" 
              placeholder="Sua Senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
              style={styles.input}
            />

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Carregando...' : (mode === 'LOGIN' ? 'Entrar' : 'Cadastrar Grátis')}
            </button>
        </form>

        <button onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')} style={styles.switchBtn}>
            {mode === 'LOGIN' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  );
}