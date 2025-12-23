import { useState } from 'react';
import { supabase } from '../supabaseClient'; 

export default function Login() {
  // Estados
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(''); 
  const [code, setCode] = useState('');
  const [step, setStep] = useState('PHONE'); // PHONE ou CODE
  const [loading, setLoading] = useState(false);

  // PEGA A URL CERTA (Seja no PC ou na Vercel)
  const API_URL = import.meta.env.VITE_API_URL;

  // 1. PEDIR CÓDIGO (Envia WhatsApp e Email Real para o Robô)
  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validação básica
    if(phone.length < 10) {
        alert("Digite um WhatsApp válido com DDD (ex: 11999999999)");
        setLoading(false);
        return;
    }

    try {
      // AQUI ESTAVA O ERRO: Trocamos localhost pela variável API_URL
      const response = await fetch(`${API_URL}/api/login-solicitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            phone: phone.replace(/\D/g, ''), 
            email: email 
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(`Código enviado para o WhatsApp final ${phone.slice(-4)}! 📱`);
        setStep('CODE');
      } else {
        alert("Erro: " + (data.error || "Falha ao enviar código"));
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao conectar com o Robô. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  // 2. ENTRAR (Valida Código e Loga)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // AQUI TAMBÉM: Trocamos localhost pela variável API_URL
      const response = await fetch(`${API_URL}/api/login-verificar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            phone: phone.replace(/\D/g, ''), 
            code,
            email 
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log("Credenciais recebidas. Logando no Supabase...");
        
        // Login Oficial no Supabase
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email, 
          password: data.password
        });

        if (error) throw error;
        
        console.log("Login realizado!", authData);
      } else {
        alert("Código incorreto ou expirado.");
      }
    } catch (error) {
      alert("Falha no login: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#18181b', color: 'white', fontFamily: 'sans-serif' },
    card: { backgroundColor: '#27272a', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '400px', textAlign: 'center', border: '1px solid #3f3f46' },
    title: { fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '10px' },
    subtitle: { color: '#a1a1aa', marginBottom: '30px', fontSize: '0.9rem' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#18181b', color: 'white', marginBottom: '15px', fontSize: '1rem', outline: 'none' },
    btn: { width: '100%', padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' },
    backBtn: { background: 'none', border: 'none', color: '#71717a', marginTop: '15px', cursor: 'pointer', fontSize: '0.85rem' },
    label: { display: 'block', textAlign: 'left', marginBottom: '5px', fontSize: '0.85rem', color: '#d4d4d8' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>DIM Finance</h1>
        
        {step === 'PHONE' ? (
          <form onSubmit={handleSendCode}>
            <p style={styles.subtitle}>Acesse sua conta ou cadastre-se</p>
            
            <div style={{textAlign: 'left'}}>
                <label style={styles.label}>Seu WhatsApp</label>
                <input 
                  type="tel" 
                  placeholder="Ex: 11999999999" 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  required 
                  style={styles.input}
                />
            </div>

            <div style={{textAlign: 'left'}}>
                <label style={styles.label}>Seu Melhor E-mail</label>
                <input 
                  type="email" 
                  placeholder="nome@exemplo.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  style={styles.input}
                />
            </div>

            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Enviando...' : 'Receber Código'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <p style={styles.subtitle}>Digite o código enviado no WhatsApp</p>
            <input 
              type="text" 
              placeholder="0000" 
              value={code} 
              onChange={e => setCode(e.target.value)} 
              required 
              maxLength={4}
              style={{...styles.input, textAlign: 'center', letterSpacing: '5px', fontSize: '1.5rem'}}
            />
            <button type="submit" style={styles.btn} disabled={loading}>
              {loading ? 'Entrando...' : 'Acessar Sistema'}
            </button>
            <button type="button" onClick={() => setStep('PHONE')} style={styles.backBtn}>Corrigir dados</button>
          </form>
        )}
      </div>
    </div>
  );
}