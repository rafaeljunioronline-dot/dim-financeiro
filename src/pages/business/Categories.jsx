// src/pages/business/Categories.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Ajustei o caminho para ../../ igual ao seu AddTransaction

export default function Categories({ wallet }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('EXPENSE');
  const [newColor, setNewColor] = useState('#6b7280');

  // Busca categorias APENAS desta empresa (wallet.id)
  async function getCategories() {
    if (!wallet?.id) return; // Segurança caso a wallet não tenha carregado
    
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('wallet_id', wallet.id) // FILTRO IMPORTANTE
      .order('name', { ascending: true });
      
    if (error) console.error(error);
    else setCategories(data || []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName) return alert("Digite um nome!");
    if (!wallet?.id) return alert("Erro: Nenhuma empresa selecionada.");

    const { error } = await supabase
      .from('categories')
      .insert([{ 
          name: newName, 
          type: newType, 
          color: newColor,
          wallet_id: wallet.id // VINCULA À EMPRESA
      }]);

    if (error) alert(error.message);
    else {
      setNewName(''); 
      getCategories(); 
    }
  }

  async function handleDelete(id) {
    if (window.confirm("Excluir categoria?")) {
      await supabase.from('categories').delete().eq('id', id);
      getCategories();
    }
  }

  // Monitora mudanças na wallet para recarregar a lista correta
  useEffect(() => { 
      if (wallet?.id) {
          getCategories(); 
      }
  }, [wallet]);

  const styles = {
    container: { maxWidth: '800px', margin: '0 auto' },
    card: { backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '24px' },
    header: { fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '20px' },
    form: { display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid #eee' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '0.85rem', fontWeight: '600', color: '#4b5563' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', minWidth: '200px' },
    select: { padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', minWidth: '120px', backgroundColor:'white' },
    colorInput: { padding: '0', width: '50px', height: '42px', border: 'none', cursor: 'pointer', backgroundColor: 'transparent' },
    addBtn: { padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', borderRadius: '8px', border: 'none', cursor: 'pointer', height:'42px' },
    listGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' },
    catCard: { padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor:'white' },
    catInfo: { display: 'flex', alignItems: 'center', gap: '12px' },
    colorDot: (color) => ({ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: color }),
    catName: { fontWeight: '600', color: '#374151' },
    catType: { fontSize: '0.75rem', color: '#9ca3af', marginLeft: '4px' },
    delBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>Minhas Categorias</h2>

        <form style={styles.form} onSubmit={handleAdd}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nome</label>
            <input style={styles.input} type="text" placeholder="Ex: Viagens" value={newName} onChange={e => setNewName(e.target.value)} />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tipo</label>
            <select style={styles.select} value={newType} onChange={e => setNewType(e.target.value)}>
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Cor</label>
            <input style={styles.colorInput} type="color" value={newColor} onChange={e => setNewColor(e.target.value)} />
          </div>
          <button type="submit" style={styles.addBtn}>➕ Criar</button>
        </form>

        {loading ? <p>Carregando...</p> : (
          <div style={styles.listGrid}>
            {categories.map(cat => (
              <div key={cat.id} style={styles.catCard}>
                <div style={styles.catInfo}>
                  <div style={styles.colorDot(cat.color)}></div>
                  <div>
                    <span style={styles.catName}>{cat.name}</span>
                    <span style={styles.catType}>({cat.type === 'EXPENSE' ? 'Saída' : 'Entrada'})</span>
                  </div>
                </div>
                <button style={styles.delBtn} onClick={() => handleDelete(cat.id)} title="Excluir">🗑️</button>
              </div>
            ))}
            {categories.length === 0 && <p style={{color: '#999'}}>Nenhuma categoria encontrada para esta empresa.</p>}
          </div>
        )}
      </div>
    </div>
  );
}