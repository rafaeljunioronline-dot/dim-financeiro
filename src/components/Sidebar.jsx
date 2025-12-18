export default function Sidebar({ setPage, currentWallet, isMobile, isOpen, onClose }) {
  const BRAND_COLOR = '#facc15'; 

  const styles = {
    aside: { 
        width: '260px', 
        backgroundColor: '#09090b', 
        padding: '24px', 
        borderRight: '1px solid #27272a', 
        display: 'flex', flexDirection: 'column', 
        height: '100vh', 
        fontFamily: 'sans-serif',
        
        // Lógica de Responsividade
        position: isMobile ? 'fixed' : 'relative', // Fixo no mobile
        left: isMobile ? (isOpen ? '0' : '-280px') : '0', // Esconde/Mostra
        top: 0,
        zIndex: 999, // Fica em cima de tudo
        transition: 'left 0.3s ease-in-out', // Animação suave
        boxShadow: isMobile && isOpen ? '5px 0 15px rgba(0,0,0,0.5)' : 'none'
    },
    brandArea: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingLeft: '8px' },
    brandLeft: { display: 'flex', alignItems: 'center', gap: '10px' },
    logoBox: { width: '32px', height: '32px', backgroundColor: BRAND_COLOR, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'black', fontWeight: '800' },
    h1: { fontSize: '1.4rem', fontWeight: '800', color: 'white', letterSpacing: '-0.5px', margin: 0 },
    
    // Botão fechar só aparece no mobile
    closeBtn: { background: 'none', border: 'none', color: '#71717a', fontSize: '1.5rem', cursor: 'pointer', display: isMobile ? 'block' : 'none' },

    nav: { display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' },
    sectionLabel: { fontSize: '0.7rem', fontWeight: '700', color: '#52525b', marginTop: '24px', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '12px' },
    button: { display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem', fontWeight: '500', color: '#a1a1aa', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '10px 12px', borderRadius: '6px', transition: 'all 0.2s', width: '100%' },
    logoutArea: { marginTop: 'auto', borderTop: '1px solid #27272a', paddingTop: '20px' }
  };

  const handleMouseEnter = (e) => { if(!isMobile) { e.currentTarget.style.color = 'white'; e.currentTarget.style.backgroundColor = '#18181b'; } };
  const handleMouseLeave = (e) => { if(!isMobile) { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a1a1aa'; } };

  const isBusiness = currentWallet?.type === 'BUSINESS';

  const Icons = {
    Dashboard: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
    Extrato: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
    Calendar: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>,
    Tag: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>,
    Chart: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
    Settings: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
  };

  const MenuBtn = ({ label, icon, page, id }) => (
    <button 
      id={id}
      style={styles.button} 
      onClick={() => setPage(page)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {icon} {label}
    </button>
  );

  return (
    <aside style={styles.aside}>
      <div style={styles.brandArea}>
        <div style={styles.brandLeft}>
            <div style={styles.logoBox}>D</div>
            <h1 style={styles.h1}>DIM</h1>
        </div>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      
      <nav style={styles.nav}>
        <div style={styles.sectionLabel}>Visão Geral</div>
        <MenuBtn label="Dashboard" icon={Icons.Dashboard} page="dashboard" />
        
        <div style={styles.sectionLabel}>{isBusiness ? 'Gestão Financeira' : 'Finanças Pessoais'}</div>
        
        <MenuBtn id="menu-transactions" label="Movimentações" icon={Icons.Extrato} page="transactions" />
        <MenuBtn id="menu-future" label="Contas Futuras" icon={Icons.Calendar} page="future-cash" />
        <MenuBtn label="Categorias" icon={Icons.Tag} page="categories" />
        
        <div style={styles.sectionLabel}>Análise</div>
        <MenuBtn id="menu-reports" label="Relatórios" icon={Icons.Chart} page="reports" />
      </nav>

      <div style={styles.logoutArea}>
        <MenuBtn label="Configurações" icon={Icons.Settings} page="settings" />
      </div>
    </aside>
  );
}