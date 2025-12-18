import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function Settings({ wallet, showToast, requestConfirm, onDeleteWallet, onLogout }) {
  const [loading, setLoading] = useState(false);
  
  // Estados do Formulário (Empresa)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cnpj: ''
  });

  // Novo Estado para Convites (WhatsApp agora, não email)
  const [invitePhone, setInvitePhone] = useState('');

  // Estados do Usuário (Pessoal)
  const [userEmail, setUserEmail] = useState('');

  // Identidade DIM
  const BRAND_COLOR = '#224e3d';

  useEffect(() => {
    if (wallet) {
      setFormData({
        name: wallet.name || '',
        description: wallet.description || '',
        cnpj: wallet.cnpj || ''
      });
      // Limpa o campo de convite ao trocar de carteira
      setInvitePhone('');
    }
    getUserData();
  }, [wallet]);

  async function getUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserEmail(user.email);
  }

  // --- AÇÕES DA EMPRESA ---

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('wallets')
        .update({ name: formData.name })
        .eq('id', wallet.id);

      if (error) throw error;
      showToast('Dados atualizados com sucesso!');
    } catch (error) {
      showToast('Erro ao atualizar: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = () => {
    requestConfirm(
      'EXCLUIR EMPRESA',
      `Tem certeza que deseja apagar a empresa "${wallet.name}"? Essa ação é irreversível.`,
      () => onDeleteWallet(wallet.id),
      true // isDanger
    );
  };

  // --- AÇÕES DE CONVITE (Via WhatsApp) ---

  const handleInvite = async (e) => {
    e.preventDefault();
    // Validação simples de tamanho de telefone
    if (!invitePhone || invitePhone.length < 10) {
      return showToast('Digite um WhatsApp válido com DDD.', 'error');
    }
    
    // Aqui virá a lógica do Supabase
    showToast(`Convite enviado para o WhatsApp ${invitePhone} (Simulação)`);
    setInvitePhone('');
  };

  // --- COMPONENTES VISUAIS ---

  const styles = {
    container: { maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', color: '#1f2937' },
    
    // Cabeçalho modificado para comportar texto branco
    header: { 
      backgroundColor: BRAND_COLOR, // Fundo Verde Marca
      padding: '30px', 
      borderRadius: '12px', 
      marginBottom: '30px', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    },
    title: { fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', margin: 0 }, // Texto Branco
    subtitle: { fontSize: '0.95rem', color: '#e5e7eb', marginTop: '8px', opacity: 0.9 }, // Texto Cinza Claro
    
    section: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
    sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
    
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '8px' },
    input: { 
      width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #d1d5db', 
      fontSize: '0.95rem', color: '#111827', outline: 'none', transition: 'border 0.2s' 
    },
    
    // Botões
    btnPrimary: { 
      backgroundColor: BRAND_COLOR, color: 'white', padding: '12px 24px', borderRadius: '6px', 
      border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem',
      display: 'inline-flex', alignItems: 'center', gap: '8px'
    },
    btnDanger: { 
      backgroundColor: '#fee2e2', color: '#dc2626', padding: '12px 24px', borderRadius: '6px', 
      border: '1px solid #fca5a5', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem'
    },
    btnLogout: {
      backgroundColor: '#f3f4f6', color: '#374151', padding: '10px 20px', borderRadius: '6px',
      border: '1px solid #e5e7eb', cursor: 'pointer', fontWeight: '600'
    },
    
    // Avisos Profissionais
    infoBox: {
      backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af',
      padding: '15px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5'
    },
    warningBox: {
      backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#92400e',
      padding: '15px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.5'
    }
  };

  // RENDERIZAÇÃO CONDICIONAL
  const isBusiness = wallet?.type === 'BUSINESS';

  return (
    <div style={styles.container}>
      
      {/* Cabeçalho com Fundo da Marca e Letra Branca */}
      <div style={styles.header}>
        <h1 style={styles.title}>Configurações</h1>
        <p style={styles.subtitle}>
          Gerencie os dados {isBusiness ? `da empresa ${wallet.name}` : 'do seu perfil pessoal'}
        </p>
      </div>

      {/* --- MODO EMPRESARIAL --- */}
      {isBusiness ? (
        <>
          <form style={styles.section} onSubmit={handleSaveCompany}>
            <div style={styles.sectionTitle}>🏢 Dados da Empresa</div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Fantasia</label>
              <input 
                style={styles.input} 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: Minha Loja Ltda"
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>CNPJ (Opcional)</label>
              <input 
                style={styles.input} 
                value={formData.cnpj} 
                onChange={e => setFormData({...formData, cnpj: e.target.value})}
                placeholder="00.000.000/0000-00"
              />
            </div>

            <button type="submit" style={styles.btnPrimary} disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>

          {/* Seção: Sócios e Equipe (WhatsApp) */}
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👥 Sócios e Equipe</div>
            
            {/* Aviso Profissional - Empresarial */}
            <div style={styles.infoBox}>
              <strong>Como funciona o acesso de Sócio/Equipe:</strong><br/>
              O usuário adicionado terá permissão para visualizar e gerenciar o financeiro 
              <strong> EXCLUSIVAMENTE desta empresa</strong>. Ele não terá acesso à sua carteira pessoal 
              nem a outras empresas vinculadas à sua conta.
            </div>

            <form onSubmit={handleInvite} style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
               <div style={{flex: 1}}>
                 <label style={styles.label}>WhatsApp do Sócio/Colaborador</label>
                 <input 
                   style={styles.input} 
                   type="tel" 
                   placeholder="(11) 99999-9999" 
                   value={invitePhone}
                   onChange={e => setInvitePhone(e.target.value)}
                 />
               </div>
               <button type="submit" style={styles.btnPrimary}>Convidar</button>
            </form>

            <div style={{marginTop: '20px', borderTop: '1px solid #f3f4f6', paddingTop: '15px'}}>
                <small style={{color: '#9ca3af'}}>Colaboradores ativos aparecerão aqui.</small>
            </div>
          </div>

          <div style={{...styles.section, borderColor: '#fca5a5'}}>
            <div style={{...styles.sectionTitle, color: '#dc2626'}}>⚠️ Zona de Perigo</div>
            <p style={{marginBottom: '20px', color: '#6b7280', fontSize: '0.9rem'}}>
              Esta ação apagará todos os registros desta empresa permanentemente.
            </p>
            <button type="button" style={styles.btnDanger} onClick={handleDeleteCompany}>
              Excluir Empresa
            </button>
          </div>
        </>
      ) : (
        /* --- MODO PESSOAL --- */
        <>
          <div style={styles.section}>
            <div style={styles.sectionTitle}>👤 Meu Perfil</div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Vinculado</label>
              <input 
                style={{...styles.input, backgroundColor: '#f9fafb', color: '#6b7280'}} 
                value={userEmail || 'Carregando...'} 
                disabled 
              />
            </div>
          </div>

          {/* Seção: Co-Titulares (WhatsApp) */}
          <div style={styles.section}>
             <div style={styles.sectionTitle}>🔑 Co-Titulares (Acesso Total)</div>
             
             {/* Aviso Profissional - Co-Titular */}
             <div style={styles.warningBox}>
                <strong>⚠️ NÍVEL DE PERMISSÃO MÁXIMA</strong><br/>
                Ao adicionar um Co-Titular, você concede <strong>poderes administrativos totais</strong>. 
                Esta pessoa poderá visualizar, movimentar e excluir dados da sua 
                <strong> Conta Pessoal e de TODAS as suas Empresas</strong>. 
                <br/><br/>
                <em>Recomendado apenas para cônjuges ou sócios majoritários.</em>
             </div>

             <form onSubmit={handleInvite} style={{display: 'flex', gap: '10px', alignItems: 'flex-end'}}>
               <div style={{flex: 1}}>
                 <label style={styles.label}>WhatsApp do Co-Titular</label>
                 <input 
                   style={styles.input} 
                   type="tel" 
                   placeholder="(11) 99999-9999" 
                   value={invitePhone}
                   onChange={e => setInvitePhone(e.target.value)}
                 />
               </div>
               <button type="submit" style={styles.btnPrimary}>Adicionar Acesso Total</button>
            </form>
          </div>

          <div style={{marginTop: '40px', textAlign: 'right'}}>
            <button onClick={onLogout} style={styles.btnLogout}>
              Sair da Conta
            </button>
          </div>
        </>
      )}
    </div>
  );
}