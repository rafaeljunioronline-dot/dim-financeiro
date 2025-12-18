import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Categories({ wallet, showToast, requestConfirm }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('EXPENSE'); 
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#71717a');

  const PRESET_COLORS = ['#71717a', '#ef4444', '#f97316', '#facc15', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#f43f5e'];

  useEffect(() => { if (wallet) fetchCategories(); }, [wallet, activeTab]);

  async function fetchCategories() {
    setLoading(true);
    try {
      const scope = wallet.type === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL';
      const { data, error } = await supabase.from('categories').select('*').eq('scope', scope).eq('type', activeTab).order('name', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName) return;
    try {
      const scope = wallet.type === 'BUSINESS' ? 'BUSINESS' : 'PERSONAL';
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('categories').insert([{ name: newName, color: newColor, type: activeTab, scope: scope, user_id: user.id }]);
      if (error) throw error;
      showToast('Categoria criada!');
      setNewName(''); setIsCreating(false); fetchCategories();
    } catch (error) { showToast(error.message, 'error'); }
  };

  const handleDelete = (id) => {
    requestConfirm('Excluir Categoria', 'Tem certeza?', async () => {
        await supabase.from('categories').delete().eq('id', id);
        showToast('Excluída.'); fetchCategories();
    }, true);
  };

  // --- ESTILOS DARK ---
  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#e4e4e7' },
    
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
    title: { fontSize: '1.8rem', fontWeight: '800', color: 'white' },
    subtitle: { color: '#a1a1aa', fontSize: '0.9rem' },
    
    tabs: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #27272a', paddingBottom: '10px' },
    tab: (active) => ({
        padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer',
        fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.2s',
        backgroundColor: active ? (activeTab === 'INCOME' ? '#14532d' : '#450a0a') : 'transparent',
        color: active ? (activeTab === 'INCOME' ? '#4ade80' : '#f87171') : '#71717a'
    }),

    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' },
    card: { 
        backgroundColor: '#18181b', padding: '15px', borderRadius: '10px', border: '1px solid #27272a',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
    },
    colorDot: (c) => ({ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: c, marginRight: '10px' }),
    name: { fontWeight: '600', color: '#e4e4e7', flex: 1 },
    delBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#52525b', fontSize: '1.2rem', padding: '0 5px' },

    createBox: { backgroundColor: '#27272a', padding: '20px', borderRadius: '12px', border: '1px dashed #3f3f46', marginBottom: '30px' },
    input: { padding: '10px', borderRadius: '6px', border: '1px solid #3f3f46', marginRight: '10px', width: '200px', backgroundColor: '#18181b', color: 'white', outline: 'none' },
    colorPicker: { display: 'flex', gap: '5px', margin: '10px 0', flexWrap: 'wrap' },
    colorOption: (c, selected) => ({ 
        width: '24px', height: '24px', borderRadius: '50%', backgroundColor: c, cursor: 'pointer',
        border: selected ? '2px solid white' : '2px solid transparent'
    }),
    saveBtn: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: '#facc15', color: 'black', fontWeight: 'bold', cursor: 'pointer' },
    cancelBtn: { padding: '10px 20px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#a1a1aa', cursor: 'pointer', marginLeft: '10px' },
    
    addBtnMain: { padding: '10px 20px', borderRadius: '6px', border: '1px solid #3f3f46', backgroundColor: '#27272a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
            <h1 style={styles.title}>Categorias</h1>
            <p style={styles.subtitle}>Gerenciando <strong>{wallet?.type === 'BUSINESS' ? 'Empresarial' : 'Pessoal'}</strong></p>
        </div>
        {!isCreating && <button onClick={() => setIsCreating(true)} style={styles.addBtnMain}>+ Nova Categoria</button>}
      </div>

      {isCreating && (
        <form style={styles.createBox} onSubmit={handleCreate}>
            <div style={{marginBottom:'10px', fontWeight:'bold', color:'#a1a1aa'}}>Nome</div>
            <input style={styles.input} placeholder="Ex: Combustível" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
            <div style={{marginTop:'15px', fontWeight:'bold', color:'#a1a1aa'}}>Cor</div>
            <div style={styles.colorPicker}>
                {PRESET_COLORS.map(c => (<div key={c} style={styles.colorOption(c, newColor === c)} onClick={() => setNewColor(c)} />))}
            </div>
            <div style={{marginTop: '20px'}}>
                <button type="submit" style={styles.saveBtn}>Salvar</button>
                <button type="button" style={styles.cancelBtn} onClick={() => setIsCreating(false)}>Cancelar</button>
            </div>
        </form>
      )}

      <div style={styles.tabs}>
        <button style={styles.tab(activeTab === 'EXPENSE')} onClick={() => setActiveTab('EXPENSE')}>Despesas</button>
        <button style={styles.tab(activeTab === 'INCOME')} onClick={() => setActiveTab('INCOME')}>Receitas</button>
      </div>

      <div style={styles.grid}>
        {categories.map(cat => (
            <div key={cat.id} style={styles.card}>
                <div style={{display:'flex', alignItems:'center'}}>
                    <div style={styles.colorDot(cat.color)}></div>
                    <span style={styles.name}>{cat.name}</span>
                </div>
                <button style={styles.delBtn} onClick={() => handleDelete(cat.id)}>&times;</button>
            </div>
        ))}
        {!loading && categories.length === 0 && <div style={{color:'#52525b', fontStyle:'italic', padding:'20px'}}>Vazio.</div>}
      </div>
    </div>
  );
}