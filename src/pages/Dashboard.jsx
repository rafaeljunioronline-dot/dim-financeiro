import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ReservesModal from '../components/ReservesModal';
import EditBalanceModal from '../components/EditBalanceModal';
import { DataBR } from '../components/ui/DataBR';
import { Grana } from '../components/ui/Grana';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

// BANNER DO TRIAL (Mantido)
const TrialBanner = ({ daysLeft }) => {
    if (daysLeft > 3) return null;
    let bgColor = '#3b82f6';
    let msg = `💎 Você tem ${daysLeft} dias de teste grátis. Aproveite!`;

    if (daysLeft <= 1) {
        bgColor = '#eab308';
        msg = "⚠️ Atenção: Seu teste acaba em breve. Assine para não perder o acesso.";
    }

    return (
        <div style={{ backgroundColor: bgColor, color: 'white', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            {msg}
        </div>
    );
};

export default function Dashboard({ wallet, refreshTrigger, onOpenAdjust, setPage, planStatus, daysLeft }) {
  const [loading, setLoading] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [periodIncome, setPeriodIncome] = useState(0);
  const [periodExpense, setPeriodExpense] = useState(0);
  const [reservesTotal, setReservesTotal] = useState(0);
  
  // ESTADOS DE VISIBILIDADE (OLHO)
  const [showReserves, setShowReserves] = useState(false);
  const [showBalance, setShowBalance] = useState(() => localStorage.getItem('showPersonalBalance') === 'true');
  
  const [isReservesOpen, setIsReservesOpen] = useState(false);
  const [filterType, setFilterType] = useState('MONTH');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionsList, setTransactionsList] = useState([]);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);

  useEffect(() => { updateFilterDates('MONTH'); }, []);
  useEffect(() => { if (wallet?.id && startDate && endDate) fetchDashboardData(); }, [wallet, refreshTrigger, startDate, endDate]);

  const toggleBalance = () => {
    const newState = !showBalance;
    setShowBalance(newState);
    localStorage.setItem('showPersonalBalance', newState);
  };

  const updateFilterDates = (type) => {
    setFilterType(type);
    const now = new Date();
    if (type === 'TODAY') {
        const today = now.toISOString().split('T')[0];
        setStartDate(today); setEndDate(today);
    } else if (type === 'WEEK') {
        setStartDate(startOfWeek(now, { weekStartsOn: 0 }).toISOString().split('T')[0]);
        setEndDate(endOfWeek(now, { weekStartsOn: 0 }).toISOString().split('T')[0]);
    } else if (type === 'MONTH') {
        setStartDate(startOfMonth(now).toISOString().split('T')[0]);
        setEndDate(endOfMonth(now).toISOString().split('T')[0]);
    }
  };

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const { data: allTrans } = await supabase.from('transactions').select('id, amount, type, description, category, transaction_date, created_at').eq('wallet_id', wallet.id);
      const { data: allReserves } = await supabase.from('reserves').select('current_amount').eq('wallet_id', wallet.id);

      if (allTrans) {
        const totalInc = allTrans.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        const totalExp = allTrans.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
        setCurrentBalance(totalInc - totalExp);
        const filtered = allTrans.filter(t => t.transaction_date >= startDate && t.transaction_date <= endDate);
        filtered.sort((a, b) => new Date(b.transaction_date) - new Date(a.transaction_date));
        setTransactionsList(filtered);
        setPeriodIncome(filtered.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0));
        setPeriodExpense(filtered.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0));
      }
      if (allReserves) setReservesTotal(allReserves.reduce((acc, r) => acc + (parseFloat(r.current_amount) || 0), 0));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const styles = {
    container: { maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px', fontFamily: 'sans-serif', color: '#e4e4e7' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: 'white' },
    subTitle: { fontSize: '0.9rem', color: '#a1a1aa' },
    addBtn: {
        backgroundColor: '#27272a', color: 'white', padding: '10px 20px', borderRadius: '8px',
        border: '1px solid #3f3f46', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', gap: '8px'
    },
    topRow: { display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' },
    miniCard: {
        flex: 1, minWidth: '240px', backgroundColor: '#18181b',
        padding: '24px', borderRadius: '12px', border: '1px solid #27272a',
        display: 'flex', flexDirection: 'column', justifyContent: 'center'
    },
    miniHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
    miniLabel: { fontSize: '0.75rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    miniValue: { fontSize: '1.8rem', fontWeight: '800', color: '#facc15', letterSpacing: '-0.5px' },
    textBtn: { fontSize: '0.85rem', color: '#a1a1aa', cursor: 'pointer', marginTop: '10px', background: 'none', border: 'none', fontWeight: '600', padding: 0, textAlign: 'left', textDecoration: 'underline' },
    
    // MUDANÇA AQUI: Botão do olho mais limpo
    eyeBtn: { border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#71717a', padding: '4px', transition: 'color 0.2s' },
    
    filterContainer: { marginBottom: '25px' },
    filterLabel: { fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: '#71717a' },
    filterBar: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', backgroundColor: '#18181b', padding: '15px', borderRadius: '8px', border: '1px solid #27272a' },
    filterBtn: (active) => ({
        padding: '8px 16px', borderRadius: '6px', border: active ? '1px solid #facc15' : '1px solid #3f3f46',
        cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600',
        backgroundColor: active ? '#facc15' : 'transparent',
        color: active ? 'black' : '#a1a1aa', transition: 'all 0.2s'
    }),
    dateInput: { padding: '8px', borderRadius: '6px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', outline: 'none', fontSize: '0.9rem' },
    applyBtn: { padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#27272a', color: 'white' },
    summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' },
    summaryCard: (borderColor) => ({ backgroundColor: '#18181b', padding: '20px', borderRadius: '8px', border: '1px solid #27272a', borderLeft: `4px solid ${borderColor}` }),
    summaryLabel: { fontSize: '0.7rem', color: '#71717a', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '5px' },
    summaryValue: (color) => ({ fontSize: '1.3rem', fontWeight: '800', color: color }),
    listContainer: { border: '1px solid #27272a', borderRadius: '8px', backgroundColor: '#18181b', marginBottom: '30px' },
    listHeader: { padding: '15px 20px', borderBottom: '1px solid #27272a', fontWeight: '700', fontSize: '0.95rem', color: 'white' },
    transItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #27272a' },
    transDesc: { fontWeight: '600', color: '#e4e4e7', fontSize: '0.95rem' },
    transMeta: { fontSize: '0.8rem', color: '#71717a', marginTop: '4px' },
  };

  if (loading) return <div style={{textAlign:'center', padding: 40, color:'#71717a'}}>Carregando painel...</div>;

  return (
    <div style={styles.container}>
      
      {planStatus === 'TRIAL' && <TrialBanner daysLeft={daysLeft} />}

      <div style={styles.header}>
        <div style={styles.titleBox}>
            <h2 style={styles.title}>Minhas Finanças</h2>
            <p style={styles.subTitle}>Controle pessoal</p>
        </div>
        <button style={styles.addBtn} onClick={() => setPage('add')}>+ Nova Transação</button>
      </div>

      <div style={styles.topRow}>
        <div style={styles.miniCard}>
            <div style={styles.miniHeader}>
                <span style={styles.miniLabel}>Meu Saldo</span>
                {/* 🔒 AQUI: Se estiver visível mostra Olho, se não mostra Cadeado */}
                <button onClick={toggleBalance} style={styles.eyeBtn} title={showBalance ? "Ocultar" : "Mostrar"}>
                    {showBalance ? '👁️' : '🔒'}
                </button>
            </div>
            <div style={styles.miniValue}>{showBalance ? formatMoney(currentBalance) : 'R$ •••••'}</div>
            <button style={styles.textBtn} onClick={() => setIsAdjustOpen(true)}>Ajustar saldo</button>
        </div>
        <div style={styles.miniCard}>
            <div style={styles.miniHeader}>
                <span style={styles.miniLabel}>Cofrinho</span>
                {/* 🔒 AQUI: Tirei o macaco, coloquei o cadeado */}
                <button onClick={() => setShowReserves(!showReserves)} style={styles.eyeBtn} title={showReserves ? "Ocultar" : "Mostrar"}>
                    {showReserves ? '👁️' : '🔒'}
                </button>
            </div>
            <div style={styles.miniValue}>{showReserves ? formatMoney(reservesTotal) : 'R$ •••••'}</div>
            <button style={styles.textBtn} onClick={() => setIsReservesOpen(true)}>Gerenciar</button>
        </div>
      </div>

      <div style={styles.filterContainer}>
        <div style={styles.filterLabel}>Filtrar Período</div>
        <div style={styles.filterBar}>
            <button style={styles.filterBtn(filterType === 'TODAY')} onClick={() => updateFilterDates('TODAY')}>Hoje</button>
            <button style={styles.filterBtn(filterType === 'WEEK')} onClick={() => updateFilterDates('WEEK')}>Semana</button>
            <button style={styles.filterBtn(filterType === 'MONTH')} onClick={() => updateFilterDates('MONTH')}>Mês</button>
            <span style={{margin: '0 5px', color:'#3f3f46'}}>|</span>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setFilterType('CUSTOM'); }} style={styles.dateInput} />
            <span style={{color:'#71717a'}}>até</span>
            <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setFilterType('CUSTOM'); }} style={styles.dateInput} />
            {filterType === 'CUSTOM' && <button style={styles.applyBtn} onClick={() => fetchDashboardData()}>Ir</button>}
        </div>
      </div>

      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard('#4ade80')}><div style={styles.summaryLabel}>Entradas</div><div style={styles.summaryValue('#4ade80')}>{formatMoney(periodIncome)}</div></div>
        <div style={styles.summaryCard('#f87171')}><div style={styles.summaryLabel}>Saídas</div><div style={styles.summaryValue('#f87171')}>{formatMoney(periodExpense)}</div></div>
      </div>

      <div style={styles.listContainer}>
        <div style={styles.listHeader}>
            Extrato (<DataBR valor={startDate}/> a <DataBR valor={endDate}/>)
        </div>
        <div>
            {transactionsList.length === 0 ? <p style={{textAlign:'center', color:'#71717a', padding:'30px'}}>Sem lançamentos.</p> : transactionsList.map(t => (
                <div key={t.id} style={styles.transItem}>
                    <div>
                        <span style={styles.transDesc}>{t.description}</span>
                        <br/>
                        <span style={styles.transMeta}>
                           <DataBR valor={t.transaction_date} /> • {t.category}
                        </span>
                    </div>
                    <Grana valor={t.amount} tipo={t.type} />
                </div>
            ))}
        </div>
      </div>

      <ReservesModal isOpen={isReservesOpen} onClose={() => setIsReservesOpen(false)} wallet={wallet} onSuccess={fetchDashboardData} />
      <EditBalanceModal isOpen={isAdjustOpen} onClose={() => setIsAdjustOpen(false)} wallet={wallet} currentBalance={currentBalance} onSuccess={fetchDashboardData} />
    </div>
  );
}