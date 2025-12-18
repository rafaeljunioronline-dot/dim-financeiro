import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { format } from 'date-fns';

export default function AddTransaction({ onTransactionAdded, editingTransaction, wallet }) {
  const [description, setDescription] = useState(editingTransaction?.description || '');
  const [amount, setAmount] = useState(editingTransaction?.amount || '');
  const [type, setType] = useState(editingTransaction?.type || 'EXPENSE');
  const [date, setDate] = useState(editingTransaction?.transaction_date || format(new Date(), 'yyyy-MM-dd'));
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!description) return alert("Preencha a descrição.");

    setIsSaving(true);

    try {
        let finalCategory = 'Outros'; 
        
        // 1. CHAMA A IA NO MOMENTO DO SAVE (GARANTE QUE CLASSIFICA)
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
                // Se a IA devolver categoria, usa ela. Senão, fica 'Outros'
                if (iaData.category && iaData.category !== 'Uncategorized') {
                    finalCategory = iaData.category;
                }
            }
        } catch (apiError) {
            console.log("IA Offline - Salvando como Outros");
        }

        // 2. SALVA NO BANCO
        const transactionData = {
            wallet_id: wallet.id,
            user_id: wallet.user_id,
            description: description,
            amount: parseFloat(amount || 0),
            type: type,
            category: finalCategory, // AQUI VAI A CATEGORIA DA IA
            transaction_date: date
        };

        let error;
        if (editingTransaction) {
            const { error: updateError } = await supabase
                .from('transactions')
                .update(transactionData)
                .eq('id', editingTransaction.id);
            error = updateError;
        } else {
            const { error: insertError } = await supabase
                .from('transactions')
                .insert([transactionData]);
            error = insertError;
        }

        if (error) throw error;
        onTransactionAdded();

    } catch (error) {
        alert("Erro ao salvar: " + error.message);
    } finally {
        setIsSaving(false);
    }
  };

  const styles = {
    container: { maxWidth: '500px', margin: '0 auto', backgroundColor: '#18181b', padding: '30px', borderRadius: '12px', border: '1px solid #27272a' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: '#f4f4f5', marginBottom: '25px', textAlign: 'center' },
    label: { display: 'block', fontWeight: '600', color: '#a1a1aa', marginBottom: '6px', fontSize: '0.9rem' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontSize: '1rem', outline: 'none', marginBottom: '15px' },
    row: { display: 'flex', gap: '15px', marginBottom: '20px' },
    typeBtn: (isActive, isExpense) => ({
        flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid', cursor: 'pointer', fontWeight: 'bold', textAlign: 'center',
        backgroundColor: isActive ? (isExpense ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)') : '#27272a',
        borderColor: isActive ? (isExpense ? '#ef4444' : '#22c55e') : '#3f3f46',
        color: isActive ? (isExpense ? '#fca5a5' : '#86efac') : '#71717a',
        transition: 'all 0.2s'
    }),
    saveBtn: { width: '100%', padding: '14px', backgroundColor: '#f4f4f5', color: '#09090b', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer', marginTop: '10px', opacity: isSaving ? 0.7 : 1 }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>{editingTransaction ? 'Editar' : 'Nova Transação'}</h2>
      <form onSubmit={handleSave}>
        <div style={styles.row}>
            <div style={styles.typeBtn(type === 'EXPENSE', true)} onClick={() => setType('EXPENSE')}>Saída</div>
            <div style={styles.typeBtn(type === 'INCOME', false)} onClick={() => setType('INCOME')}>Entrada</div>
        </div>

        <label style={styles.label}>Descrição</label>
        <input type="text" style={styles.input} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: Mercado, Uber, Salário..." required autoFocus />

        <label style={styles.label}>Valor (R$)</label>
        <input type="number" step="0.01" style={styles.input} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0,00" />

        <label style={styles.label}>Data</label>
        <input type="date" style={styles.input} value={date} onChange={e => setDate(e.target.value)} required />

        <button type="submit" style={styles.saveBtn} disabled={isSaving}>
            {isSaving ? '🤖 Classificando e Salvando...' : 'Salvar Lançamento'}
        </button>
      </form>
    </div>
  );
}