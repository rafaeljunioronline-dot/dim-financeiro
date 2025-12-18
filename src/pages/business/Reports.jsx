import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Importação correta
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function BusinessReports({ wallet }) {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    if (wallet) fetchReport();
  }, [wallet]);

  async function fetchReport() {
    const { data: trans } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('transaction_date', { ascending: true });
    
    if(trans) {
        // Lógica simplificada para demonstrar separação
        const labels = trans.map(t => new Date(t.transaction_date).toLocaleDateString());
        const values = trans.map(t => t.type === 'INCOME' ? t.amount : -t.amount);
        
        setData({
            labels,
            datasets: [{
                label: 'Fluxo de Caixa da Empresa',
                data: values,
                backgroundColor: values.map(v => v > 0 ? '#16a34a' : '#dc2626')
            }]
        });
    }
  }

  return (
    <div style={{padding: '20px', backgroundColor: 'white', borderRadius: '10px'}}>
        <h2 style={{color: '#1e1b4b', fontWeight: 'bold', marginBottom: '20px'}}>Relatório Financeiro Empresarial</h2>
        {data ? <Bar data={data} /> : <p>Carregando dados...</p>}
    </div>
  );
}