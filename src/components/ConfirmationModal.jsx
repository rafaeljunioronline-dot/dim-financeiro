export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, message, isDanger }) {
  if (!isOpen) return null;

  const styles = {
    overlay: {
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000,
      animation: 'fadeIn 0.2s ease-out'
    },
    card: {
      backgroundColor: 'white', padding: '30px', borderRadius: '12px',
      width: '90%', maxWidth: '400px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid #e5e7eb', textAlign: 'center',
      fontFamily: 'sans-serif'
    },
    title: { fontSize: '1.25rem', fontWeight: '800', color: '#111827', marginBottom: '10px' },
    text: { fontSize: '0.95rem', color: '#6b7280', marginBottom: '25px', lineHeight: '1.5' },
    actions: { display: 'flex', gap: '10px' },
    btnCancel: {
      flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb',
      backgroundColor: 'white', color: '#374151', fontWeight: '600', cursor: 'pointer',
      transition: 'background 0.2s'
    },
    btnConfirm: {
      flex: 1, padding: '12px', borderRadius: '8px', border: 'none',
      backgroundColor: isDanger ? '#dc2626' : '#1f2937', // Vermelho se for perigoso, Preto se for normal
      color: 'white', fontWeight: '600', cursor: 'pointer',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'transform 0.1s'
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.title}>{title}</div>
        <div style={styles.text}>{message}</div>
        <div style={styles.actions}>
          <button onClick={onClose} style={styles.btnCancel}>Cancelar</button>
          <button onClick={() => { onConfirm(); onClose(); }} style={styles.btnConfirm}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}