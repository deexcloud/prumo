import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Copy,
  CreditCard,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  Mail,
  MailPlus,
  MapPin,
  Plus,
  Search,
  Settings2,
  ShieldCheck,
  StickyNote,
  Trash2,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import './platform.css'

const navigation = [
  { id: 'overview', label: 'Visão geral', icon: LayoutDashboard },
  { id: 'orders', label: 'Ordens de serviço', icon: ClipboardList },
  { id: 'clients', label: 'Clientes', icon: Building2 },
  { id: 'team', label: 'Equipe', icon: Users },
  { id: 'evidence', label: 'Comprovantes', icon: FileCheck2 },
  { id: 'billing', label: 'Plano e pagamento', icon: CreditCard },
]

const plans = [
  { code: 'essencial', name: 'Prumo Essencial', priceMonthly: 4900, priceYearly: 49000, detail: 'Para organizar atendimentos e clientes em um só lugar.', features: ['Ordens de serviço', 'Cadastro de clientes', 'Registro de evidências'] },
  { code: 'equipe', name: 'Prumo Equipe', priceMonthly: 11900, priceYearly: 119000, detail: 'Para coordenar colaboradores e atividades em campo.', features: ['Tudo do Essencial', 'Convites para equipe', 'Acompanhamento centralizado'] },
  { code: 'operacao', name: 'Prumo Operação', priceMonthly: 24900, priceYearly: 249000, detail: 'Para operações que precisam de mais controle e acompanhamento.', features: ['Tudo do Equipe', 'Visão centralizada da operação', 'Estrutura para crescer'] },
]

const statuses = {
  open: { label: 'Aberta', tone: 'blue' },
  scheduled: { label: 'Agendada', tone: 'violet' },
  in_progress: { label: 'Em andamento', tone: 'yellow' },
  completed: { label: 'Concluída', tone: 'green' },
  cancelled: { label: 'Cancelada', tone: 'muted' },
}

const roleNames = { owner: 'Administrador', manager: 'Gestor', technician: 'Técnico' }

function BrandMark() {
  return <span className="platform-brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
}

function Brand({ onClick }) {
  return <button className="platform-brand" onClick={onClick} aria-label="Voltar ao site"><BrandMark /><span>prumo<span>.</span></span></button>
}

function StatusBadge({ status }) {
  const item = statuses[status] || statuses.open
  return <span className={`platform-status status-${item.tone}`}><i />{item.label}</span>
}

function formatDate(value, options = { day: '2-digit', month: 'short' }) {
  if (!value) return 'Sem data'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sem data'
  return new Intl.DateTimeFormat('pt-BR', options).format(date)
}

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value / 100)
}

function planPrice(plan, interval) {
  return interval === 'yearly' ? plan.priceYearly : plan.priceMonthly
}

function initials(value = '') {
  return value.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'P'
}

function Platform({ onExit }) {
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [authNotice, setAuthNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [mode, setMode] = useState('login')
  const [inviteToken, setInviteToken] = useState(() => new URLSearchParams(window.location.search).get('invite') || '')
  const [inviteDetails, setInviteDetails] = useState(null)
  const [inviteLoading, setInviteLoading] = useState(Boolean(new URLSearchParams(window.location.search).get('invite')))
  const [inviteError, setInviteError] = useState('')

  useEffect(() => {
    if (!inviteToken || !supabase) {
      setInviteLoading(false)
      setInviteDetails(null)
      return undefined
    }
    let active = true
    setInviteLoading(true)
    supabase.rpc('get_team_invite_details', { invite_token: inviteToken }).then(({ data, error }) => {
      if (!active) return
      setInviteDetails(error ? null : data)
      setInviteError(error ? 'Este convite é inválido, foi cancelado ou expirou. Peça à empresa um novo link.' : '')
      setInviteLoading(false)
    })
    return () => { active = false }
  }, [inviteToken])

  function finishInvite() {
    const url = new URL(window.location.href)
    url.searchParams.delete('invite')
    url.hash = 'app'
    window.history.replaceState({}, '', url)
    setInviteToken('')
    setInviteDetails(null)
    setInviteError('')
  }

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return undefined
    }
    let active = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return
      if (error) setAuthError(error.message)
      setSession(data?.session || null)
      setAuthLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthError('')
      setAuthNotice('')
    })
    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  async function submitAuth(event) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setAuthError('')
    setAuthNotice('')
    const values = new FormData(event.currentTarget)
    const email = String(values.get('email') || '').trim().toLowerCase()
    const password = String(values.get('password') || '')
    try {
      if (mode === 'signup') {
        const fullName = String(values.get('full_name') || '').trim()
        const organizationName = String(values.get('organization_name') || '').trim()
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, ...(organizationName ? { organization_name: organizationName } : {}) },
            ...(inviteToken ? { emailRedirectTo: window.location.href } : {}),
          },
        })
        if (error) throw error
        if (data.session) {
          setSession(data.session)
          window.location.hash = '#app'
        } else {
          setMode('login')
          setAuthNotice(inviteToken
            ? 'Conta criada. Se a confirmação estiver ativa, o Supabase precisa confirmar o cadastro. Depois entre com este mesmo endereço para aceitar o convite.'
            : 'Conta criada. Confirme seu e-mail e depois entre para concluir a configuração da empresa.')
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setSession(data.session)
        window.location.hash = '#app'
      }
    } catch (error) {
      setAuthError(error.message || 'Não foi possível acessar sua conta agora.')
    } finally {
      setBusy(false)
    }
  }

  async function signOut() {
    await supabase?.auth.signOut()
    setSession(null)
    setMode('login')
    window.location.hash = '#acesso'
  }

  if (authLoading) {
    return <div className="platform-loading"><LoaderCircle className="spin" size={23} /><span>Preparando seu acesso…</span></div>
  }

  if (!session) {
    return <AccessScreen
      mode={mode}
      setMode={(nextMode) => { setMode(nextMode); setAuthError(''); setAuthNotice('') }}
      onSubmit={submitAuth}
      busy={busy}
      error={authError}
      notice={authNotice}
      inviteToken={inviteToken}
      inviteDetails={inviteDetails}
      inviteLoading={inviteLoading}
      inviteError={inviteError}
      onExit={onExit}
    />
  }

  return <Workspace session={session} inviteToken={inviteToken} inviteDetails={inviteDetails} onInviteAccepted={finishInvite} onSignOut={signOut} onExit={onExit} />
}

function AccessScreen({ mode, setMode, onSubmit, busy, error, notice, inviteToken, inviteDetails, inviteLoading, inviteError, onExit }) {
  return (
    <main className="access-shell">
      <div className="access-topbar"><Brand onClick={onExit} /><button className="access-back" onClick={onExit}><ArrowLeft size={15} /> Voltar ao site</button></div>
      <div className="access-layout">
        <section className="access-pitch">
          <span className="access-eyebrow"><span /> OPERAÇÃO DE CAMPO, COMPROVADA</span>
          <h1>Bom serviço.<br /><span>Boa prova.</span></h1>
          <p>Entre no Prumo para organizar sua operação, acompanhar as equipes e manter cada atendimento bem documentado.</p>
          <div className="access-points">
            <span><CheckCircle2 size={17} /> Ordens e clientes em um só lugar</span>
            <span><CheckCircle2 size={17} /> Atualizações da equipe em campo</span>
            <span><CheckCircle2 size={17} /> Evidências ligadas a cada serviço</span>
          </div>
          <div className="access-decoration"><BrandMark /><span>PRUMO / OPERAÇÃO COMPROVADA</span></div>
        </section>
        <section className="access-card">
          <div className="access-card-mark"><BrandMark /></div>
          <span className="access-kicker">{inviteToken ? 'CONVITE PARA A EQUIPE' : mode === 'login' ? 'BEM-VINDO DE VOLTA' : 'COMECE POR AQUI'}</span>
          <h2>{inviteToken ? 'Entre na equipe' : mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}</h2>
          <p>{inviteToken && inviteDetails ? `${inviteDetails.organization_name} convidou você como ${roleNames[inviteDetails.role] || 'membro'}.` : mode === 'login' ? 'Entre para acompanhar sua operação.' : 'Configure sua empresa e convide sua equipe depois.'}</p>
          {inviteLoading && <div className="access-message"><LoaderCircle className="spin" size={16} /><span>Validando convite…</span></div>}
          {inviteError && <div className="access-message access-error"><AlertCircle size={16} /><span>{inviteError}</span></div>}
          {inviteToken && inviteDetails && !inviteLoading && <div className="access-message invite-manual-note"><Mail size={16} /><span>O convite não depende do SMTP do Prumo. Se a confirmação de conta estiver ativa no Supabase, a confirmação ainda depende da configuração de e-mail do Supabase.</span></div>}
          {!isSupabaseConfigured ? (
            <div className="access-message access-error"><AlertCircle size={17} /><span>O acesso precisa ser conectado ao Supabase. Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente do projeto.</span></div>
          ) : (
            <form className="platform-form access-form" onSubmit={onSubmit}>
              {mode === 'signup' && <>
                <label>Seu nome<input name="full_name" autoComplete="name" placeholder="Ex.: Marina Alves" required /></label>
                {!inviteToken && <label>Nome da empresa<input name="organization_name" autoComplete="organization" placeholder="Ex.: Aurora Facilities" minLength="2" required /></label>}
              </>}
              <label>E-mail profissional<span className="input-icon"><Mail size={15} /><input name="email" type="email" autoComplete="email" placeholder="voce@empresa.com.br" defaultValue={inviteDetails?.email || ''} readOnly={Boolean(inviteDetails)} required /></span></label>
              <label>Senha<span className="input-icon"><LockKeyhole size={15} /><input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo de 8 caracteres" minLength="8" required /></span></label>
              {error && <div className="access-message access-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
              {notice && <div className="access-message access-success" role="status"><CheckCircle2 size={16} /><span>{notice}</span></div>}
              <button className="platform-primary access-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : null}{mode === 'login' ? 'Entrar na plataforma' : 'Criar conta'}{!busy && <ArrowRight size={16} />}</button>
            </form>
          )}
          <div className="access-switch">{mode === 'login' ? <>Ainda não tem uma conta? <button onClick={() => setMode('signup')}>Criar conta</button></> : <>Já tem uma conta? <button onClick={() => setMode('login')}>Entrar</button></>}</div>
          <div className="access-secure"><ShieldCheck size={13} /> Seus dados ficam protegidos pela sua empresa</div>
        </section>
      </div>
    </main>
  )
}

function Workspace({ session, inviteToken, inviteDetails, onInviteAccepted, onSignOut, onExit }) {
  const user = session.user
  const [profile, setProfile] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [orders, setOrders] = useState([])
  const [clients, setClients] = useState([])
  const [members, setMembers] = useState([])
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [section, setSection] = useState('overview')
  const [query, setQuery] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [showClientForm, setShowClientForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const [notice, setNotice] = useState('')
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [organizationName, setOrganizationName] = useState(user.user_metadata?.organization_name || '')
  const [setupBusy, setSetupBusy] = useState(false)
  const [setupError, setSetupError] = useState('')
  const [inviteProcessing, setInviteProcessing] = useState(Boolean(inviteToken))
  const [inviteAcceptError, setInviteAcceptError] = useState('')
  const [invitations, setInvitations] = useState([])
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [createdInvite, setCreatedInvite] = useState(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [inviteActionError, setInviteActionError] = useState('')
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState('')
  const [selectedInterval, setSelectedInterval] = useState('monthly')
  const [planBusy, setPlanBusy] = useState(false)
  const [planError, setPlanError] = useState('')

  async function refreshWorkspace() {
    setLoading(true)
    setPageError('')
    const { data: memberProfile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (profileError) {
      setPageError('Não foi possível carregar seu perfil. Confira se o schema do Prumo foi aplicado no Supabase.')
      setLoading(false)
      return
    }
    if (!memberProfile) {
      setProfile(null)
      setOrganization(null)
      setLoading(false)
      return
    }
    setProfile(memberProfile)
    const [organizationResult, ordersResult, clientsResult, membersResult, evidenceResult, invitationsResult] = await Promise.all([
      supabase.from('organizations').select('*').eq('id', memberProfile.organization_id).maybeSingle(),
      supabase.from('service_orders').select('*').eq('organization_id', memberProfile.organization_id).order('created_at', { ascending: false }),
      supabase.from('clients').select('*').eq('organization_id', memberProfile.organization_id).order('name', { ascending: true }),
      supabase.from('profiles').select('*').eq('organization_id', memberProfile.organization_id).order('created_at', { ascending: true }),
      supabase.from('service_evidence').select('*').eq('organization_id', memberProfile.organization_id).order('created_at', { ascending: false }),
      ['owner', 'manager'].includes(memberProfile.role) ? supabase.rpc('list_team_invitations') : Promise.resolve({ data: [], error: null }),
    ])
    const failed = [organizationResult, ordersResult, clientsResult, membersResult, evidenceResult, invitationsResult].find((result) => result.error)
    if (failed) setPageError('Alguns dados não carregaram. Confira as tabelas e políticas do schema do Prumo no Supabase.')
    setOrganization(organizationResult.data || null)
    setOrders(ordersResult.data || [])
    setClients(clientsResult.data || [])
    setMembers(membersResult.data || [])
    setEvidence(evidenceResult.data || [])
    setInvitations(invitationsResult.data || [])
    setLoading(false)
  }

  useEffect(() => {
    let active = true
    if (!inviteToken) {
      refreshWorkspace()
      return undefined
    }
    setInviteProcessing(true)
    setInviteAcceptError('')
    supabase.rpc('accept_team_invite', { invite_token: inviteToken, member_name: user.user_metadata?.full_name || '' }).then(({ error }) => {
      if (!active) return
      setInviteProcessing(false)
      if (error) {
        setInviteAcceptError(error.message?.includes('invited email')
          ? `Este convite foi enviado para ${inviteDetails?.email || 'outro e-mail'}. Saia e entre ou crie uma conta usando esse endereço.`
          : error.message?.includes('already belongs')
            ? 'Esta conta já está vinculada a outra empresa. Use uma conta sem vínculo para aceitar este convite.'
            : 'Não foi possível aceitar o convite. Ele pode ter expirado ou sido cancelado; peça à empresa um novo link.')
      } else {
        onInviteAccepted()
      }
    })
    return () => { active = false }
  }, [user.id, inviteToken]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null
  const orderClientNames = useMemo(() => Object.fromEntries(clients.map((client) => [client.id, client.name])), [clients])
  const memberNames = useMemo(() => Object.fromEntries(members.map((member) => [member.id, member.full_name])), [members])
  const title = navigation.find((item) => item.id === section)?.label || 'Visão geral'
  const activeOrders = orders.filter((order) => ['open', 'scheduled', 'in_progress'].includes(order.status))
  const filteredOrders = orders.filter((order) => {
    const text = `${order.code} ${order.title} ${orderClientNames[order.client_id] || ''}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })
  const filteredClients = clients.filter((client) => `${client.name} ${client.email || ''} ${client.phone || ''}`.toLowerCase().includes(query.toLowerCase()))

  async function finishSetup(event) {
    event.preventDefault()
    setSetupBusy(true)
    setSetupError('')
    const { error } = await supabase.rpc('create_organization', {
      org_name: organizationName.trim(),
      member_name: fullName.trim(),
    })
    setSetupBusy(false)
    if (error) {
      setSetupError(error.message.includes('already belongs') ? 'Esta conta já está associada a uma empresa. Atualize a página para continuar.' : 'Não foi possível criar a empresa. Confira se o schema.sql foi executado no Supabase e tente novamente.')
      return
    }
    await refreshWorkspace()
  }

  async function createTeamInvite(event) {
    event.preventDefault()
    const form = event.currentTarget
    const values = new FormData(form)
    setInviteBusy(true)
    setInviteActionError('')
    const { data, error } = await supabase.rpc('create_team_invite', {
      invitee_email: String(values.get('email') || '').trim().toLowerCase(),
      invitee_role: String(values.get('role') || 'technician'),
    })
    setInviteBusy(false)
    if (error) {
      setInviteActionError(error.message?.includes('already a pending')
        ? 'Já existe um convite pendente para esse e-mail.'
        : error.message?.includes('already a member')
          ? 'Esse e-mail já pertence à equipe.'
          : 'Não foi possível criar o convite. Confira se o schema atualizado foi aplicado no Supabase.')
      return
    }
    const url = new URL(window.location.href)
    url.searchParams.set('invite', data.token)
    url.hash = 'acesso'
    setCreatedInvite({ ...data, link: url.toString() })
    setShowInviteForm(false)
    form.reset()
    await refreshWorkspace()
  }

  async function revokeInvitation(invitationId) {
    setInviteActionError('')
    const { error } = await supabase.rpc('revoke_team_invitation', { invitation_id: invitationId })
    if (error) {
      setInviteActionError('Não foi possível cancelar esse convite.')
      return
    }
    setNotice('Convite cancelado.')
    await refreshWorkspace()
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(createdInvite.link)
      setCopiedInvite(true)
    } catch {
      setInviteActionError('Não foi possível copiar automaticamente. Selecione e copie o link exibido.')
    }
  }

  async function savePlan(startTrial) {
    const planToSave = selectedPlan || organization?.plan_code
    const intervalToSave = organization?.plan_interval && !selectedPlan ? organization.plan_interval : selectedInterval
    if (!planToSave) return
    setPlanBusy(true)
    setPlanError('')
    const { error } = await supabase.rpc('select_organization_plan', {
      requested_plan: planToSave,
      requested_interval: intervalToSave,
      start_trial: startTrial,
    })
    setPlanBusy(false)
    if (error) {
      setPlanError(error.message?.includes('already been used')
        ? 'Este período de teste já foi usado nesta empresa. Escolha a opção de plano pago.'
        : 'Não foi possível salvar a escolha. Confira se o schema atualizado foi aplicado no Supabase.')
      return
    }
    setNotice(startTrial ? 'Período de teste iniciado por 14 dias. Nenhuma cobrança foi feita.' : 'Plano registrado. O checkout ainda será conectado; nenhuma cobrança foi feita.')
    await refreshWorkspace()
  }

  async function createClient(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    const values = new FormData(event.currentTarget)
    const { error } = await supabase.from('clients').insert({
      organization_id: profile.organization_id,
      name: String(values.get('name') || '').trim(),
      email: String(values.get('email') || '').trim() || null,
      phone: String(values.get('phone') || '').trim() || null,
      address: String(values.get('address') || '').trim() || null,
    })
    setSaving(false)
    if (error) { setActionError('Não foi possível salvar o cliente. Tente novamente.'); return }
    setShowClientForm(false)
    setNotice('Cliente adicionado à sua carteira.')
    await refreshWorkspace()
  }

  async function createOrder(event) {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    const values = new FormData(event.currentTarget)
    const scheduledAt = String(values.get('scheduled_for') || '')
    const { data, error } = await supabase.from('service_orders').insert({
      organization_id: profile.organization_id,
      created_by: user.id,
      client_id: String(values.get('client_id') || '') || null,
      assigned_to: String(values.get('assigned_to') || '') || null,
      code: `OS-${Date.now().toString().slice(-8)}`,
      title: String(values.get('title') || '').trim(),
      description: String(values.get('description') || '').trim() || null,
      status: scheduledAt ? 'scheduled' : 'open',
      scheduled_for: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    }).select().single()
    setSaving(false)
    if (error) { setActionError('Não foi possível criar a ordem. Tente novamente.'); return }
    setShowOrderForm(false)
    setSection('orders')
    setNotice('Ordem de serviço criada.')
    await refreshWorkspace()
    setSelectedOrderId(data.id)
  }

  async function changeStatus(orderId, status) {
    setActionError('')
    const updates = { status, updated_at: new Date().toISOString() }
    if (status === 'in_progress') updates.started_at = new Date().toISOString()
    if (status === 'completed') updates.completed_at = new Date().toISOString()
    const { error } = await supabase.from('service_orders').update(updates).eq('id', orderId).eq('organization_id', profile.organization_id)
    if (error) { setActionError('Não foi possível atualizar o status da ordem.'); return }
    await refreshWorkspace()
  }

  async function addEvidence(event, orderId) {
    event.preventDefault()
    const form = event.currentTarget
    setSaving(true)
    setActionError('')
    const values = new FormData(event.currentTarget)
    const note = String(values.get('content') || '').trim()
    const file = values.get('photo')
    let evidenceRecord
    if (file instanceof File && file.size > 0) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
      const storagePath = `${profile.organization_id}/${orderId}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from('service-evidence').upload(storagePath, file, { contentType: file.type || 'application/octet-stream', upsert: false })
      if (uploadError) {
        setSaving(false)
        setActionError('Não foi possível enviar a foto. Confira se o bucket service-evidence foi criado pelo schema.sql.')
        return
      }
      evidenceRecord = { evidence_type: 'photo', storage_path: storagePath, content: note || null }
    } else if (note) {
      evidenceRecord = { evidence_type: 'note', content: note }
    } else {
      setSaving(false)
      setActionError('Escreva uma observação ou escolha uma foto.')
      return
    }
    const { error } = await supabase.from('service_evidence').insert({
      ...evidenceRecord,
      organization_id: profile.organization_id,
      service_order_id: orderId,
      created_by: user.id,
    })
    setSaving(false)
    if (error) { setActionError('O arquivo foi enviado, mas não foi possível registrar a evidência. Tente novamente.'); return }
    form.reset()
    setNotice('Evidência adicionada à ordem.')
    await refreshWorkspace()
  }

  if (inviteProcessing) return <div className="platform-loading"><LoaderCircle className="spin" size={23} /><span>Validando e aceitando o convite…</span></div>

  if (inviteAcceptError) return <main className="setup-shell">
    <div className="access-topbar"><Brand onClick={onExit} /><button className="access-back" onClick={onSignOut}><LogOut size={15} /> Sair e trocar de conta</button></div>
    <section className="setup-card"><div className="setup-icon"><MailPlus size={23} /></div><span className="access-kicker">CONVITE DA EQUIPE</span><h1>Não foi possível entrar</h1><p>{inviteAcceptError}</p><div className="access-message access-error invite-error-box"><AlertCircle size={16} /><span>O convite precisa ser aceito com o endereço de e-mail para o qual foi enviado.</span></div></section>
  </main>

  if (loading) return <div className="platform-loading"><LoaderCircle className="spin" size={23} /><span>Carregando sua operação…</span></div>

  if (!profile) {
    return <main className="setup-shell">
      <div className="access-topbar"><Brand onClick={onExit} /><button className="access-back" onClick={onSignOut}><LogOut size={15} /> Sair da conta</button></div>
      <section className="setup-card">
        <div className="setup-icon"><Building2 size={23} /></div>
        <span className="access-kicker">SÓ MAIS UM PASSO</span>
        <h1>Configure sua empresa</h1>
        <p>Vamos preparar seu espaço de trabalho para você organizar os serviços e convidar sua equipe.</p>
        <form className="platform-form" onSubmit={finishSetup}>
          <label>Seu nome<input value={fullName} onChange={(event) => setFullName(event.target.value)} autoComplete="name" required /></label>
          <label>Nome da empresa<input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} autoComplete="organization" minLength="2" required /></label>
          {setupError && <div className="access-message access-error"><AlertCircle size={16} /><span>{setupError}</span></div>}
          <button className="platform-primary" disabled={setupBusy}>{setupBusy ? <LoaderCircle className="spin" size={16} /> : null}Criar espaço de trabalho <ArrowRight size={16} /></button>
        </form>
      </section>
    </main>
  }

  if (profile.role === 'owner' && !organization?.plan_code) {
    return <main className="setup-shell plan-setup-shell">
      <div className="access-topbar"><Brand onClick={onExit} /><button className="access-back" onClick={onSignOut}><LogOut size={15} /> Sair da conta</button></div>
      <PlanPage currentPlan={null} organization={organization} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} selectedInterval={selectedInterval} setSelectedInterval={setSelectedInterval} onSave={savePlan} busy={planBusy} error={planError} initialSetup />
    </main>
  }

  return (
    <div className="workspace-shell">
      <aside className="workspace-sidebar">
        <Brand onClick={onExit} />
        <div className="workspace-company"><span className="company-avatar">{initials(organization?.name || 'Prumo')}</span><span><strong>{organization?.name || 'Sua empresa'}</strong><small>Espaço de trabalho</small></span><ChevronDown size={14} /></div>
        <span className="sidebar-label">MENU PRINCIPAL</span>
        <nav className="workspace-nav" aria-label="Menu da plataforma">
          {navigation.map(({ id, label, icon: Icon }) => <button key={id} className={section === id ? 'selected' : ''} onClick={() => { setSection(id); setQuery('') }}><Icon size={17} /><span>{label}</span>{id === 'orders' && activeOrders.length > 0 && <i className="nav-count">{activeOrders.length}</i>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <button className={section === 'settings' ? 'selected' : ''} onClick={() => setSection('settings')}><Settings2 size={17} /><span>Configurações</span></button>
          <button onClick={onExit}><ArrowUpRight size={17} /><span>Voltar ao site</span></button>
          <div className="sidebar-user"><span className="user-avatar">{initials(profile.full_name || user.email || '')}</span><span className="user-info"><strong>{profile.full_name || user.email}</strong><small>{roleNames[profile.role] || 'Membro'}</small></span><button className="signout-button" onClick={onSignOut} title="Sair" aria-label="Sair"><LogOut size={16} /></button></div>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-topbar">
          <div className="workspace-breadcrumb"><span>Prumo</span><ChevronRight size={14} /><strong>{title}</strong></div>
          <div className="workspace-top-actions"><span className="workspace-live"><i /> Operação conectada</span><span className="user-avatar top-avatar">{initials(profile.full_name || user.email || '')}</span></div>
        </header>
        <div className="workspace-content">
          {pageError && <div className="workspace-alert"><AlertCircle size={16} />{pageError}</div>}
          {notice && <div className="workspace-alert success-alert"><CheckCircle2 size={16} />{notice}<button onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={14} /></button></div>}
          {renderSection()}
        </div>
      </main>
      {selectedOrder && <OrderPanel
        order={selectedOrder}
        clientName={orderClientNames[selectedOrder.client_id]}
        assigneeName={memberNames[selectedOrder.assigned_to]}
        evidence={evidence.filter((item) => item.service_order_id === selectedOrder.id)}
        error={actionError}
        saving={saving}
        onClose={() => { setSelectedOrderId(null); setActionError('') }}
        onStatusChange={(status) => changeStatus(selectedOrder.id, status)}
        onAddEvidence={(event) => addEvidence(event, selectedOrder.id)}
      />}
      {showOrderForm && <Modal title="Nova ordem de serviço" subtitle="Organize um novo atendimento da sua operação." onClose={() => { setShowOrderForm(false); setActionError('') }}>
        <form className="platform-form modal-form" onSubmit={createOrder}>
          <label>Serviço<input name="title" placeholder="Ex.: Manutenção preventiva" required autoFocus /></label>
          <label>Cliente<select name="client_id"><option value="">Selecionar depois</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
          <label>Responsável<select name="assigned_to"><option value="">Definir depois</option>{members.map((member) => <option key={member.id} value={member.id}>{member.full_name || roleNames[member.role] || 'Membro'}</option>)}</select></label>
          <label>Data e horário<input name="scheduled_for" type="datetime-local" /></label>
          <label>Instruções<textarea name="description" rows="3" placeholder="O que a equipe precisa saber?" /></label>
          {actionError && <div className="access-message access-error"><AlertCircle size={16} />{actionError}</div>}
          <button className="platform-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}Criar ordem</button>
        </form>
      </Modal>}
      {showClientForm && <Modal title="Adicionar cliente" subtitle="Cadastre os dados principais para associar aos serviços." onClose={() => { setShowClientForm(false); setActionError('') }}>
        <form className="platform-form modal-form" onSubmit={createClient}>
          <label>Nome do cliente<input name="name" placeholder="Ex.: Edifício Horizonte" required autoFocus /></label>
          <div className="form-two-columns"><label>E-mail<input name="email" type="email" placeholder="contato@cliente.com.br" /></label><label>Telefone<input name="phone" type="tel" placeholder="(11) 99999-9999" /></label></div>
          <label>Endereço<input name="address" placeholder="Rua, número, cidade" /></label>
          {actionError && <div className="access-message access-error"><AlertCircle size={16} />{actionError}</div>}
          <button className="platform-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}Salvar cliente</button>
        </form>
      </Modal>}
      {showInviteForm && <Modal title="Convidar colaborador" subtitle="O convite fica válido por 7 dias e só pode ser aceito com este e-mail." onClose={() => setShowInviteForm(false)}>
        <form className="platform-form modal-form" onSubmit={createTeamInvite}>
          <label>E-mail do colaborador<input name="email" type="email" placeholder="pessoa@empresa.com.br" autoComplete="email" required autoFocus /></label>
          <label>Permissão<select name="role" defaultValue="technician"><option value="technician">Técnico</option><option value="manager">Gestor</option></select></label>
          {inviteActionError && <div className="access-message access-error"><AlertCircle size={16} /><span>{inviteActionError}</span></div>}
          <button className="platform-primary" disabled={inviteBusy}>{inviteBusy ? <LoaderCircle className="spin" size={16} /> : <MailPlus size={16} />}Criar convite</button>
        </form>
      </Modal>}
      {createdInvite && <Modal title="Convite pronto" subtitle="O link é exibido apenas agora. Copie ou abra um rascunho de e-mail para enviar ao colaborador." onClose={() => { setCreatedInvite(null); setCopiedInvite(false); setInviteActionError('') }}>
        <div className="invite-ready">
          <div className="access-message invite-manual-note"><Mail size={16} /><span>Sem SMTP configurado, o Prumo não envia a mensagem sozinho. Use o rascunho abaixo ou envie o link por outro canal seguro.</span></div>
          <label>Link individual do convite<input readOnly value={createdInvite.link} onFocus={(event) => event.target.select()} /></label>
          <div className="invite-actions"><button className="platform-secondary" onClick={copyInviteLink}><Copy size={15} />{copiedInvite ? 'Link copiado' : 'Copiar link'}</button><a className="platform-primary" href={`mailto:${encodeURIComponent(createdInvite.email)}?subject=${encodeURIComponent(`Convite para ${organization?.name || 'a equipe Prumo'}`)}&body=${encodeURIComponent(`Olá! Você foi convidado para participar da equipe ${organization?.name || 'no Prumo'} como ${roleNames[createdInvite.role] || 'membro'}.\n\nCrie sua conta ou entre usando ${createdInvite.email} neste link (válido por 7 dias):\n${createdInvite.link}\n\nSe precisar, peça um novo convite ao administrador.`)}`}><Mail size={15} />Abrir rascunho de e-mail</a></div>
          <p>Por segurança, o link só pode ser usado pela conta autenticada com {createdInvite.email}. Se perder o link, cancele o convite e crie outro.</p>
          {inviteActionError && <div className="access-message access-error"><AlertCircle size={16} /><span>{inviteActionError}</span></div>}
        </div>
      </Modal>}
    </div>
  )

  function renderSection() {
    if (section === 'overview') return <Overview
      name={profile.full_name}
      orders={orders}
      clients={clients}
      activeOrders={activeOrders}
      evidence={evidence}
      clientNames={orderClientNames}
      onCreateOrder={() => { setActionError(''); setShowOrderForm(true) }}
      onSelectOrder={setSelectedOrderId}
      onNavigate={setSection}
    />
    if (section === 'orders') return <OrdersPage orders={filteredOrders} allCount={orders.length} query={query} setQuery={setQuery} clients={orderClientNames} onCreate={() => { setActionError(''); setShowOrderForm(true) }} onSelect={setSelectedOrderId} />
    if (section === 'clients') return <ClientsPage clients={filteredClients} allCount={clients.length} query={query} setQuery={setQuery} orders={orders} onCreate={() => { setActionError(''); setShowClientForm(true) }} />
    if (section === 'team') return <TeamPage members={members} invitations={invitations} canManage={['owner', 'manager'].includes(profile.role)} onInvite={() => { setInviteActionError(''); setCreatedInvite(null); setShowInviteForm(true) }} onRevoke={revokeInvitation} />
    if (section === 'evidence') return <EvidencePage evidence={evidence} orders={orders} onSelectOrder={setSelectedOrderId} />
    if (section === 'billing') return <PlanPage currentPlan={organization?.plan_code} organization={organization} selectedPlan={selectedPlan} setSelectedPlan={setSelectedPlan} selectedInterval={selectedInterval} setSelectedInterval={setSelectedInterval} onSave={savePlan} busy={planBusy} error={planError} canManage={profile.role === 'owner'} billingStatus={organization?.billing_status} />
    return <SettingsPage organization={organization} profile={profile} user={user} />
  }
}

function Overview({ name, orders, clients, activeOrders, evidence, clientNames, onCreateOrder, onSelectOrder, onNavigate }) {
  const latest = orders.slice(0, 5)
  const completed = orders.filter((order) => order.status === 'completed').length
  return <>
    <div className="overview-heading"><div><span className="workspace-eyebrow">PAINEL DA OPERAÇÃO</span><h1>Olá, {name?.split(' ')[0] || 'bem-vindo'} <span>👋</span></h1><p>Acompanhe o ritmo dos serviços e os registros da sua equipe.</p></div><button className="platform-primary" onClick={onCreateOrder}><Plus size={16} /> Nova ordem</button></div>
    <div className="metric-grid">
      <Metric icon={ClipboardList} label="Ordens ativas" value={activeOrders.length} note="Abertas, agendadas e em campo" tone="yellow" />
      <Metric icon={CheckCircle2} label="Serviços concluídos" value={completed} note="No histórico da empresa" tone="green" />
      <Metric icon={Building2} label="Clientes" value={clients.length} note="Na sua carteira" tone="blue" />
      <Metric icon={FileCheck2} label="Evidências" value={evidence.length} note="Fotos e observações registradas" tone="violet" />
    </div>
    <div className="overview-grid">
      <section className="workspace-card recent-orders"><div className="card-heading"><div><h2>Ordens recentes</h2><p>O que está acontecendo na operação.</p></div><button className="subtle-link" onClick={() => onNavigate('orders')}>Ver todas <ArrowRight size={14} /></button></div>
        {latest.length ? <OrdersTable orders={latest} clients={clientNames} onSelect={onSelectOrder} compact /> : <EmptyState icon={ClipboardList} title="Sua primeira ordem começa aqui" description="Cadastre um serviço para acompanhar o trabalho da equipe do início à conclusão." action="Criar ordem de serviço" onClick={onCreateOrder} />}
      </section>
      <section className="workspace-card operation-card"><div className="card-heading"><div><h2>Resumo da operação</h2><p>Visão rápida do seu espaço de trabalho.</p></div><span className="summary-icon"><Wrench size={17} /></span></div>
        <div className="operation-summary"><span className="summary-indicator"><i /></span><div><strong>{activeOrders.length ? `${activeOrders.length} serviços em aberto` : 'Tudo em dia por aqui'}</strong><span>{activeOrders.length ? 'Acompanhe atualizações e conclusão.' : 'Novas ordens aparecerão neste painel.'}</span></div></div>
        <div className="summary-divider" />
        <button className="summary-action" onClick={() => onNavigate('evidence')}><span className="summary-action-icon"><FileCheck2 size={15} /></span><span><strong>Comprovantes de serviço</strong><small>{evidence.length} registros disponíveis</small></span><ChevronRight size={16} /></button>
        <button className="summary-action" onClick={() => onNavigate('clients')}><span className="summary-action-icon clients-icon"><Users size={15} /></span><span><strong>Carteira de clientes</strong><small>{clients.length} clientes cadastrados</small></span><ChevronRight size={16} /></button>
      </section>
    </div>
    <div className="workspace-footnote"><ShieldCheck size={14} /><span>Os dados deste espaço são visíveis apenas para os membros da sua empresa.</span></div>
  </>
}

function Metric({ icon: Icon, label, value, note, tone }) {
  return <article className="metric-card"><div className={`metric-icon metric-${tone}`}><Icon size={17} /></div><span className="metric-label">{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function OrdersPage({ orders, allCount, query, setQuery, clients, onCreate, onSelect }) {
  return <>
    <div className="page-heading"><div><span className="workspace-eyebrow">ACOMPANHAMENTO DE SERVIÇOS</span><h1>Ordens de serviço</h1><p>Organize atendimentos e acompanhe cada etapa da execução.</p></div><button className="platform-primary" onClick={onCreate}><Plus size={16} /> Nova ordem</button></div>
    <section className="workspace-card list-card"><div className="list-toolbar"><div><strong>{allCount} {allCount === 1 ? 'ordem' : 'ordens'}</strong><span> registradas</span></div><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ordem ou cliente" /></label></div>
      {orders.length ? <OrdersTable orders={orders} clients={clients} onSelect={onSelect} /> : <EmptyState icon={ClipboardList} title={query ? 'Nenhuma ordem encontrada' : 'Nenhuma ordem cadastrada'} description={query ? 'Tente buscar por outro código, serviço ou cliente.' : 'Crie sua primeira ordem para começar a acompanhar a execução.'} />}
    </section>
  </>
}

function OrdersTable({ orders, clients, onSelect, compact = false }) {
  return <div className={`orders-table-wrap ${compact ? 'compact-table' : ''}`}><table className="orders-table"><thead><tr><th>Serviço</th><th>Cliente</th><th>Data</th><th>Status</th><th aria-label="Abrir" /></tr></thead><tbody>{orders.map((order) => <tr key={order.id} onClick={() => onSelect(order.id)} tabIndex="0" onKeyDown={(event) => { if (event.key === 'Enter') onSelect(order.id) }}>
    <td><div className="service-name"><span className="order-icon"><Wrench size={15} /></span><span><strong>{order.title}</strong><small>{order.code}</small></span></div></td>
    <td className="table-secondary">{clients[order.client_id] || <span className="dimmed">Sem cliente associado</span>}</td>
    <td className="table-secondary">{formatDate(order.scheduled_for || order.created_at)}</td>
    <td><StatusBadge status={order.status} /></td><td><ChevronRight size={15} className="row-arrow" /></td>
  </tr>)}</tbody></table></div>
}

function ClientsPage({ clients, allCount, query, setQuery, orders, onCreate }) {
  const countForClient = (clientId) => orders.filter((order) => order.client_id === clientId).length
  return <>
    <div className="page-heading"><div><span className="workspace-eyebrow">RELACIONAMENTO</span><h1>Clientes</h1><p>Consulte seus contatos e o histórico de serviços.</p></div><button className="platform-primary" onClick={onCreate}><Plus size={16} /> Adicionar cliente</button></div>
    <section className="workspace-card list-card"><div className="list-toolbar"><div><strong>{allCount} {allCount === 1 ? 'cliente' : 'clientes'}</strong><span> na carteira</span></div><label className="search-field"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente" /></label></div>
      {clients.length ? <div className="client-grid">{clients.map((client) => <article className="client-card" key={client.id}><div className="client-card-top"><span className="client-avatar">{initials(client.name)}</span><span className="client-service-count">{countForClient(client.id)} {countForClient(client.id) === 1 ? 'serviço' : 'serviços'}</span></div><h2>{client.name}</h2><div className="client-details">{client.email && <span><Mail size={14} />{client.email}</span>}{client.phone && <span><CircleUserRound size={14} />{client.phone}</span>}{client.address && <span><MapPin size={14} />{client.address}</span>}{!client.email && !client.phone && !client.address && <span className="dimmed">Adicionado {formatDate(client.created_at)}</span>}</div></article>)}</div> : <EmptyState icon={Building2} title={query ? 'Nenhum cliente encontrado' : 'Sua carteira está vazia'} description={query ? 'Tente buscar por outro nome ou contato.' : 'Cadastre seus clientes para associar os atendimentos.'} />}
    </section>
  </>
}

function TeamPage({ members, invitations, canManage, onInvite, onRevoke }) {
  return <>
    <div className="page-heading"><div><span className="workspace-eyebrow">PESSOAS DA EMPRESA</span><h1>Equipe</h1><p>Convide colaboradores pelo e-mail e acompanhe quem já tem acesso.</p></div>{canManage && <button className="platform-primary" onClick={onInvite}><MailPlus size={16} /> Convidar colaborador</button>}</div>
    <section className="workspace-card list-card"><div className="list-toolbar"><div><strong>{members.length} {members.length === 1 ? 'membro' : 'membros'}</strong><span> neste espaço</span></div><span className="team-access-note"><ShieldCheck size={14} /> Acesso protegido</span></div>
      <div className="members-list">{members.map((member) => <article className="member-row" key={member.id}><span className="member-avatar">{initials(member.full_name)}</span><span className="member-name"><strong>{member.full_name || 'Membro sem nome'}</strong><small>{member.role === 'owner' ? 'Administrador da empresa' : 'Membro da empresa'}</small></span><span className="member-role">{roleNames[member.role] || 'Membro'}</span>{member.role === 'owner' && <span className="owner-tag">Admin principal</span>}</article>)}</div>
      <div className="team-note"><Users size={16} /><span>O colaborador cria ou acessa a conta usando o mesmo endereço que recebeu o convite. A associação à empresa acontece ao aceitar o link.</span></div>
    </section>
    {canManage && <section className="workspace-card list-card invitations-card"><div className="list-toolbar"><div><strong>Convites pendentes</strong><span> · {invitations.length}</span></div><span className="invite-expiry-note">Validade de 7 dias</span></div>
      {invitations.length ? <div className="members-list">{invitations.map((invitation) => <article className="member-row invitation-row" key={invitation.id}><span className="member-avatar invitation-avatar"><Mail size={15} /></span><span className="member-name"><strong>{invitation.email}</strong><small>Enviado {formatDate(invitation.created_at, { day: '2-digit', month: 'short', year: 'numeric' })} · expira {formatDate(invitation.expires_at, { day: '2-digit', month: 'short', year: 'numeric' })}</small></span><span className="member-role">{roleNames[invitation.role]}</span><button className="revoke-invite" onClick={() => onRevoke(invitation.id)} title="Cancelar convite" aria-label={`Cancelar convite para ${invitation.email}`}><Trash2 size={15} /></button></article>)}</div> : <EmptyState icon={MailPlus} title="Nenhum convite pendente" description="Os convites que você criar aparecerão aqui até serem aceitos ou expirarem." />}
    </section>}
  </>
}

function PlanPage({ currentPlan, organization, selectedPlan, setSelectedPlan, selectedInterval, setSelectedInterval, onSave, busy, error, initialSetup = false, canManage = true, billingStatus = 'beta' }) {
  const [stage, setStage] = useState(currentPlan ? 'checkout' : 'plans')
  const activePlan = plans.find((plan) => plan.code === currentPlan)
  const chosenPlan = plans.find((plan) => plan.code === (selectedPlan || currentPlan))
  const localPlan = selectedPlan || currentPlan || ''
  const currentInterval = selectedInterval || organization?.plan_interval || 'monthly'
  const hasUsedTrial = Boolean(organization?.trial_started_at)

  useEffect(() => {
    if (organization?.plan_interval && !selectedPlan) setSelectedInterval(organization.plan_interval)
    if (currentPlan && !selectedPlan) setSelectedPlan(currentPlan)
  }, [organization?.plan_interval, currentPlan, selectedPlan, setSelectedInterval, setSelectedPlan])

  const trialExpired = organization?.trial_ends_at && new Date(organization.trial_ends_at).getTime() <= Date.now()
  const currentStatus = billingStatus === 'trialing'
    ? trialExpired ? 'Teste encerrado · nenhuma cobrança feita' : `Teste grátis até ${formatDate(organization?.trial_ends_at, { day: '2-digit', month: 'long', year: 'numeric' })}`
    : billingStatus === 'checkout_pending'
      ? 'Plano escolhido · pagamento pendente'
      : 'Acesso beta · sem cobrança'

  return <section className={`plan-page ${initialSetup ? 'plan-setup-card' : ''}`}>
    <div className="page-heading"><div><span className="workspace-eyebrow">{initialSetup ? 'PLANO DA CONTA QUE VOCÊ CRIOU' : 'ASSINATURA DA EMPRESA'}</span><h1>{initialSetup ? 'Escolha seu plano' : 'Plano e pagamento'}</h1><p>{initialSetup ? 'A contratação fica vinculada à conta que criou esta empresa.' : 'O responsável que criou a conta pode gerenciar a assinatura.'}</p></div></div>
    {!initialSetup && <div className="workspace-card billing-summary"><span className="billing-icon"><CreditCard size={18} /></span><div><small>STATUS DA ASSINATURA</small><strong>{currentStatus}</strong><p>{activePlan?.name || 'Plano não selecionado'}{organization?.plan_price_cents ? ` · ${formatPrice(organization.plan_price_cents)} / ${organization.plan_interval === 'yearly' ? 'ano' : 'mês'}` : ''}</p></div>{canManage && <button className="platform-secondary" onClick={() => setStage('plans')}>Mudar plano</button>}</div>}
    {stage === 'plans' ? <>
      <div className="billing-interval-switch" role="group" aria-label="Período de cobrança"><button className={currentInterval === 'monthly' ? 'active' : ''} onClick={() => setSelectedInterval('monthly')}>Mensal</button><button className={currentInterval === 'yearly' ? 'active' : ''} onClick={() => setSelectedInterval('yearly')}>Anual <span>2 meses grátis</span></button></div>
      <div className="plan-choice-grid">{plans.map((plan) => {
        const amount = planPrice(plan, currentInterval)
        return <button key={plan.code} type="button" className={`workspace-card plan-choice ${localPlan === plan.code ? 'plan-selected' : ''}`} onClick={() => setSelectedPlan(plan.code)}>
          <span className="plan-choice-top"><strong>{plan.name}</strong><span>{localPlan === plan.code ? <CheckCircle2 size={17} /> : null}</span></span><span className="plan-price">{formatPrice(amount)} <small>/ {currentInterval === 'yearly' ? 'ano' : 'mês'}</small></span><span className="plan-description">{plan.detail}</span><span className="plan-features">{plan.features.map((feature) => <span key={feature}><CheckCircle2 size={14} />{feature}</span>)}</span>
        </button>
      })}</div>
      <p className="plan-pricing-note">Valores provisórios para estruturar o fluxo. O checkout ainda não está conectado.</p>
      {error && <div className="access-message access-error"><AlertCircle size={16} /><span>{error}</span></div>}
      {canManage ? <button className="platform-primary plan-continue" disabled={!localPlan} onClick={() => setStage('checkout')}>Continuar <ArrowRight size={16} /></button> : <div className="access-message"><ShieldCheck size={16} /><span>Apenas a pessoa que criou a conta pode alterar o plano.</span></div>}
    </> : <section className="workspace-card payment-stage">
      <span className="billing-icon"><CreditCard size={18} /></span><span className="access-kicker">ETAPA 2 · TESTE OU COMPRA</span><h2>{chosenPlan?.name || activePlan?.name || 'Plano selecionado'}</h2>
      <p>{formatPrice(planPrice(chosenPlan || activePlan || plans[0], currentInterval))} / {currentInterval === 'yearly' ? 'ano' : 'mês'} · {currentInterval === 'yearly' ? 'cobrança anual' : 'cobrança mensal'}</p>
      <div className="checkout-choice-grid">
        <article className={`checkout-choice ${!hasUsedTrial ? 'trial-choice' : 'trial-used'}`}>
          <span className="checkout-choice-kicker">PERÍODO DE TESTE</span><strong>{hasUsedTrial ? trialExpired ? 'Teste já utilizado' : 'Teste em andamento' : '14 dias grátis'}</strong><p>{hasUsedTrial ? `${trialExpired ? 'O teste terminou' : 'O teste termina'} em ${formatDate(organization?.trial_ends_at, { day: '2-digit', month: 'short', year: 'numeric' })}.` : 'Acesso ao plano sem cadastrar pagamento e sem cobrança automática ao final.'}</p>
          {canManage && <button className="platform-secondary" disabled={busy || hasUsedTrial || !chosenPlan} onClick={() => onSave(true)}>{busy ? <LoaderCircle className="spin" size={15} /> : null}Iniciar teste grátis</button>}
        </article>
        <article className="checkout-choice">
          <span className="checkout-choice-kicker">ASSINAR PLANO</span><strong>{formatPrice(planPrice(chosenPlan || activePlan || plans[0], currentInterval))} <small>/ {currentInterval === 'yearly' ? 'ano' : 'mês'}</small></strong><p>O Prumo ainda não tem provedor de pagamento conectado. Registrar esta opção não cobra nem captura dados de cartão.</p>
          {canManage && <button className="platform-primary" disabled={busy || !chosenPlan} onClick={() => onSave(false)}>{busy ? <LoaderCircle className="spin" size={15} /> : <CreditCard size={15} />}Registrar plano e continuar no beta</button>}
        </article>
      </div>
      {error && <div className="access-message access-error"><AlertCircle size={16} /><span>{error}</span></div>}
      <div className="payment-placeholder"><span>Próxima etapa de pagamento</span><strong>Checkout será habilitado quando o provedor for integrado</strong><small>O valor e o período ficam registrados no Supabase; nenhuma cobrança acontece nesta etapa.</small></div>
      {!initialSetup && canManage && <button className="platform-secondary checkout-back" onClick={() => setStage('plans')}>Voltar aos planos</button>}
      {!canManage && <div className="access-message"><ShieldCheck size={16} /><span>A assinatura é administrada pela pessoa que criou a conta.</span></div>}
    </section>}
  </section>
}

function EvidencePage({ evidence, orders, onSelectOrder }) {
  const orderById = Object.fromEntries(orders.map((order) => [order.id, order]))
  return <>
    <div className="page-heading"><div><span className="workspace-eyebrow">REGISTROS DO CAMPO</span><h1>Comprovantes</h1><p>Fotos e observações vinculadas aos serviços executados.</p></div></div>
    <section className="workspace-card list-card"><div className="list-toolbar"><div><strong>{evidence.length} {evidence.length === 1 ? 'evidência' : 'evidências'}</strong><span> registradas</span></div></div>
      {evidence.length ? <div className="evidence-list">{evidence.map((item) => {
        const order = orderById[item.service_order_id]
        return <button className="evidence-row" key={item.id} onClick={() => order && onSelectOrder(order.id)} disabled={!order}>
          <span className={`evidence-icon ${item.evidence_type === 'photo' ? 'photo-evidence' : ''}`}>{item.evidence_type === 'photo' && item.storage_path ? <ProtectedPhoto path={item.storage_path} compact /> : item.evidence_type === 'photo' ? <Camera size={17} /> : <StickyNote size={17} />}</span>
          <span className="evidence-copy"><strong>{item.evidence_type === 'photo' ? 'Foto registrada' : 'Observação de serviço'}</strong><span>{item.content || (order ? `${order.code} · ${order.title}` : 'Ordem de serviço')}</span></span>
          <span className="evidence-date">{formatDate(item.created_at, { day: '2-digit', month: 'short', year: 'numeric' })}</span><ArrowUpRight size={15} />
        </button>
      })}</div> : <EmptyState icon={FileCheck2} title="Ainda sem comprovantes" description="Adicione fotos e observações dentro de uma ordem para montar o histórico do serviço." />}
    </section>
  </>
}

function SettingsPage({ organization, profile, user }) {
  return <>
    <div className="page-heading"><div><span className="workspace-eyebrow">SEU ESPAÇO DE TRABALHO</span><h1>Configurações</h1><p>Informações da empresa e da conta que está conectada.</p></div></div>
    <section className="workspace-card settings-card"><div className="settings-section"><span className="settings-symbol"><Building2 size={17} /></span><div><span className="settings-kicker">EMPRESA</span><h2>{organization?.name || 'Sua empresa'}</h2><p>Organização responsável por estes serviços e registros.</p></div></div><div className="settings-divider" /><div className="settings-section"><span className="settings-symbol user-symbol"><CircleUserRound size={17} /></span><div><span className="settings-kicker">CONTA</span><h2>{profile.full_name || 'Membro'}</h2><p>{user.email} · {roleNames[profile.role] || 'Membro'}</p></div></div><div className="settings-footer"><ShieldCheck size={14} /> As informações de empresa são gerenciadas pelos administradores do espaço.</div></section>
  </>
}

function EmptyState({ icon: Icon, title, description, action, onClick }) {
  return <div className="empty-state"><span><Icon size={20} /></span><strong>{title}</strong><p>{description}</p>{action && <button className="platform-secondary" onClick={onClick}><Plus size={15} />{action}</button>}</div>
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="modal-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="form-modal" aria-modal="true" role="dialog" aria-labelledby="form-modal-title"><div className="form-modal-heading"><div><span className="modal-kicker">PRUMO / OPERAÇÃO</span><h2 id="form-modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={17} /></button></div>{children}</section></div>
}

function OrderPanel({ order, clientName, assigneeName, evidence, error, saving, onClose, onStatusChange, onAddEvidence }) {
  return <div className="order-scrim" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><aside className="order-panel" aria-label="Detalhes da ordem"><div className="order-panel-top"><span className="modal-kicker">DETALHES DO SERVIÇO</span><button className="icon-button" onClick={onClose} aria-label="Fechar"><X size={17} /></button></div><span className="order-code">{order.code}</span><h2>{order.title}</h2><StatusBadge status={order.status} />
    <div className="order-facts"><div><Building2 size={16} /><span><small>Cliente</small><strong>{clientName || 'Sem cliente associado'}</strong></span></div><div><CalendarDays size={16} /><span><small>Agendamento</small><strong>{formatDate(order.scheduled_for, { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong></span></div><div><CircleUserRound size={16} /><span><small>Responsável</small><strong>{assigneeName || 'Equipe não definida'}</strong></span></div><div><Clock3 size={16} /><span><small>Criada em</small><strong>{formatDate(order.created_at, { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span></div></div>
    {order.description && <div className="order-description"><span>INSTRUÇÕES</span><p>{order.description}</p></div>}
    <label className="status-select-label">Atualizar andamento<select value={order.status} onChange={(event) => onStatusChange(event.target.value)}>{Object.entries(statuses).map(([value, status]) => <option key={value} value={value}>{status.label}</option>)}</select><ChevronDown size={14} /></label>
    <div className="panel-divider" />
    <div className="panel-evidence-heading"><div><h3>Evidências do serviço</h3><span>{evidence.length} registros</span></div><FileCheck2 size={17} /></div>
    <div className="order-evidence-list">{evidence.length ? evidence.map((item) => <div className="order-evidence-item" key={item.id}><span>{item.evidence_type === 'photo' && item.storage_path ? <ProtectedPhoto path={item.storage_path} compact /> : item.evidence_type === 'photo' ? <Camera size={15} /> : <StickyNote size={15} />}</span><div><strong>{item.content || (item.evidence_type === 'photo' ? 'Foto do atendimento' : 'Observação')}</strong><small>{formatDate(item.created_at, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</small></div></div>) : <p className="no-evidence">Adicione uma foto ou observação para registrar a execução.</p>}</div>
    <form className="evidence-form" onSubmit={onAddEvidence}><label>Adicionar observação<textarea name="content" rows="2" placeholder="Descreva o que foi feito…" /></label><label className="upload-field"><Upload size={15} /><span>Adicionar uma foto</span><input type="file" name="photo" accept="image/*" /></label>{error && <div className="access-message access-error"><AlertCircle size={15} />{error}</div>}<button className="platform-primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={15} /> : <Plus size={15} />}Adicionar evidência</button></form>
  </aside></div>
}

function ProtectedPhoto({ path, compact = false }) {
  const [url, setUrl] = useState('')
  useEffect(() => {
    let active = true
    supabase?.storage.from('service-evidence').createSignedUrl(path, 3600).then(({ data, error }) => {
      if (active && !error) setUrl(data?.signedUrl || '')
    })
    return () => { active = false }
  }, [path])
  if (!url) return <Camera size={compact ? 15 : 17} />
  return <img className={`protected-photo ${compact ? 'protected-photo-compact' : ''}`} src={url} alt="Foto anexada ao comprovante do serviço" loading="lazy" />
}

export default Platform
