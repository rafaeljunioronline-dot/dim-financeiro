import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function PaySalaryModal({ isOpen, onClose, businessWallet, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleTransfer = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!amount || amount <= 0) {
        alert("Por favor, digite um valor válido maior que zero.");
        return;
    }
    
    setLoading(true);

    // DATA DE HOJE CORRIGIDA (Local Time YYYY-MM-DD)
    const todayLocal = new Date().toLocaleDateString('sv-SE'); 

    try {
      // 1. Descobre qual é a carteira PESSOAL do usuário logado
      const { data: personalWallets, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('type', 'PERSONAL')
        .limit(1);

      if (walletError || !personalWallets?.length) {
          throw new Error("Carteira pessoal não encontrada. Verifique se você está logado corretamente.");
      }
      
      const personalWalletId = personalWallets[0].id;
      // Pegamos o ID do usuário da carteira atual para assinar a transação
      const currentUserId = businessWallet.user_id; 

      // 2. SEGURANÇA FINANCEIRA (Ordem Invertida com Rollback)
      // Primeiro tentamos criar a RECEITA no Pessoal
      const { data: incomeData, error: incError } = await supabase.from('transactions').insert([{
        description: `Salário recebido de ${businessWallet.name}`,
        amount: parseFloat(amount),
        type: 'INCOME', // Entrada no pessoal
        category: 'Salário',
        wallet_id: personalWalletId,
        user_id: currentUserId, // <--- CORREÇÃO AQUI (Obrigatório)
        transaction_date: todayLocal
      }]).select();
      
      if (incError) throw incError;

      // 3. Agora tentamos tirar da EMPRESA
      const { error: expError } = await supabase.from('transactions').insert([{
        description: 'Retirada de Lucro / Salário',
        amount: parseFloat(amount),
        type: 'EXPENSE', // Saída da empresa
        category: 'Pró-labore',
        wallet_id: businessWallet.id,
        user_id: currentUserId, // <--- CORREÇÃO AQUI (Obrigatório)
        transaction_date: todayLocal
      }]);
      
      if (expError) {
        // PERIGO CRÍTICO: A saída da empresa falhou, mas o dinheiro entrou no pessoal.
        // AÇÃO: ROLLBACK (Desfazer a entrada no pessoal)
        console.error("Falha na retirada da empresa. Desfazendo entrada pessoal...");
        if (incomeData && incomeData[0]?.id) {
            await supabase.from('transactions').delete().eq('id', incomeData[0].id);
        }
        throw new Error("Falha ao registrar saída da empresa. A operação foi cancelada.");
      }

      // 4. Finalização
      if (onSuccess) onSuccess(`Sucesso! R$ ${amount} transferido para sua conta pessoal.`);
      setAmount(''); // Limpa o campo
      onClose(); // Fecha o modal

    } catch (error) {
      console.error(error);
      alert("Erro na transferência: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Estilos Profissionais ---
  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    card: { backgroundColor: '#18181b', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', border: '1px solid #27272a', fontFamily: 'sans-serif', color: '#e4e4e7' },
    title: { fontSize: '1.5rem', fontWeight: '800', marginBottom: '10px', color: '#f4f4f5', textAlign: 'center' },
    text: { color: '#a1a1aa', marginBottom: '25px', textAlign: 'center', fontSize: '0.95rem', lineHeight: '1.5' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', fontWeight: '700', marginBottom: '8px', color: '#d4d4d8', fontSize: '0.9rem', textTransform: 'uppercase' },
    input: { width: '100%', padding: '14px', fontSize: '1.5rem', border: '2px solid #3f3f46', borderRadius: '10px', outline: 'none', textAlign: 'center', color: 'white', fontWeight: 'bold', backgroundColor: '#27272a' },
    actions: { display: 'flex', gap: '12px' },
    btn: (bg, color) => ({ flex: 1, padding: '14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', backgroundColor: bg, color: color, transition: 'opacity 0.2s' }),
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>Pagar Meu Salário</h2>
        <p style={styles.text}>
            Transfira o lucro da <strong>{businessWallet?.name}</strong> para sua <strong>Carteira Pessoal</strong>.
        </p>
        
        <form onSubmit={handleTransfer}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Valor da Retirada</label>
            <input 
                type="number" 
                step="0.01"
                placeholder="0,00" 
                value={amount}
                onChange={e => setAmount(e.target.value)}
                style={styles.input}
                autoFocus
            />
          </div>
          
          <div style={styles.actions}>
            <button 
                type="button" 
                onClick={onClose} 
                style={styles.btn('#27272a', '#a1a1aa')}
                disabled={loading}
            >
                Cancelar
            </button>
            
            <button 
                type="submit" 
                disabled={loading} 
                style={{
                    ...styles.btn('#16a34a', 'white'),
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? 'Processando...' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}