import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, parseISO, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reports({ wallet }) {
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('MONTH'); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summary, setSummary] = useState({ income: 0, expense: 0, balance: 0 });
  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [chartData, setChartData] = useState([]);

  // Cores Dark Neon
  const INCOME_PALETTE = ['#4ade80', '#22d3ee', '#a78bfa', '#2dd4bf'];
  const EXPENSE_PALETTE = ['#f87171', '#fb923c', '#facc15', '#e879f9'];

  useEffect(() => { updateFilterDates('MONTH'); }, []);
  useEffect(() => { if (wallet?.id && startDate && endDate) fetchData(); }, [wallet, startDate, endDate]);

  const updateFilterDates = (type) => {
    setFilterType(type);
    const now = new Date();
    if (type === 'TODAY') { const t = now.toISOString().split('T')[0]; setStartDate(t); setEndDate(t); }
    else if (type === 'WEEK') { setStartDate(format(startOfWeek(now), 'yyyy-MM-dd')); setEndDate(format(endOfWeek(now), 'yyyy-MM-dd')); }
    else if (type === 'MONTH') { setStartDate(format(startOfMonth(now), 'yyyy-MM-dd')); setEndDate(format(endOfMonth(now), 'yyyy-MM-dd')); }
  };

  async function fetchData() {
    setLoading(true);
    try {
      const { data: trans, error } = await supabase.from('transactions').select('*')
        .eq('wallet_id', wallet.id).gte('transaction_date', startDate).lte('transaction_date', endDate).order('transaction_date', { ascending: true });
      if (error) throw error;
      processData(trans || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }

  function processData(transactions) {
    let totalIncome = 0, totalExpense = 0;
    const incCats = {}, expCats = {}, dailyMap = {};

    transactions.forEach(t => {
      const val = parseFloat(t.amount);
      const cat = t.category || 'Outros';
      const date = t.transaction_date;
      if (!dailyMap[date]) dailyMap[date] = 0;

      if (t.type === 'INCOME') {
        totalIncome += val; incCats[cat] = (incCats[cat] || 0) + val; dailyMap[date] += val;
      } else {
        totalExpense += val; expCats[cat] = (expCats[cat] || 0) + val; dailyMap[date] -= val;
      }
    });

    let timeline = [];
    try {
        const interval = eachDayOfInterval({ start: parseISO(startDate), end: parseISO(endDate) });
        let accumulated = 0;
        timeline = interval.map(dateObj => {
            const dateStr = format(dateObj, 'yyyy-MM-dd');
            accumulated += dailyMap[dateStr] || 0;
            return { date: format(dateObj, 'dd/MM'), value: accumulated };
        });
    } catch (e) { timeline = []; }

    setSummary({ income: totalIncome, expense: totalExpense, balance: totalIncome - totalExpense });
    setChartData(timeline);
    setIncomeCategories(Object.keys(incCats).map(k => ({ name: k, value: incCats[k] })).sort((a,b) => b.value - a.value));
    setExpenseCategories(Object.keys(expCats).map(k => ({ name: k, value: expCats[k] })).sort((a,b) => b.value - a.value));
  }

  const formatMoney = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  // Componentes Gráficos (Dark Mode)
  const PieChart = ({ data, palette }) => {
    if (!data.length) return <div style={{width:100, height:100, borderRadius:'50%', border:'2px dashed #3f3f46', margin:'0 auto'}}></div>;
    const total = data.reduce((a, b) => a + b.value, 0);
    let currentDeg = 0;
    const gradient = data.map((item, index) => {
        const deg = (item.value / total) * 360;
        const str = `${palette[index % palette.length]} ${currentDeg}deg ${currentDeg + deg}deg`;
        currentDeg += deg; return str;
    }).join(', ');
    return <div style={{width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(${gradient})`, margin: '0 auto', border: '4px solid #18181b'}}></div>;
  };

  const LineChart = ({ data }) => {
    if (!data || data.length < 2) return <p style={{textAlign:'center', color:'#52525b', padding: 20}}>Sem dados suficientes.</p>;
    const minVal = Math.min(...data.map(d => d.value));
    const maxVal = Math.max(...data.map(d => d.value));
    const range = maxVal - minVal || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - ((d.value - minVal) / range) * 100;
        return `${x},${y}`;
    }).join(' ');
    return (
        <div style={{width: '100%', height: '100px', position: 'relative', marginTop: '20px'}}>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{width: '100%', height: '100%'}}>
                <polyline fill="none" stroke="#facc15" strokeWidth="2" points={points} vectorEffect="non-scaling-stroke" />
            </svg>
        </div>
    );
  };

  // --- ESTILOS DARK ---
  const styles = {
    container: { maxWidth: '1000px', margin: '0 auto', paddingBottom: '60px', fontFamily: 'sans-serif', color: '#e4e4e7' },
    header: { marginBottom: '25px' },
    title: { fontSize: '1.8rem', fontWeight: '800', color: 'white' },
    
    filterContainer: { marginBottom: '30px', backgroundColor: '#18181b', padding: '15px', borderRadius: '8px', border: '1px solid #27272a', display: 'flex', gap: '15px', alignItems: 'center' },
    filterBtn: (active) => ({ padding: '8px 16px', borderRadius: '4px', border: active ? '1px solid #facc15' : '1px solid #3f3f46', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: active ? '#facc15' : 'transparent', color: active ? 'black' : '#a1a1aa' }),
    
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' },
    card: { backgroundColor: '#18181b', padding: '24px', borderRadius: '12px', border: '1px solid #27272a' },
    cardTitle: { fontSize: '1rem', fontWeight: '800', color: 'white', marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #27272a' },
    
    itemRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #27272a', fontSize: '0.9rem' },
    dot: (c) => ({ width:8, height:8, borderRadius:'50%', background:c, display:'inline-block', marginRight:8 }),
    
    bigNumber: (c) => ({ fontSize: '1.8rem', fontWeight: '800', color: c })
  };

  if (loading) return <div style={{textAlign:'center', padding: 40, color:'#71717a'}}>Carregando...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}><h2 style={styles.title}>Relatórios</h2></div>

      <div style={styles.filterContainer}>
        <button style={styles.filterBtn(filterType === 'MONTH')} onClick={() => updateFilterDates('MONTH')}>Mês Atual</button>
        <button style={styles.filterBtn(filterType === 'WEEK')} onClick={() => updateFilterDates('WEEK')}>Semana</button>
      </div>

      <div style={{display:'flex', gap:'20px', marginBottom:'30px'}}>
        <div style={{flex:1, ...styles.card, borderLeft:'4px solid #4ade80'}}>
            <div style={{color:'#71717a', fontSize:'0.8rem', fontWeight:'bold'}}>ENTRADAS</div>
            <div style={styles.bigNumber('#4ade80')}>{formatMoney(summary.income)}</div>
        </div>
        <div style={{flex:1, ...styles.card, borderLeft:'4px solid #f87171'}}>
            <div style={{color:'#71717a', fontSize:'0.8rem', fontWeight:'bold'}}>SAÍDAS</div>
            <div style={styles.bigNumber('#f87171')}>{formatMoney(summary.expense)}</div>
        </div>
        <div style={{flex:1, ...styles.card, borderLeft:`4px solid ${summary.balance >= 0 ? '#facc15' : '#f87171'}`}}>
            <div style={{color:'#71717a', fontSize:'0.8rem', fontWeight:'bold'}}>BALANÇO</div>
            <div style={styles.bigNumber(summary.balance >= 0 ? '#facc15' : '#f87171')}>{formatMoney(summary.balance)}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Evolução do Saldo</div>
        <LineChart data={chartData} />
      </div>

      <div style={{...styles.grid, marginTop:'20px'}}>
        <div style={styles.card}>
            <div style={styles.cardTitle}>Para onde foi o dinheiro?</div>
            <div style={{display:'flex', gap:'20px'}}>
                <PieChart data={expenseCategories} palette={EXPENSE_PALETTE} />
                <div style={{flex:1}}>
                    {expenseCategories.slice(0, 5).map((c, i) => (
                        <div key={i} style={styles.itemRow}>
                            <span><span style={styles.dot(EXPENSE_PALETTE[i%EXPENSE_PALETTE.length])}></span>{c.name}</span>
                            <span style={{fontWeight:'bold'}}>{formatMoney(c.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div style={styles.card}>
            <div style={styles.cardTitle}>De onde veio?</div>
            <div style={{display:'flex', gap:'20px'}}>
                <PieChart data={incomeCategories} palette={INCOME_PALETTE} />
                <div style={{flex:1}}>
                    {incomeCategories.slice(0, 5).map((c, i) => (
                        <div key={i} style={styles.itemRow}>
                            <span><span style={styles.dot(INCOME_PALETTE[i%INCOME_PALETTE.length])}></span>{c.name}</span>
                            <span style={{fontWeight:'bold'}}>{formatMoney(c.value)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}