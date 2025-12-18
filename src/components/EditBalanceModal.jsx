import { useState, useEffect } from 'react';
// O caminho ../ aponta para a pasta src/ onde está o supabaseClient.js
import { supabase } from '../supabaseClient';

export default function EditBalanceModal({ isOpen, onClose, wallet, currentBalance, onSuccess }) {
  const [realBalance, setRealBalance] = useState('');
  const [loading, setLoading] = useState(false);

  // Atualiza o input com o valor atual quando o modal abre
  useEffect(() => {
    if (isOpen) setRealBalance(currentBalance);
  }, [isOpen, currentBalance]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    const target = parseFloat(realBalance);
    
    if (isNaN(target)) return alert("Digite um valor válido.");
    
    // Calcula a diferença necessária
    const difference = target - currentBalance;

    if (difference === 0) {
        onClose(); // Nada mudou
        return;
    }

    setLoading(true);

    try {
      // Cria a transação de ajuste automaticamente
      const { error } = await supabase.from('transactions').insert([{
        description: 'Ajuste Manual de Caixa',
        amount: Math.abs(difference), // Valor sempre positivo
        type: difference > 0 ? 'INCOME' : 'EXPENSE', // Se faltou ou sobrou
        category: 'Ajuste',
        wallet_id: wallet.id,
        transaction_date: new Date().toISOString().split('T')[0]
      }]);

      if (error) throw error;

      if (onSuccess) onSuccess(`Caixa ajustado para R$ ${target.toFixed(2)}`);
      onClose();

    } catch (error) {
      alert("Erro ao ajustar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    card: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
    title: { fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '15px', color: '#374151', textAlign: 'center' },
    info: { backgroundColor: '#f3f4f6', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#6b7280', textAlign: 'center' },
    input: { width: '100%', padding: '14px', fontSize: '1.5rem', border: '2px solid #2563eb', borderRadius: '10px', outline: 'none', textAlign: 'center', color: '#111827', fontWeight: 'bold', marginBottom: '20px' },
    actions: { display: 'flex', gap: '10px' },
    btn: (bg, color) => ({ flex: 1, padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', backgroundColor: bg, color: color }),
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>⚖️ Ajustar Caixa</h2>
        
        <div style={styles.info}>
            Saldo no Sistema: <b>R$ {currentBalance?.toFixed(2)}</b><br/>
            Digite abaixo quanto você <b>realmente</b> tem.
        </div>

        <form onSubmit={handleSave}>
          <input 
            type="number" 
            step="0.01" 
            value={realBalance} 
            onChange={e => setRealBalance(e.target.value)} 
            style={styles.input}
            autoFocus
          />
          
          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btn('#f3f4f6', '#374151')}>Cancelar</button>
            <button type="submit" disabled={loading} style={styles.btn('#2563eb', 'white')}>
              {loading ? 'Salvando...' : 'Confirmar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}