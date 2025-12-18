import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, addDays, parseISO, isBefore, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function FutureCash({ setPage, startEditingBill, refreshTrigger, wallet, showToast, requestConfirm }) {
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [receivables, setReceivables] = useState([]);
  const [payables, setPayables] = useState([]);
  
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);
  const [overdueReceivable, setOverdueReceivable] = useState(0);
  const [overduePayable, setOverduePayable] = useState(0);

  const [filterType, setFilterType] = useState('NEXT30'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { updateFilterDates('NEXT30'); }, []);
  useEffect(() => { if (wallet?.id && startDate && endDate) fetchBills(); }, [wallet, refreshTrigger, startDate, endDate]);

  const updateFilterDates = (type) => {
    setFilterType(type);
    const today = new Date();
    const pastDate = '2000-01-01'; 
    const todayStr = format(today, 'yyyy-MM-dd');

    if (type === 'TODAY') { setStartDate(pastDate); setEndDate(todayStr); }
    else if (type === 'NEXT7') { setStartDate(pastDate); setEndDate(format(addDays(today, 7), 'yyyy-MM-dd')); }
    else if (type === 'NEXT30') { setStartDate(pastDate); setEndDate(format(addDays(today, 30), 'yyyy-MM-dd')); }
  };

  async function fetchBills() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('bills').select('*')
        .eq('wallet_id', wallet.id).eq('status', 'PENDING')
        .gte('due_date', startDate).lte('due_date', endDate).order('due_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const recv = data.filter(b => b.type === 'RECEIVABLE');
        const pay = data.filter(b => b.type === 'PAYABLE');
        setReceivables(recv); setPayables(pay);
        setTotalReceivable(recv.reduce((acc, curr) => acc + parseFloat(curr.amount), 0));
        setTotalPayable(pay.reduce((acc, curr) => acc + parseFloat(curr.amount), 0));

        const todayStart = startOfDay(new Date());
        const isOverdue = (bill) => isBefore(parseISO(bill.due_date), todayStart);
        setOverdueReceivable(recv.filter(isOverdue).reduce((acc, curr) => acc + parseFloat(curr.amount), 0));
        setOverduePayable(pay.filter(isOverdue).reduce((acc, curr) => acc + parseFloat(curr.amount), 0));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const handleDelete = (id) => {
    if (isProcessing) return;
    requestConfirm('Excluir Lançamento', 'Tem certeza?', async () => {
        await supabase.from('bills').delete().eq('id', id);
        if (showToast) showToast('Excluído.');
        fetchBills();
    }, true);
  };

  const handleStatusToggle = (bill) => {
    if (isProcessing) return;
    const actionName = bill.type === 'PAYABLE' ? 'Pagar' : 'Receber';
    const successWord = bill.type === 'PAYABLE' ? 'paga' : 'recebida';
    const amountFormatted = formatMoney(bill.amount);

    requestConfirm(`Confirmar ${actionName}`, `Deseja marcar como ${actionName.toLowerCase()} o valor de ${amountFormatted}?`, async () => {
        setIsProcessing(true);
        try {
            // 1. Marca como PAGO na tabela bills
            await supabase.from('bills').update({ status: 'PAID' }).eq('id', bill.id);
            
            // 2. Cria a Transação no Extrato (CORREÇÃO DE CATEGORIA AQUI)
            const todayLocal = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD
            
            // Tenta pegar a categoria da conta. Se não tiver, usa 'Outros' (melhor que 'Contas')
            const finalCategory = bill.category && bill.category !== '' ? bill.category : 'Outros';

            const { error: transError } = await supabase.from('transactions').insert([{
                description: `Baixa: ${bill.description}`, // Tirei o "Baixa de Conta:" pra ficar mais limpo
                amount: bill.amount,
                type: bill.type === 'PAYABLE' ? 'EXPENSE' : 'INCOME',
                category: finalCategory, 
                wallet_id: wallet.id, 
                user_id: wallet.user_id,
                transaction_date: todayLocal
            }]);

            if (transError) {
                console.error("Erro ao criar transação:", transError);
                alert("A conta foi marcada como paga, mas houve um erro ao gerar o extrato.");
            } else {
                if (showToast) showToast(`Conta ${successWord} com sucesso!`);
            }
            
            await fetchBills();
        } catch (error) { console.error(error); } finally { setIsProcessing(false); }
    });
  };

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  const formatDate = (dateStr) => { try { return format(parseISO(dateStr), 'dd/MM', { locale: ptBR }); } catch { return '--/--'; } };

  const getStatusInfo = (bill) => {
    const due = parseISO(bill.due_date);
    const todayStart = startOfDay(new Date());
    if (isSameDay(due, new Date())) return { label: 'VENCE HOJE', color: '#facc15', bg: '#422006' }; 
    if (isBefore(due, todayStart)) return { label: 'VENCIDO', color: '#f87171', bg: '#450a0a' }; 
    return { label: 'PENDENTE', color: '#a1a1aa', bg: '#27272a' }; 
  };

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px', fontFamily: 'sans-serif', color: '#e4e4e7' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: 'white' },
    addBtn: { backgroundColor: '#27272a', color: 'white', padding: '10px 20px', borderRadius: '6px', border: '1px solid #3f3f46', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem' },
    filterContainer: { marginBottom: '30px', backgroundColor: '#18181b', padding: '15px', borderRadius: '8px', border: '1px solid #27272a', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' },
    filterLabel: { fontSize: '0.85rem', fontWeight: '700', color: '#a1a1aa', marginRight: '5px' },
    filterBtn: (active) => ({ padding: '8px 16px', borderRadius: '4px', border: active ? '1px solid #facc15' : '1px solid #3f3f46', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', backgroundColor: active ? '#facc15' : 'transparent', color: active ? 'black' : '#a1a1aa', transition: 'all 0.2s' }),
    dateInput: { padding: '8px', borderRadius: '4px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', outline: 'none', fontSize: '0.85rem' },
    applyBtn: { padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#27272a', color: 'white' },
    mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px' },
    column: { backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', overflow: 'hidden' },
    colHeader: (bg) => ({ backgroundColor: bg, padding: '20px', borderBottom: '1px solid #27272a', color: 'white' }),
    colTitle: { fontSize: '1rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 },
    colTotal: { fontSize: '1.8rem', fontWeight: '800', marginTop: '5px' },
    overdueAlert: { marginTop: '8px', fontSize: '0.85rem', backgroundColor: 'rgba(0,0,0,0.4)', padding: '4px 8px', borderRadius: '4px', display: 'inline-block', fontWeight: '600' },
    list: { padding: '0' },
    item: { display: 'flex', alignItems: 'center', padding: '15px 10px', borderBottom: '1px solid #27272a', transition: 'background 0.1s', gap: '15px' },
    deleteBtnLeft: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#f87171', opacity: 0.6, padding: '5px' },
    itemDateBox: { width: '45px', textAlign: 'center', padding: '4px', borderRadius: '4px', backgroundColor: '#27272a', border: '1px solid #3f3f46' },
    itemDay: { display: 'block', fontSize: '0.9rem', fontWeight: 'bold', color: 'white' },
    itemMonth: { fontSize: '0.65rem', color: '#a1a1aa', textTransform: 'uppercase' },
    itemContent: { flex: 1 },
    itemDesc: { fontWeight: '600', color: '#e4e4e7', fontSize: '0.9rem', display: 'block' },
    statusBadge: (st) => ({ fontSize: '0.65rem', fontWeight: '700', color: st.color, backgroundColor: st.bg, textTransform: 'uppercase', marginTop: '2px', display: 'inline-block', padding: '2px 6px', borderRadius: '4px' }),
    itemAmount: { fontWeight: '800', fontSize: '0.95rem' },
    checkBtnRight: (color) => ({ 
        background: '#27272a', border: `2px solid ${color}`, borderRadius: '50%', cursor: 'pointer', 
        width: '32px', height: '32px', color: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem', marginLeft: '5px', transition: 'all 0.2s', opacity: isProcessing ? 0.3 : 1 
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>Gestão de Contas</h2>
        <button style={styles.addBtn} onClick={() => setPage("add-future-cash")}>+ Nova Conta</button>
      </div>

      <div style={styles.filterContainer}>
        <span style={styles.filterLabel}>Visualizar:</span>
        <button style={styles.filterBtn(filterType === 'TODAY')} onClick={() => updateFilterDates('TODAY')}>Hoje</button>
        <button style={styles.filterBtn(filterType === 'NEXT7')} onClick={() => updateFilterDates('NEXT7')}>Próx. 7 Dias</button>
        <button style={styles.filterBtn(filterType === 'NEXT30')} onClick={() => updateFilterDates('NEXT30')}>Próx. 30 Dias</button>
        <span style={{color:'#71717a'}}>|</span>
        <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setFilterType('CUSTOM'); }} style={styles.dateInput} />
        <span style={{fontSize:'0.85rem', color:'#71717a'}}>a</span>
        <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setFilterType('CUSTOM'); }} style={styles.dateInput} />
        {filterType === 'CUSTOM' && <button style={styles.applyBtn} onClick={() => fetchBills()}>Filtrar</button>}
      </div>

      <div style={styles.mainGrid}>
        
        <div style={styles.column}>
            <div style={styles.colHeader('#14532d')}>
                <div style={styles.colTitle}>Contas a Receber</div>
                <div style={styles.colTotal}>{formatMoney(totalReceivable)}</div>
                {overdueReceivable > 0 && <div style={styles.overdueAlert}>⚠️ Vencido: {formatMoney(overdueReceivable)}</div>}
            </div>
            
            <div style={styles.list}>
                {loading ? <p style={{padding:20, textAlign:'center', color:'#71717a'}}>Carregando...</p> : receivables.length === 0 ? <p style={{padding:20, textAlign:'center', color:'#71717a'}}>Nada a receber.</p> : receivables.map(item => {
                    const st = getStatusInfo(item);
                    return (
                        <div key={item.id} style={styles.item}>
                            <button onClick={() => handleDelete(item.id)} style={styles.deleteBtnLeft} title="Excluir" disabled={isProcessing}>🗑️</button>
                            <div style={styles.itemDateBox}>
                                <span style={styles.itemDay}>{formatDate(item.due_date).split('/')[0]}</span>
                                <span style={styles.itemMonth}>{formatDate(item.due_date).split('/')[1]}</span>
                            </div>
                            <div style={styles.itemContent}>
                                <span style={styles.itemDesc}>{item.description}</span>
                                <span style={styles.statusBadge(st)}>{st.label}</span>
                                <div style={{fontSize: '0.7rem', color:'#71717a'}}>{item.category || 'Contas'}</div>
                            </div>
                            <div style={{...styles.itemAmount, color: '#4ade80'}}>{formatMoney(item.amount)}</div>
                            <button onClick={() => handleStatusToggle(item)} style={styles.checkBtnRight('#4ade80')} title="Receber" disabled={isProcessing}>✓</button>
                        </div>
                    );
                })}
            </div>
        </div>

        <div style={styles.column}>
            <div style={styles.colHeader('#7f1d1d')}>
                <div style={styles.colTitle}>Contas a Pagar</div>
                <div style={styles.colTotal}>{formatMoney(totalPayable)}</div>
                {overduePayable > 0 && <div style={styles.overdueAlert}>⚠️ Vencido: {formatMoney(overduePayable)}</div>}
            </div>
            <div style={styles.list}>
                {loading ? <p style={{padding:20, textAlign:'center', color:'#71717a'}}>Carregando...</p> : payables.length === 0 ? <p style={{padding:20, textAlign:'center', color:'#71717a'}}>Nada a pagar.</p> : payables.map(item => {
                    const st = getStatusInfo(item);
                    return (
                        <div key={item.id} style={styles.item}>
                            <button onClick={() => handleDelete(item.id)} style={styles.deleteBtnLeft} title="Excluir" disabled={isProcessing}>🗑️</button>
                            <div style={styles.itemDateBox}>
                                <span style={styles.itemDay}>{formatDate(item.due_date).split('/')[0]}</span>
                                <span style={styles.itemMonth}>{formatDate(item.due_date).split('/')[1]}</span>
                            </div>
                            <div style={styles.itemContent}>
                                <span style={styles.itemDesc}>{item.description}</span>
                                <span style={styles.statusBadge(st)}>{st.label}</span>
                                <div style={{fontSize: '0.7rem', color:'#71717a'}}>{item.category || 'Contas'}</div>
                            </div>
                            <div style={{...styles.itemAmount, color: '#f87171'}}>{formatMoney(item.amount)}</div>
                            <button onClick={() => handleStatusToggle(item)} style={styles.checkBtnRight('#f87171')} title="Pagar" disabled={isProcessing}>✓</button>
                        </div>
                    );
                })}
            </div>
        </div>

      </div>
    </div>
  );
}