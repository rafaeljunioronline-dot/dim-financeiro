import React from 'react';

export default function SalesSuccessModal({ isOpen, onClose, orderData }) {
  // Se o modal não estiver aberto ou não tiver dados, não mostra nada
  if (!isOpen || !orderData) return null;

  // Garante que o total seja um número para não dar erro
  const total = Number(orderData.total || 0);
  const items = orderData.items || [];

  // Função para enviar o recibo no WhatsApp
  const handleSendWhatsApp = () => {
    let message = `🧾 *COMPROVANTE DE VENDA* \n`;
    message += `🗓️ Data: ${new Date().toLocaleDateString()}\n`;
    message += `------------------------------\n`;
    
    items.forEach(item => {
        message += `${item.qty}x ${item.name} - R$ ${(item.sale_price * item.qty).toFixed(2)}\n`;
    });
    
    message += `------------------------------\n`;
    message += `💰 *TOTAL: R$ ${total.toFixed(2)}*\n\n`;
    message += `Obrigado pela preferência! 🙌`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 200 },
    modal: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', width: '400px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
    icon: { fontSize: '4rem', marginBottom: '10px' },
    h2: { fontSize: '1.8rem', fontWeight: 'bold', color: '#16a34a', marginBottom: '5px' },
    p: { color: '#6b7280', marginBottom: '20px' },
    totalBox: { backgroundColor: '#f0fdf4', padding: '15px', borderRadius: '8px', marginBottom: '24px', border: '1px dashed #16a34a' },
    totalLabel: { fontSize: '0.9rem', color: '#15803d', fontWeight: 'bold', textTransform: 'uppercase' },
    totalValue: { fontSize: '2.5rem', fontWeight: 'bold', color: '#166534' },
    
    buttons: { display: 'flex', flexDirection: 'column', gap: '10px' },
    btnWhatsapp: { padding: '14px', backgroundColor: '#25D366', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    btnNew: { padding: '14px', backgroundColor: 'transparent', border: '2px solid #e5e7eb', color: '#4b5563', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.icon}>🎉</div>
        <h2 style={styles.h2}>Venda Realizada!</h2>
        <p style={styles.p}>Estoque atualizado e dinheiro no caixa.</p>

        <div style={styles.totalBox}>
            <div style={styles.totalLabel}>Valor Recebido</div>
            <div style={styles.totalValue}>R$ {total.toFixed(2)}</div>
        </div>

        <div style={styles.buttons}>
            <button style={styles.btnWhatsapp} onClick={handleSendWhatsApp}>
                📱 Enviar Recibo no WhatsApp
            </button>
            <button style={styles.btnNew} onClick={onClose}>
                🔄 Nova Venda
            </button>
        </div>
      </div>
    </div>
  );
}