import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

export default function AddFutureCash({ onBillAdded, editingBill, wallet }) {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('PAYABLE');
  const [dueDate, setDueDate] = useState(todayStr);
  const [loading, setLoading] = useState(false);
  
  const isEditing = !!editingBill;
  const [billId, setBillId] = useState(null);

  useEffect(() => {
    if (isEditing) {
      setBillId(editingBill.id);
      setDescription(editingBill.description);
      setAmount(editingBill.amount);
      setType(editingBill.type);
      setDueDate(editingBill.due_date);
    } else {
      setBillId(null);
      setDescription('');
      setAmount('');
      setType('PAYABLE');
      setDueDate(todayStr);
    }
  }, [editingBill, todayStr]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description || !amount || !dueDate) { alert('Preencha todos os campos!'); return; }
    
    setLoading(true);

    try {
        let finalCategory = 'Contas'; 
        
        // 1. PERGUNTA PRA IA ANTES DE SALVAR
        try {
            const response = await fetch('http://localhost:3000/api/analisar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    text: description, 
                    userId: wallet.user_id,
                    walletType: wallet.type 
                })
            });
            
            if (response.ok) {
                const iaData = await response.json();
                if (iaData.category && iaData.category !== 'Uncategorized') {
                    finalCategory = iaData.category;
                }
            }
        } catch (error) {
            console.log("IA Offline - Usando padrão 'Contas'");
        }

        // 2. SALVA NO BANCO
        const dataToSave = { 
            description,
            amount: parseFloat(amount),
            type,
            due_date: dueDate,
            status: 'PENDING', 
            wallet_id: wallet?.id,
            user_id: wallet?.user_id,
            category: finalCategory // VAI SALVAR AUTOMÁTICO
        };

        let dbError;
        if (isEditing) {
            const result = await supabase.from('bills').update(dataToSave).eq('id', billId);
            dbError = result.error;
        } else {
            const result = await supabase.from('bills').insert([dataToSave]);
            dbError = result.error;
        }
        
        if (dbError) throw dbError;
        onBillAdded();

    } catch (error) {
        alert('Erro: ' + error.message);
    } finally {
        setLoading(false);
    }
  };
  
  const styles = {
    card: { backgroundColor: '#18181b', padding: '30px', borderRadius: '12px', border: '1px solid #27272a', maxWidth: '600px', margin: '0 auto' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' },
    backBtn: { background: 'none', border: 'none', color: '#a1a1aa', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' },
    title: { fontSize: '1.2rem', fontWeight: '800', color: '#f4f4f5', margin: 0, textTransform: 'uppercase' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    label: { fontWeight: '700', color: '#a1a1aa', marginBottom: '8px', display: 'block', fontSize: '0.85rem', textTransform: 'uppercase' },
    input: { padding: '14px', border: '1px solid #3f3f46', borderRadius: '6px', width: '100%', fontSize: '1rem', outline: 'none', backgroundColor: '#27272a', color: 'white' },
    typeContainer: { display: 'flex', gap: '10px' },
    typeBtn: (isActive, activeColor) => ({ flex: 1, padding: '14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '800', fontSize: '0.95rem', backgroundColor: isActive ? activeColor : '#27272a', color: isActive ? 'white' : '#71717a', transition: 'all 0.2s' }),
    saveBtn: { padding: '16px', backgroundColor: isEditing ? '#3b82f6' : '#f4f4f5', color: isEditing ? 'white' : '#09090b', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '1rem', marginTop: '10px', width: '100%' }
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <button style={styles.backBtn} onClick={onBillAdded}>VOLTAR</button>
        <h3 style={styles.title}>{isEditing ? 'EDITAR CONTA' : 'NOVA CONTA'}</h3>
        <div style={{width: '50px'}}></div> 
      </div>
      
      <form style={styles.form} onSubmit={handleSave}>
        <div>
          <label style={styles.label}>Tipo de Conta</label>
          <div style={styles.typeContainer}>
            <button type="button" style={styles.typeBtn(type === 'PAYABLE', '#ef4444')} onClick={() => setType('PAYABLE')}>A PAGAR</button>
            <button type="button" style={styles.typeBtn(type === 'RECEIVABLE', '#22c55e')} onClick={() => setType('RECEIVABLE')}>A RECEBER</button>
          </div>
        </div>

        <div>
          <label style={styles.label}>Descrição</label>
          <input style={styles.input} type="text" placeholder="Ex: Aluguel, Renda Extra..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div>
          <label style={styles.label}>Valor (R$)</label>
          <input style={styles.input} type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>

        <div>
            <label style={styles.label}>Data de Vencimento</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={styles.input} />
        </div>
        
        <button style={styles.saveBtn} type="submit" disabled={loading}>
          {loading ? '🤖 Classificando e Agendando...' : isEditing ? 'SALVAR ALTERAÇÕES' : 'AGENDAR CONTA'}
        </button>
      </form>
    </div>
  );
}