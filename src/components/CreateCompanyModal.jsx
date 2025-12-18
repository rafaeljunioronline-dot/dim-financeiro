import { useState } from 'react';

export default function CreateCompanyModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    // Simplificado: Não define mais tipo específico nem rastreio de estoque
    await onCreate({ 
        name, 
        business_type: 'COMPANY', // Tipo genérico
        track_stock: false 
    });
    
    setLoading(false);
    setName('');
    onClose();
  };

  const styles = {
    overlay: { 
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000,
        animation: 'fadeIn 0.2s ease-out'
    },
    card: { 
        backgroundColor: '#ffffff', padding: '40px', borderRadius: '16px', 
        width: '100%', maxWidth: '450px', 
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid #e5e7eb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    },
    header: { marginBottom: '30px', textAlign: 'left' },
    title: { fontSize: '1.5rem', fontWeight: '800', color: '#111827', marginBottom: '8px', letterSpacing: '-0.025em' },
    subtitle: { color: '#6b7280', fontSize: '0.95rem', lineHeight: '1.5' },
    
    formGroup: { marginBottom: '25px' },
    label: { display: 'block', fontSize: '0.75rem', fontWeight: '700', color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' },
    
    input: { 
        width: '100%', padding: '16px', borderRadius: '8px', 
        border: '1px solid #d1d5db', fontSize: '1.1rem', outline: 'none',
        color: '#111827', backgroundColor: '#f9fafb',
        transition: 'all 0.2s'
    },

    actions: { display: 'flex', gap: '12px', marginTop: '30px', paddingTop: '0' },
    btnCancel: { flex: 1, padding: '14px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', transition: 'background 0.2s' },
    btnConfirm: { flex: 2, padding: '14px', borderRadius: '8px', border: 'none', background: '#111827', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.header}>
            <div style={styles.title}>Nova Empresa</div>
            <div style={styles.subtitle}>Crie um espaço para gerenciar o financeiro do seu negócio.</div>
        </div>

        <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
                <label style={styles.label}>Nome da Empresa</label>
                <input 
                    style={styles.input} 
                    placeholder="Ex: Minha Loja Ltda" 
                    value={name} 
                    onChange={e => setName(e.target.value)}
                    autoFocus
                    required
                />
            </div>

            <div style={styles.actions}>
                <button type="button" onClick={onClose} style={styles.btnCancel}>Cancelar</button>
                <button type="submit" disabled={loading} style={styles.btnConfirm}>
                    {loading ? 'Criando...' : 'Criar Espaço'}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}