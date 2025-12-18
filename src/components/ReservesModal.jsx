import { useState, useEffect } from 'react';
// O caminho ../ aponta para a pasta src/ onde está o supabaseClient.js
import { supabase } from '../supabaseClient';

export default function ReservesModal({ isOpen, onClose, wallet, onSuccess }) {
  const [reserves, setReserves] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Formulário (Apenas Criação agora)
  const [formName, setFormName] = useState('');
  const [formGoal, setFormGoal] = useState('');
  const [formCurrent, setFormCurrent] = useState(''); // Depósito Inicial
  
  // Movimentação (Guardar/Sacar via botões rápidos)
  const [movingReserve, setMovingReserve] = useState(null);
  const [moveAmount, setMoveAmount] = useState('');
  const [moveType, setMoveType] = useState('DEPOSIT'); 

  useEffect(() => {
    if (isOpen && wallet?.id) fetchReserves();
  }, [isOpen, wallet]);

  async function fetchReserves() {
    const { data } = await supabase.from('reserves').select('*').eq('wallet_id', wallet.id).order('created_at');
    setReserves(data || []);
  }

  // --- SALVAR (CRIAR) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName) return alert("Dê um nome para o cofrinho.");
    setLoading(true);

    const today = new Date().toISOString().split('T')[0];
    const currentAmount = parseFloat(formCurrent) || 0;
    const goalAmount = parseFloat(formGoal) || 0;

    try {
        // MODO CRIAÇÃO
        const { error } = await supabase.from('reserves').insert([{
            name: formName,
            goal_amount: goalAmount,
            current_amount: currentAmount,
            wallet_id: wallet.id
        }]);

        if (error) throw error;

        // Se teve valor inicial, tira do caixa
        if (currentAmount > 0) {
            await supabase.from('transactions').insert([{
                description: `Aplicação Inicial: ${formName}`,
                amount: currentAmount,
                type: 'EXPENSE',
                category: 'Investimento',
                wallet_id: wallet.id,
                transaction_date: today
            }]);
        }
        alert("Cofrinho criado!");
        setFormName(''); setFormGoal(''); setFormCurrent('');
      
        fetchReserves();
        if (onSuccess) onSuccess();

    } catch (err) {
        alert("Erro: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- MOVIMENTAR RAPIDO (BOTÕES) ---
  const handleMoveMoney = async (e) => {
    e.preventDefault();
    if (!moveAmount || moveAmount <= 0) return alert("Valor inválido");
    setLoading(true);

    try {
        const amount = parseFloat(moveAmount);
        const today = new Date().toISOString().split('T')[0];
        const newBalance = moveType === 'DEPOSIT' 
            ? movingReserve.current_amount + amount 
            : movingReserve.current_amount - amount;

        if (newBalance < 0) throw new Error("Saldo insuficiente.");

        await supabase.from('reserves').update({ current_amount: newBalance }).eq('id', movingReserve.id);

        await supabase.from('transactions').insert([{
            description: moveType === 'DEPOSIT' ? `Aplicação: ${movingReserve.name}` : `Resgate: ${movingReserve.name}`,
            amount: amount,
            type: moveType === 'DEPOSIT' ? 'EXPENSE' : 'INCOME',
            category: 'Investimento',
            wallet_id: wallet.id,
            transaction_date: today
        }]);

        setMovingReserve(null);
        setMoveAmount('');
        fetchReserves();
        if (onSuccess) onSuccess();

    } catch (err) {
        alert("Erro: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  // --- EXCLUIR ---
  const handleDelete = async (id, currentAmount) => {
    if (currentAmount > 0) {
        if (!window.confirm(`ATENÇÃO: R$ ${currentAmount} serão perdidos (não voltam pro caixa).\nDeseja excluir mesmo assim?`)) return;
    } else {
        if (!window.confirm("Excluir cofrinho?")) return;
    }
    await supabase.from('reserves').delete().eq('id', id);
    fetchReserves();
    if (onSuccess) onSuccess();
  };

  if (!isOpen) return null;

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', width: '95%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f0f0f0', paddingBottom: '15px' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: '#1f2937' },
    
    // LISTA
    list: { display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' },
    item: { 
        border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', 
        backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
    },
    itemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' },
    itemName: { fontSize: '1.2rem', fontWeight: '700', color: '#374151' },
    itemMeta: { fontSize: '0.85rem', color: '#9ca3af' },
    itemValue: { fontSize: '1.5rem', fontWeight: '800', color: '#059669' },

    // BOTÕES ORGANIZADOS
    actionsContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #e5e7eb' },
    moveButtons: { display: 'flex', gap: '10px' },
    moveBtn: (bg, color) => ({ padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 'bold', backgroundColor: bg, color: color, display: 'flex', alignItems: 'center', gap: '5px' }),
    
    editButtons: { display: 'flex', gap: '8px' },
    iconBtn: { background: 'white', border: '1px solid #e5e7eb', cursor: 'pointer', fontSize: '1rem', padding: '8px', borderRadius: '8px', color: '#64748b', transition: 'all 0.2s' },

    // FORMULÁRIO
    formBox: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '2px solid #f1f5f9' },
    formTitle: { fontSize: '1rem', fontWeight: '700', color: '#334155', marginBottom: '15px', display: 'flex', justifyContent: 'space-between' },
    formRow: { display: 'flex', gap: '15px', marginBottom: '15px' },
    label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#64748b', marginBottom: '5px' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' },
    warningBox: { backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' },
    saveBtn: { width: '100%', padding: '14px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '15px', fontSize: '1rem' }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
            <h2 style={styles.title}>
               {wallet?.type === 'BUSINESS' ? '🏦 Reservas' : '🐷 Cofrinhos'}
            </h2>
            <button onClick={onClose} style={{border:'none', background:'none', fontSize:'1.8rem', cursor:'pointer', color: '#9ca3af'}}>×</button>
        </div>

        <div style={styles.list}>
            {reserves.length === 0 && <p style={{textAlign:'center', color:'#999', padding:'20px'}}>Nenhum cofrinho criado ainda.</p>}
            
            {reserves.map(res => (
                <div key={res.id} style={styles.item}>
                    <div style={styles.itemTop}>
                        <div>
                            <div style={styles.itemName}>{res.name}</div>
                            {res.goal_amount > 0 && <div style={styles.itemMeta}>Meta: R$ {res.goal_amount.toLocaleString()}</div>}
                        </div>
                        <div style={styles.itemValue}>
                            R$ {res.current_amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </div>
                    </div>

                    {/* BARRA DE BOTÕES SEPARADA */}
                    <div style={styles.actionsContainer}>
                        {/* Lado Esquerdo: Ações Principais */}
                        <div style={styles.moveButtons}>
                            <button style={styles.moveBtn('#dcfce7', '#166534')} onClick={() => { setMovingReserve(res); setMoveType('DEPOSIT'); }}>
                                📥 Guardar
                            </button>
                            <button style={styles.moveBtn('#fee2e2', '#991b1b')} onClick={() => { setMovingReserve(res); setMoveType('WITHDRAW'); }}>
                                📤 Resgatar
                            </button>
                        </div>

                        {/* Lado Direito: Gerenciamento (AGORA SÓ EXCLUIR) */}
                        <div style={styles.editButtons}>
                            {/* BOTÃO DE EDITAR REMOVIDO AQUI */}
                            <button style={{...styles.iconBtn, color: '#ef4444', borderColor: '#fecaca'}} onClick={() => handleDelete(res.id, res.current_amount)} title="Excluir">🗑️</button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* FORMULÁRIO (APENAS CRIAÇÃO) */}
        <div style={styles.formBox}>
            <div style={styles.formTitle}>
                <span>➕ Novo Cofrinho</span>
            </div>
            
            <form onSubmit={handleSave}>
                <div style={{marginBottom: 15}}>
                    <label style={styles.label}>Nome (Ex: Viagem)</label>
                    <input value={formName} onChange={e => setFormName(e.target.value)} style={styles.input} required placeholder="Descrição..." />
                </div>
                
                <div style={styles.formRow}>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Meta (Opcional)</label>
                        <input type="number" value={formGoal} onChange={e => setFormGoal(e.target.value)} style={styles.input} placeholder="0.00" />
                    </div>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Depósito Inicial</label>
                        <input type="number" value={formCurrent} onChange={e => setFormCurrent(e.target.value)} style={styles.input} placeholder="0.00" />
                    </div>
                </div>

                {/* AVISO DE DESCONTO NO CAIXA */}
                {(parseFloat(formCurrent) > 0 && formCurrent !== '') && (
                    <div style={styles.warningBox}>
                        <span>⚠️</span> 
                        <span>O valor inicial será descontado automaticamente do seu caixa principal.</span>
                    </div>
                )}

                <button type="submit" style={styles.saveBtn} disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Cofrinho'}
                </button>
            </form>
        </div>

        {/* MODAL DE MOVIMENTAÇÃO */}
        {movingReserve && (
            <div style={{...styles.overlay, zIndex: 1100}}>
                <div style={{...styles.card, width:'320px'}}>
                    <h3 style={{marginBottom:'10px', color:'#1f2937', textAlign:'center'}}>
                        {moveType === 'DEPOSIT' ? '📥 Guardar Dinheiro' : '📤 Resgatar Dinheiro'}
                    </h3>
                    <p style={{textAlign:'center', marginBottom: 20, color:'#6b7280'}}>
                        {moveType === 'DEPOSIT' ? 'Tirar do Caixa e por em:' : 'Tirar de:'} <b>{movingReserve.name}</b>
                    </p>
                    <input 
                        type="number" autoFocus placeholder="Valor R$" 
                        value={moveAmount} onChange={e => setMoveAmount(e.target.value)}
                        style={{...styles.input, width:'100%', marginBottom:'20px', fontSize:'1.5rem', textAlign:'center', fontWeight:'bold'}}
                    />
                    <div style={{display:'flex', gap:'10px'}}>
                        <button onClick={() => setMovingReserve(null)} style={{...styles.saveBtn, background:'#f3f4f6', color:'#374151', marginTop:0}}>Cancelar</button>
                        <button onClick={handleMoveMoney} style={{...styles.saveBtn, marginTop:0, background: moveType === 'DEPOSIT' ? '#10b981' : '#ef4444'}}>Confirmar</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}