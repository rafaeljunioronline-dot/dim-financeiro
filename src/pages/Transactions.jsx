import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export default function Transactions({ wallet, setPage, startEditing, refreshTrigger, requestConfirm, showToast }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  
  // Filtros
  const [filterType, setFilterType] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Totais
  const [periodIncome, setPeriodIncome] = useState(0);
  const [periodExpense, setPeriodExpense] = useState(0);
  const [periodBalance, setPeriodBalance] = useState(0);

  useEffect(() => { updateFilterDates('MONTH'); }, []);
  useEffect(() => { if (wallet?.id && startDate && endDate) fetchTransactions(); }, [wallet, refreshTrigger, startDate, endDate]);

  const updateFilterDates = (type) => {
    setFilterType(type);
    const now = new Date();
    if (type === 'TODAY') {
        const today = format(now, 'yyyy-MM-dd');
        setStartDate(today); setEndDate(today);
    } else if (type === 'WEEK') {
        const start = startOfWeek(now, { weekStartsOn: 0 });
        const end = endOfWeek(now, { weekStartsOn: 0 });
        setStartDate(format(start, 'yyyy-MM-dd')); setEndDate(format(end, 'yyyy-MM-dd'));
    } else if (type === 'MONTH') {
        const start = startOfMonth(now);
        const end = endOfMonth(now);
        setStartDate(format(start, 'yyyy-MM-dd')); setEndDate(format(end, 'yyyy-MM-dd'));
    }
  };

  async function fetchTransactions() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('transactions').select('*')
        .eq('wallet_id', wallet.id).gte('transaction_date', startDate).lte('transaction_date', endDate)
        .order('transaction_date', { ascending: false }).order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
      calculateTotals(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const calculateTotals = (data) => {
    const income = data.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const expense = data.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    setPeriodIncome(income); setPeriodExpense(expense); setPeriodBalance(income - expense);
  };

  const handleDelete = (id) => {
    requestConfirm('Excluir Lançamento', 'Tem certeza que deseja excluir?', async () => {
        const { error } = await supabase.from('transactions').delete().eq('id', id);
        if (error) { if (showToast) showToast("Erro ao excluir.", "error"); } 
        else { if (showToast) showToast("Excluído."); fetchTransactions(); }
    }, true);
  };

  const displayedTransactions = transactions.filter(t => {
    if (typeFilter === 'ALL') return true;
    return t.type === typeFilter;
  });

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
  // --- CORREÇÃO DE DATA AQUI ---
  // Ignora o fuso horário local e lê a data como se fosse UTC (Universal)
  const formatDate = (dateStr) => { 
      if (!dateStr) return '--/--';
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: '2-digit' });
  };

  // --- ESTILOS DARK ---
  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px', fontFamily: 'sans-serif', color: '#e4e4e7' },
    
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: 'white' },
    
    addBtn: { 
        backgroundColor: '#27272a', color: 'white', padding: '10px 20px', borderRadius: '6px', 
        border: '1px solid #3f3f46', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem'
    },

    filterContainer: { backgroundColor: '#18181b', padding: '20px', borderRadius: '8px', border: '1px solid #27272a', marginBottom: '20px' },
    filterLabel: { fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: '#a1a1aa' },
    filterBar: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
    
    filterBtn: (active) => ({
        padding: '8px 16px', borderRadius: '6px', border: active ? '1px solid #facc15' : '1px solid #3f3f46', 
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', 
        backgroundColor: active ? '#facc15' : 'transparent', 
        color: active ? 'black' : '#a1a1aa', transition: 'all 0.2s'
    }),
    
    dateInput: { padding: '8px', borderRadius: '6px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', outline: 'none', fontSize: '0.9rem' },
    applyBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#27272a', color: 'white' },

    summaryRow: { display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' },
    summaryCard: (color, borderColor) => ({ 
        flex: 1, backgroundColor: '#18181b', padding: '15px', borderRadius: '8px', 
        border: '1px solid #27272a', borderLeft: `4px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', minWidth: '150px'
    }),
    summaryLabel: { fontSize: '0.75rem', fontWeight: 'bold', color: '#71717a', textTransform: 'uppercase', marginBottom: '5px' },
    summaryValue: (color) => ({ fontSize: '1.4rem', fontWeight: '800', color: color }),

    listContainer: { backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #27272a', overflow: 'hidden' },
    
    listHeader: { 
        padding: '15px 20px', backgroundColor: '#27272a', borderBottom: '1px solid #27272a',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px'
    },
    
    typeFilterContainer: { display: 'flex', gap: '5px' },
    typeBtn: (active, activeColor) => ({
        padding: '6px 12px', borderRadius: '20px', border: '1px solid transparent', 
        cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold', 
        backgroundColor: active ? activeColor : '#3f3f46', 
        color: active ? 'white' : '#a1a1aa', transition: 'all 0.2s'
    }),

    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #27272a' },
    rowLeft: { display: 'flex', flexDirection: 'column', gap: '2px' },
    desc: { fontWeight: '600', color: '#e4e4e7', fontSize: '1rem' },
    meta: { fontSize: '0.85rem', color: '#71717a' },
    rowRight: { display: 'flex', alignItems: 'center', gap: '15px' },
    amount: (type) => ({ fontWeight: 'bold', fontSize: '1rem', color: type === 'INCOME' ? '#4ade80' : '#f87171' }),
    
    actionBtnGroup: { display: 'flex', gap: '8px' },
    iconBtn: () => ({ 
        padding: '6px 10px', borderRadius: '6px', border: '1px solid #3f3f46', 
        backgroundColor: '#27272a', color: 'white', cursor: 'pointer', fontSize: '0.9rem',
        transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center'
    })
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <h2 style={styles.title}>Extrato Financeiro</h2>
        <button style={styles.addBtn} onClick={() => setPage("add")}>+ Novo Lançamento</button>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterLabel}>Período</div>
        <div style={styles.filterBar}>
            <button style={styles.filterBtn(filterType === 'TODAY')} onClick={() => updateFilterDates('TODAY')}>Hoje</button>
            <button style={styles.filterBtn(filterType === 'WEEK')} onClick={() => updateFilterDates('WEEK')}>Semana</button>
            <button style={styles.filterBtn(filterType === 'MONTH')} onClick={() => updateFilterDates('MONTH')}>Mês</button>
            <span style={{margin: '0 5px', color:'#3f3f46'}}>|</span>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setFilterType('CUSTOM'); }} style={styles.dateInput} />
            <span style={{fontSize:'0.8rem', color:'#71717a'}}>até</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setFilterType('CUSTOM'); }} style={styles.dateInput} />
            {filterType === 'CUSTOM' && <button style={styles.applyBtn} onClick={() => fetchTransactions()}>Filtrar</button>}
        </div>
      </div>

      <div style={styles.summaryRow}>
        <div style={styles.summaryCard('#4ade80', '#4ade80')}>
            <div style={styles.summaryLabel}>Entradas</div>
            <div style={styles.summaryValue('#4ade80')}>{formatMoney(periodIncome)}</div>
        </div>
        <div style={styles.summaryCard('#f87171', '#f87171')}>
            <div style={styles.summaryLabel}>Saídas</div>
            <div style={styles.summaryValue('#f87171')}>{formatMoney(periodExpense)}</div>
        </div>
        <div style={styles.summaryCard(periodBalance >= 0 ? 'white' : '#f87171', periodBalance >= 0 ? 'white' : '#f87171')}>
            <div style={styles.summaryLabel}>Balanço do Período</div>
            <div style={styles.summaryValue(periodBalance >= 0 ? 'white' : '#f87171')}>{formatMoney(periodBalance)}</div>
        </div>
      </div>

      <div style={styles.listContainer}>
        <div style={styles.listHeader}>
            <div style={styles.typeFilterContainer}>
                <button style={styles.typeBtn(typeFilter === 'ALL', '#334155')} onClick={() => setTypeFilter('ALL')}>Todos</button>
                <button style={styles.typeBtn(typeFilter === 'INCOME', '#15803d')} onClick={() => setTypeFilter('INCOME')}>Entradas</button>
                <button style={styles.typeBtn(typeFilter === 'EXPENSE', '#b91c1c')} onClick={() => setTypeFilter('EXPENSE')}>Saídas</button>
            </div>
            <span style={{fontSize:'0.8rem', color:'#a1a1aa', fontWeight:'600'}}>{displayedTransactions.length} lançamentos</span>
        </div>

        {loading ? <p style={{padding: 20, textAlign:'center', color:'#a1a1aa'}}>Carregando...</p> : (
            <div>
                {displayedTransactions.length === 0 ? (
                    <p style={{textAlign:'center', padding:'40px', color:'#71717a'}}>Nenhum lançamento encontrado.</p>
                ) : (
                    displayedTransactions.map(t => (
                        <div key={t.id} style={styles.row}>
                            <div style={styles.rowLeft}>
                                <span style={styles.desc}>{t.description}</span>
                                <span style={styles.meta}>{formatDate(t.transaction_date)} • {t.category}</span>
                            </div>
                            <div style={styles.rowRight}>
                                <span style={styles.amount(t.type)}>
                                    {t.type === 'INCOME' ? '+' : '-'} {formatMoney(t.amount)}
                                </span>
                                <div style={styles.actionBtnGroup}>
                                    <button onClick={() => startEditing(t)} style={styles.iconBtn()} title="Editar">✏️</button>
                                    <button onClick={() => handleDelete(t.id)} style={styles.iconBtn()} title="Excluir">🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}
      </div>
    </div>
  );
}