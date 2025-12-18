import { useEffect } from 'react';

export default function Toast({ msg, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // Some em 3 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!msg) return null;

  const styles = {
    container: {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: type === 'error' ? '#fee2e2' : '#dcfce7',
      color: type === 'error' ? '#dc2626' : '#166534',
      padding: '16px 24px',
      borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      fontWeight: 'bold',
      animation: 'slideIn 0.3s ease-out'
    }
  };

  return (
    <div style={styles.container}>
      <span>{type === 'error' ? '❌' : '✅'}</span>
      {msg}
    </div>
  );
}