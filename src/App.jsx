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

// --- PÁGINAS GERAIS ---
import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import AddTransaction from "./pages/AddTransaction";
import FutureCash from "./pages/FutureCash"; 
import AddFutureCash from "./pages/AddFutureCash"; 
import Categories from "./pages/Categories"; 
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

// --- NOVA PÁGINA DE PLANOS ---
import Pricing from "./pages/Pricing"; // Certifique-se de ter criado este arquivo

// --- PÁGINAS ESPECÍFICAS ---
import BusinessDashboard from "./pages/business/Dashboard";

function App() {
  const [session, setSession] = useState(null);
  const [hasPlan, setHasPlan] = useState(null); // null = carregando, false = sem plano, true = com plano
  
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

  // --- AUTENTICAÇÃO E VERIFICAÇÃO DE PLANO ---
  useEffect(() => {
    // Ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) { 
        checkSubscription(session.user.id); // <--- Verifica o plano
        fetchAllWallets(); 
        checkTourStatus(); 
      }
    });

    // Ao mudar estado (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) { 
        checkSubscription(session.user.id); // <--- Verifica o plano
        fetchAllWallets(); 
        checkTourStatus(); 
      } else {
        setWallets([]); 
        setCurrentWallet(null);
        setHasPlan(null); // Reseta estado do plano
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // --- FUNÇÃO DE VERIFICAÇÃO DE PLANO (O SEGREDO) ---
  const checkSubscription = async (userId) => {
    try {
      // Busca a assinatura mais recente e ativa
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro plano:", error);
      }

      if (!data) {
        setHasPlan(false); // Usuário não tem assinatura ativa
        return;
      }

      // Lógica específica do TESTE 3 DIAS
      if (data.plan_code === 'TESTE3DIAS') {
        const createdDate = new Date(data.created_at);
        const now = new Date();
        const diffTime = Math.abs(now - createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays > 3) {
          showToast('Seu período de teste de 3 dias acabou!', 'error');
          
          // Opcional: Atualizar status no banco para 'expired'
          await supabase.from('subscriptions').update({ status: 'expired' }).eq('id', data.id);
          
          setHasPlan(false); // Bloqueia acesso
          return;
        }
      }

      setHasPlan(true); // Tudo certo, acesso liberado

    } catch (error) {
      console.error('Erro geral verificação:', error);
      setHasPlan(false); // Por segurança, bloqueia se der erro grave
    }
  };

  const checkTourStatus = () => {
      const seen = localStorage.getItem('dim_tour_seen');
      if (!seen) setShowTour(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null); 
    setWallets([]); 
    setCurrentWallet(null); 
    setPage("dashboard");
    setHasPlan(null);
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
    if (loadingWallet) return <div style={{padding: '50px', textAlign:'center', color:'#71717a'}}>🔄 Carregando...</div>;
    if (!currentWallet) return <div style={{padding: '50px', textAlign:'center', color:'#ef4444'}}>⚠️ Sem carteira.</div>;
    const isBusiness = currentWallet?.type === 'BUSINESS';
    const openAdjust = (balance) => { setCurrentBalanceToAdjust(balance); setIsAdjustModalOpen(true); };
    const openSalary = () => setIsSalaryModalOpen(true);
    const commonProps = { wallet: currentWallet, setPage, refreshTrigger, showToast, requestConfirm, onOpenAdjust: openAdjust };

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
  
  // --- FLUXO DE PROTEÇÃO (RENDERIZAÇÃO CONDICIONAL) ---
  
  // 1. Se não tá logado, mostra Login
  if (!session) return <Login onLoginSuccess={() => {}} />;

  // 2. Se tá logado mas ainda não sabemos o plano, mostra Loading
  if (hasPlan === null) {
    return (
      <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#09090b', color: '#71717a'}}>
        <h3>Verificando sua assinatura...</h3>
      </div>
    );
  }

  // 3. Se tá logado E não tem plano (ou teste acabou), manda pro Pricing
  if (hasPlan === false) {
    return <Pricing user={session.user} />;
  }
  
  // 4. Se tá tudo certo, mostra o App
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