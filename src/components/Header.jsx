import { useState } from 'react';

export default function Header({ setPage, wallets, currentWallet, onSwitchWallet, onCreateWallet, isMobile, onToggleSidebar }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const BRAND_COLOR = '#facc15'; 

  const styles = {
    header: { 
        height: '80px', backgroundColor: '#09090b', borderBottom: '1px solid #27272a', 
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
        padding: isMobile ? '0 15px' : '0 40px', // Padding menor no mobile
        flexShrink: 0 
    },
    
    leftArea: { display: 'flex', alignItems: 'center', gap: '15px' },
    
    // Botão Hambúrguer (Só mobile)
    menuBtn: {
        display: isMobile ? 'flex' : 'none',
        background: 'none', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer',
        alignItems: 'center', justifyContent: 'center'
    },

    titleBox: { display: 'flex', flexDirection: 'column' },
    // Texto menor no mobile
    pageTitle: { fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: '800', color: 'white', letterSpacing: '-0.5px' },
    pageSub: { fontSize: '0.8rem', color: '#a1a1aa', marginTop: '4px', display: isMobile ? 'none' : 'block' }, // Esconde subtítulo no mobile

    userArea: { position: 'relative' },
    walletSelector: { display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
    
    walletInfo: { display: isMobile ? 'none' : 'flex', flexDirection: 'column', alignItems: 'flex-end', marginRight: '5px' }, // Esconde texto no mobile
    walletName: { fontSize: '0.9rem', fontWeight: '700', color: '#e4e4e7' },
    walletType: { fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' },
    
    avatar: { width: '36px', height: '36px', borderRadius: '6px', backgroundColor: currentWallet?.type === 'BUSINESS' ? BRAND_COLOR : '#3b82f6', color: currentWallet?.type === 'BUSINESS' ? 'black' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.9rem' },
    chevron: { fontSize: '0.7rem', color: '#71717a', marginLeft: '5px' },
    
    dropdownMenu: { position: 'absolute', top: '110%', right: 0, width: '280px', backgroundColor: '#18181b', borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)', border: '1px solid #27272a', zIndex: 100, overflow: 'hidden', display: isDropdownOpen ? 'block' : 'none' },
    dropdownHeader: { padding: '12px 16px', borderBottom: '1px solid #27272a', fontSize: '0.7rem', color: '#71717a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' },
    menuItem: { padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', borderBottom: '1px solid #27272a', transition: 'background 0.1s', color: '#e4e4e7' },
    menuItemName: { fontSize: '0.9rem', color: '#e4e4e7', fontWeight: '500' },
    createBtn: { width: '100%', padding: '14px', textAlign: 'center', background: '#27272a', border: 'none', color: BRAND_COLOR, fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', borderTop: '1px solid #27272a', transition: 'background 0.2s' }
  };

  return (
    <header style={styles.header}>
      <div style={styles.leftArea}>
          {/* Botão Menu */}
          <button style={styles.menuBtn} onClick={onToggleSidebar}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>

          <div style={styles.titleBox}>
            <span style={styles.pageTitle}>{currentWallet?.type === 'BUSINESS' ? 'Gestão PJ' : 'Pessoal'}</span>
            <span style={styles.pageSub}>Visão Geral</span>
          </div>
      </div>

      <div style={styles.userArea}>
        <button 
            id="wallet-switcher" 
            style={styles.walletSelector} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
            <div style={styles.walletInfo}>
                <span style={styles.walletName}>{currentWallet?.name}</span>
                <span style={styles.walletType}>{currentWallet?.type === 'BUSINESS' ? 'PJ' : 'PF'}</span>
            </div>
            <div style={styles.avatar}>{currentWallet?.name?.charAt(0).toUpperCase()}</div>
            <span style={styles.chevron}>▼</span>
        </button>

        {isDropdownOpen && (
            <>
                <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, zIndex:90}} onClick={() => setIsDropdownOpen(false)}></div>
                <div style={styles.dropdownMenu}>
                    <div style={styles.dropdownHeader}>Selecionar Espaço</div>
                    {wallets.map(w => (
                        <div key={w.id} style={{...styles.menuItem, backgroundColor: currentWallet?.id === w.id ? '#27272a' : 'transparent', borderLeft: currentWallet?.id === w.id ? `3px solid ${BRAND_COLOR}` : '3px solid transparent'}} onClick={() => {onSwitchWallet(w); setIsDropdownOpen(false);}}>
                            <div style={{width: '10px', height: '10px', borderRadius: '50%', backgroundColor: w.type === 'BUSINESS' ? BRAND_COLOR : '#3b82f6', flexShrink: 0}}></div>
                            <span style={{...styles.menuItemName, fontWeight: currentWallet?.id === w.id ? '700' : '500'}}>{w.name}</span>
                        </div>
                    ))}
                    <button style={styles.createBtn} onClick={() => {onCreateWallet(); setIsDropdownOpen(false);}}>+ Adicionar Nova Empresa</button>
                </div>
            </>
        )}
      </div>
    </header>
  );
}