import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// --- COMPONENTES GLOBAIS ---
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import CreateCompanyModal from "./components/CreateCompanyModal";
import PaySalaryModal from "./components/PaySalaryModal";
import EditBalanceModal from "./components/EditBalanceModal";
import Toast from "./components/Toast";
import ConfirmationModal from "./components/ConfirmationModal";
import WelcomeTour from "./components/WelcomeTour";

// --- PÁGINAS ---
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import FutureCash from "./pages/FutureCash";
import AddFutureCash from "./pages/AddFutureCash";
import Categories from "./pages/Categories";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import BusinessDashboard from "./pages/business/Dashboard";

// --- COMPONENTE TELA DE BLOQUEIO (LOCKSCREEN) ---
const LockScreen = ({ user }) => (
  <div style={{height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#e4e4e7', textAlign:'center', padding:'20px'}}>
    <div style={{fontSize:'3rem', marginBottom:'20px'}}>🔒</div>
    <h1 style={{fontSize:'2rem', fontWeight:'bold', marginBottom:'10px'}}>Seu período de teste acabou!</h1>
    <p style={{color:'#a1a1aa', maxWidth:'500px', marginBottom:'30px'}}>
      Esperamos que o DIM tenha te ajudado a organizar suas finanças. 
      Para continuar usando o robô e o painel, escolha um plano.
    </p>
    <div style={{display:'flex', gap:'20px', flexWrap:'wrap', justifyContent:'center'}}>
        <button style={{padding:'15px 30px', borderRadius:'8px', border:'none', backgroundColor:'#27272a', color:'white', cursor:'pointer', border:'1px solid #3f3f46'}}>
            Mensal (R$ 29,90)
        </button>
        <button style={{padding:'15px 30px', borderRadius:'8px', border:'none', backgroundColor:'#facc15', color:'black', fontWeight:'bold', cursor:'pointer'}}>
            Anual (R$ 297,00)
        </button>
    </div>
    <button onClick={() => supabase.auth.signOut()} style={{marginTop:'40px', background:'none', border:'none', color:'#71717a', cursor:'pointer', textDecoration:'underline'}}>Sair da conta</button>
  </div>
);

function App() {
  const [session, setSession] = useState(null);
  const [planStatus, setPlanStatus] = useState(null); // 'LOADING', 'ACTIVE', 'TRIAL', 'EXPIRED'
  const [daysLeft, setDaysLeft] = useState(0);

  const [wallets, setWallets] = useState([]);
  const [currentWallet, setCurrentWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  // --- RESPONSIVIDADE ---
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
        if (window.innerWidth >= 768) setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [currentBalanceToAdjust, setCurrentBalanceToAdjust] = useState(0);

  const [toast, setToast] = useState(null);
  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', action: null, isDanger: false });
  const [showTour, setShowTour] = useState(false);

  const requestConfirm = (title, message, action, isDanger = false) => {
    setConfirmState({ isOpen: true, title, message, action, isDanger });
  };

  const handleConfirmAction = () => {
    if (confirmState.action) confirmState.action();
    setConfirmState({ ...confirmState, isOpen: false });
  };

  // --- AUTENTICAÇÃO E PLANO ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserPlan(session.user.id);
        fetchAllWallets();
        checkTourStatus();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserPlan(session.user.id);
        fetchAllWallets();
        checkTourStatus();
      } else {
        setWallets([]);
        setCurrentWallet(null);
        setPlanStatus(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- NOVA VERIFICAÇÃO DE PLANO ---
  const checkUserPlan = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('plan_status, valid_until')
        .eq('id', userId)
        .single();

      if (error || !data) {
        // Se não achar perfil, assume bloqueado ou erro
        setPlanStatus('EXPIRED');
        return;
      }

      // Se for VIP, libera tudo
      if (data.plan_status === 'VIP') {
        setPlanStatus('ACTIVE');
        setDaysLeft(999);
        return;
      }

      // Verifica datas
      const validUntil = new Date(data.valid_until);
      const now = new Date();
      const diffTime = validUntil - now;
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setDaysLeft(daysRemaining);

      if (daysRemaining < 0) {
        setPlanStatus('EXPIRED');
      } else {
        setPlanStatus(data.plan_status); // 'TRIAL' ou 'ACTIVE'
      }

    } catch (error) {
      console.error('Erro plano:', error);
      setPlanStatus('EXPIRED');
    }
  };

  const checkTourStatus = () => {
      const seen = localStorage.getItem('dim_tour_seen');
      if (!seen) setShowTour(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setPlanStatus(null);
  };

  async function fetchAllWallets() {
    setLoadingWallet(true);
    try {
      const { data, error } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      if (!data || data.length === 0) { await createDefaultPersonalWallet(); }
      else { setWallets(data); if (!currentWallet) setCurrentWallet(data[0]); }
    } catch (error) { console.error("Erro wallets:", error.message); } finally { setLoadingWallet(false); }
  }

  const createDefaultPersonalWallet = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: newWallet } = await supabase.from('wallets').insert([{ name: 'Minha Carteira', type: 'PERSONAL', user_id: user.id }]).select().single();
    if (newWallet) {
        const defaultCats = [
            { user_id: user.id, name: 'Alimentação', type: 'EXPENSE', scope: 'PERSONAL', color: '#f87171' },
            { user_id: user.id, name: 'Transporte', type: 'EXPENSE', scope: 'PERSONAL', color: '#fb923c' },
            { user_id: user.id, name: 'Moradia', type: 'EXPENSE', scope: 'PERSONAL', color: '#60a5fa' },
            { user_id: user.id, name: 'Lazer', type: 'EXPENSE', scope: 'PERSONAL', color: '#a78bfa' },
            { user_id: user.id, name: 'Saúde', type: 'EXPENSE', scope: 'PERSONAL', color: '#ef4444' },
            { user_id: user.id, name: 'Renda Extra', type: 'INCOME', scope: 'PERSONAL', color: '#4ade80' },
            { user_id: user.id, name: 'Salário', type: 'INCOME', scope: 'PERSONAL', color: '#22c55e' }
        ];
        await supabase.from('categories').insert(defaultCats);
        setWallets([newWallet]); setCurrentWallet(newWallet);
    }
  };

  const handleSwitchWallet = (wallet) => { setCurrentWallet(wallet); setPage("dashboard"); setRefreshTrigger(prev => prev + 1); };

  const handleCreateWallet = async ({ name, business_type, track_stock }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: newWallet, error } = await supabase.from('wallets').insert([{ name, type: 'BUSINESS', business_type, track_stock, user_id: user.id }]).select().single();
      if (error) throw error;
      const businessCats = [
          { user_id: user.id, name: 'Vendas', type: 'INCOME', scope: 'BUSINESS', color: '#22c55e' },
          { user_id: user.id, name: 'Fornecedores', type: 'EXPENSE', scope: 'BUSINESS', color: '#94a3b8' },
          { user_id: user.id, name: 'Pró-Labore', type: 'EXPENSE', scope: 'BUSINESS', color: '#facc15' },
          { user_id: user.id, name: 'Operacional', type: 'EXPENSE', scope: 'BUSINESS', color: '#fb923c' }
      ];
      await supabase.from('categories').insert(businessCats);
      showToast(`Empresa "${name}" criada!`); await fetchAllWallets();
      setTimeout(async () => {
          const { data: newList } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
          const created = newList.find(w => w.name === name); if(created) handleSwitchWallet(created);
      }, 500);
    } catch (error) { showToast("Erro: " + error.message, 'error'); }
  };

  const handleDeleteWallet = async (walletId) => {
      try {
        const { error } = await supabase.from('wallets').delete().eq('id', walletId);
        if (error) throw error; showToast("Empresa excluída.");
        const { data: remaining } = await supabase.from('wallets').select('*').order('created_at', { ascending: true });
        setWallets(remaining); if (remaining.length > 0) handleSwitchWallet(remaining[0]); else handleLogout();
      } catch (error) { showToast("Erro: " + error.message, 'error'); }
  };

  const [page, setPage] = useState("dashboard");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [refreshBillsTrigger, setRefreshBillsTrigger] = useState(0);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editingBill, setEditingBill] = useState(null);

  const handleTransactionSaved = () => { setEditingTransaction(null); setPage("transactions"); setRefreshTrigger(prev => prev + 1); showToast("Salvo com sucesso!"); };
  const startEditingTransaction = (transaction) => { setEditingTransaction(transaction); setPage("add"); };
  const handleBillSaved = () => { setEditingBill(null); setPage("future-cash"); setRefreshBillsTrigger(prev => prev + 1); showToast("Conta salva!"); };
  const startEditingBill = (bill) => { setEditingBill(bill); setPage("add-future-cash"); };

  const renderPage = () => {
    if (loadingWallet) return <div style={{padding: '50px', textAlign:'center', color:'#71717a'}}>⏳ Carregando...</div>;
    if (!currentWallet) return <div style={{padding: '50px', textAlign:'center', color:'#ef4444'}}>⚠️ Sem carteira.</div>;
    const isBusiness = currentWallet?.type === 'BUSINESS';
    const openAdjust = (balance) => { setCurrentBalanceToAdjust(balance); setIsAdjustModalOpen(true); };
    const openSalary = () => setIsSalaryModalOpen(true);
    
    // Passamos o status do plano e dias restantes para o Dashboard
    const commonProps = { 
        wallet: currentWallet, 
        setPage, 
        refreshTrigger, 
        showToast, 
        requestConfirm, 
        onOpenAdjust: openAdjust,
        planStatus, // NOVO
        daysLeft // NOVO
    };

    if (page === "dashboard") return isBusiness ? <BusinessDashboard {...commonProps} onOpenSalary={openSalary} /> : <Dashboard {...commonProps} />;
    if (page === "transactions") return <Transactions {...commonProps} startEditing={startEditingTransaction} />;
    if (page === "add") return <AddTransaction onTransactionAdded={handleTransactionSaved} editingTransaction={editingTransaction} wallet={currentWallet} />;
    if (page === "future-cash") return <FutureCash {...commonProps} startEditingBill={startEditingBill} refreshTrigger={refreshBillsTrigger} />;
    if (page === "add-future-cash") return <AddFutureCash onBillAdded={handleBillSaved} editingBill={editingBill} wallet={currentWallet} />;
    if (page === "categories") return <Categories wallet={currentWallet} showToast={showToast} requestConfirm={requestConfirm} />;
    if (page === "reports") return <Reports wallet={currentWallet} />;
    if (page === "settings") return <Settings onLogout={handleLogout} wallet={currentWallet} showToast={showToast} requestConfirm={requestConfirm} onDeleteWallet={handleDeleteWallet} />;
    return null;
  };

  const styles = {
    app: { display: 'flex', height: '100vh', backgroundColor: '#09090b', color: '#e4e4e7', overflow: 'hidden' },
    mainWrapper: { flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', width: '100%' },
    mainContent: { flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto' },
    overlay: {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 998,
        display: isSidebarOpen ? 'block' : 'none'
    }
  };

  // --- RENDERIZAÇÃO FINAL ---

  if (!session) return <Login />;

  if (planStatus === null) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#71717a'}}>
        <h3>Verificando assinatura...</h3>
      </div>
    );
  }

  // SE O PLANO EXPIROU, MOSTRA O CADEADO
  if (planStatus === 'EXPIRED') {
    return <LockScreen user={session.user} />;
  }

  return (
    <div style={styles.app}>
      <Sidebar
        setPage={(p) => { setPage(p); if(isMobile) setIsSidebarOpen(false); }}
        currentWallet={currentWallet}
        isMobile={isMobile}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {isMobile && isSidebarOpen && <div style={styles.overlay} onClick={() => setIsSidebarOpen(false)} />}

      <div style={styles.mainWrapper}>
        <Header
            setPage={setPage} wallets={wallets} currentWallet={currentWallet}
            onSwitchWallet={handleSwitchWallet} onCreateWallet={() => setIsModalOpen(true)}
            isMobile={isMobile}
            onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main style={styles.mainContent}>{renderPage()}</main>
      </div>

      {showTour && <WelcomeTour onClose={() => setShowTour(false)} setPage={setPage} />}
      <CreateCompanyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreate={handleCreateWallet} />
      <PaySalaryModal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)} businessWallet={currentWallet} onSuccess={(msg) => { showToast(msg); setRefreshTrigger(p => p + 1); }} />
      <EditBalanceModal isOpen={isAdjustModalOpen} onClose={() => setIsAdjustModalOpen(false)} wallet={currentWallet} currentBalance={currentBalanceToAdjust} onSuccess={(msg) => { showToast(msg); setRefreshTrigger(p => p + 1); }} />
      <ConfirmationModal isOpen={confirmState.isOpen} onClose={() => setConfirmState({...confirmState, isOpen: false})} onConfirm={handleConfirmAction} title={confirmState.title} message={confirmState.message} isDanger={confirmState.isDanger} />
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

export default App;