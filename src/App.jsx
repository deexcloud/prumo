import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  MapPin,
  Menu,
  Play,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react'
import { createDemoRequest } from './lib/leads'
import { Button } from './components/ui/primitives'
import Platform from './Platform'

const benefits = [
  {
    icon: ClipboardCheck,
    title: 'Cada etapa, no lugar certo',
    text: 'Organize ordens de serviço, responsáveis e prazos sem depender de conversas perdidas.',
  },
  {
    icon: Camera,
    title: 'A prova acontece no campo',
    text: 'Fotos, horário, localização e assinatura ficam ligados ao atendimento executado.',
  },
  {
    icon: ShieldCheck,
    title: 'Mais confiança no pós-serviço',
    text: 'Envie um comprovante claro para o cliente e mantenha o histórico sempre acessível.',
  },
]

function BrandMark({ className = '' }) {
  return (
    <span className={`brand-mark ${className}`} aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </span>
  )
}

function BrandName({ light = false }) {
  return (
    <a className={`brand-lockup ${light ? 'text-white' : ''}`} href="#inicio" aria-label="Prumo, início">
      <BrandMark />
      <span>prumo<span className="brand-period">.</span></span>
    </a>
  )
}

function Pill({ children, className = '' }) {
  return <span className={`pill ${className}`}>{children}</span>
}

function DashboardPreview() {
  const rows = [
    { id: 'OS-2841', name: 'Manutenção preventiva', client: 'Edifício Horizonte', time: '09:42', state: 'Concluído', tone: 'done', initials: 'RF', color: 'sage' },
    { id: 'OS-2840', name: 'Inspeção de equipamentos', client: 'Clínica Vida Plena', time: '10:15', state: 'Em andamento', tone: 'progress', initials: 'MC', color: 'violet' },
    { id: 'OS-2839', name: 'Reparo hidráulico', client: 'Mercado Boa Praça', time: '11:30', state: 'Agendado', tone: 'scheduled', initials: 'JL', color: 'blue' },
  ]

  return (
    <div className="dashboard-scene">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="dashboard-window">
        <div className="window-topbar">
          <div className="window-dots"><i /><i /><i /></div>
          <span className="window-label">prumo.app <span>/</span> operação</span>
          <div className="window-user"><span className="online-dot" /> AO VIVO</div>
        </div>
        <div className="dashboard-content">
          <aside className="mock-sidebar">
            <BrandMark className="mock-brand-mark" />
            <span className="mock-nav active"><ClipboardCheck size={15} /></span>
            <span className="mock-nav"><Route size={15} /></span>
            <span className="mock-nav"><FileCheck2 size={15} /></span>
            <span className="mock-nav"><Smartphone size={15} /></span>
            <span className="mock-avatar">MA</span>
          </aside>
          <div className="mock-main">
            <div className="mock-heading-row">
              <div>
                <span className="mock-eyebrow">HOJE, 27 DE SETEMBRO</span>
                <h3>Bom dia, Marina <span>☀</span></h3>
                <p>Acompanhe a operação da sua equipe hoje.</p>
              </div>
              <Button variant="outline" size="sm" className="mock-add"><span>+</span> Nova ordem</Button>
            </div>
            <div className="mock-stats">
              <div className="mock-stat"><span>Ordens hoje</span><strong>24</strong><small><b>↑ 12%</b> vs. ontem</small></div>
              <div className="mock-stat"><span>Em andamento</span><strong>06</strong><small>4 equipes em campo</small></div>
              <div className="mock-stat"><span>Comprovantes</span><strong>18</strong><small><b>75%</b> concluídos</small></div>
            </div>
            <div className="mock-list-heading"><strong>Ordens de serviço</strong><span>Ver todas <ArrowUpRight size={12} /></span></div>
            <div className="mock-table">
              {rows.map((row) => (
                <div className="mock-row" key={row.id}>
                  <div className={`mock-row-avatar ${row.color}`}>{row.initials}</div>
                  <div className="mock-row-info"><strong>{row.name}</strong><span>{row.id} <i>·</i> {row.client}</span></div>
                  <div className="mock-row-time"><Clock3 size={11} /> {row.time}</div>
                  <span className={`mock-state ${row.tone}`}><i /> {row.state}</span>
                </div>
              ))}
            </div>
            <div className="mock-footer"><span><span className="online-dot" /> Dados atualizados agora</span><span>Últimas 24 horas <ChevronRight size={12} /></span></div>
          </div>
        </div>
      </div>
      <div className="proof-float">
        <div className="proof-icon"><Check size={16} strokeWidth={2.5} /></div>
        <div><strong>Comprovante enviado</strong><span>OS-2841 · há 2 min</span></div>
        <div className="proof-mini-photo"><Camera size={13} /></div>
      </div>
      <div className="map-float"><MapPin size={15} /><span>Equipe em campo</span><b>04</b></div>
    </div>
  )
}

function BrandExperience() {
  return (
    <div className="brand-demo-wrap">
      <div className="brand-demo-glow" />
      <div className="employee-phone">
        <div className="phone-island" />
        <div className="phone-screen">
          <div className="phone-status"><span>9:41</span><span>●●●  ▰</span></div>
          <div className="employee-brand">
            <div className="client-logo">A<span>.</span></div>
            <div><strong>aurora</strong><small>FACILITIES</small></div>
            <span className="phone-menu"><i /><i /><i /></span>
          </div>
          <div className="phone-welcome"><small>DOMINGO, 27 SET</small><strong>Olá, Rafael 👋</strong><span>Veja os serviços do seu dia.</span></div>
          <div className="phone-job-label">PRÓXIMO ATENDIMENTO</div>
          <div className="phone-job">
            <div className="phone-job-top"><span>OS-2841</span><span className="phone-job-status"><i /> Em atendimento</span></div>
            <strong>Manutenção preventiva</strong>
            <div className="phone-job-location"><MapPin size={12} /> Edifício Horizonte · Bloco B</div>
            <div className="phone-job-divider" />
            <div className="phone-job-time"><Clock3 size={13} /><span>09:00 — 10:30</span><ChevronRight size={13} /></div>
          </div>
          <Button className="phone-start"><CheckCircle2 size={13} /> Iniciar atendimento</Button>
          <div className="phone-bottom"><span className="selected"><ClipboardCheck size={15} /> Hoje</span><span><Route size={15} /> Rota</span><span><FileCheck2 size={15} /> Histórico</span><span><span className="employee-avatar">RF</span> Perfil</span></div>
        </div>
      </div>
      <div className="proof-card-demo">
        <div className="proof-card-head"><div className="client-logo small">A<span>.</span></div><div><strong>aurora facilities</strong><small>Comprovante de serviço</small></div><BadgeCheck size={17} /></div>
        <div className="proof-card-rule" />
        <div className="proof-card-service"><span>SERVIÇO</span><strong>Manutenção preventiva</strong><small>Edifício Horizonte · Bloco B</small></div>
        <div className="proof-card-meta"><span><CheckCircle2 size={13} /> Concluído às 09:42</span><span><MapPin size={13} /> Local confirmado</span></div>
        <div className="proof-card-images"><span><Camera size={13} /> Antes</span><span><Camera size={13} /> Depois</span><span className="proof-sig">RF</span></div>
        <div className="proof-card-footer">Executado por <b>Rafael Ferreira</b><span>27 set 2026</span></div>
      </div>
      <div className="brand-custom-note"><Sparkles size={14} /><span>Com a identidade de cada empresa</span></div>
    </div>
  )
}

function ContactForm({ onSubmit }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function submit(event) {
    event.preventDefault()
    const form = event.currentTarget
    const email = new FormData(form).get('email')
    setIsSubmitting(true)
    const result = await onSubmit(email)
    setIsSubmitting(false)
    if (result.ok) form.reset()
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <input name="email" aria-label="Seu e-mail profissional" type="email" placeholder="Seu e-mail profissional" required />
      <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Enviando…' : 'Quero conhecer'} {!isSubmitting && <ArrowRight size={16} />}</button>
    </form>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [platformOpen, setPlatformOpen] = useState(() => ['#acesso', '#app'].includes(window.location.hash))

  useEffect(() => {
    const syncRoute = () => setPlatformOpen(['#acesso', '#app'].includes(window.location.hash))
    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  const handleDemoRequest = async (email) => {
    let result
    try {
      result = await createDemoRequest(email)
    } catch {
      result = { ok: false, message: 'Não foi possível enviar agora. Tente novamente em instantes.' }
    }
    setNotice(result)
    window.setTimeout(() => setNotice(null), 5000)
    return result
  }

  const closeMenu = () => setMenuOpen(false)

  if (platformOpen) {
    return <Platform onExit={() => {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#inicio`)
      setPlatformOpen(false)
    }} />
  }

  return (
    <div className="site-shell" id="inicio">
      <header className="site-header">
        <div className="header-inner">
          <BrandName />
          <nav className={`desktop-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Navegação principal">
            <a href="#plataforma" onClick={closeMenu}>Plataforma</a>
            <a href="#recursos" onClick={closeMenu}>Recursos</a>
            <a href="#sua-marca" onClick={closeMenu}>Sua marca</a>
            <a href="#como-funciona" onClick={closeMenu}>Como funciona</a>
            <div className="mobile-nav-cta"><a className="mobile-access-link" href="#acesso" onClick={closeMenu}>Acessar plataforma <ArrowUpRight size={14} /></a><a className="button button-primary" href="#contato" onClick={closeMenu}>Agendar demonstração <ArrowRight size={15} /></a></div>
          </nav>
          <div className="header-actions">
            <a className="header-login" href="#acesso">Acessar plataforma <ArrowUpRight size={14} /></a>
            <a className="button button-primary header-cta" href="#contato">Agendar demonstração <ArrowRight size={15} /></a>
            <button className="mobile-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen((open) => !open)}>{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-section" aria-labelledby="hero-title">
          <div className="hero-grid" />
          <div className="hero-inner">
            <div className="hero-copy">
              <Pill className="hero-pill"><span className="pill-pulse" /> OPERAÇÃO DE CAMPO, COMPROVADA</Pill>
              <h1 id="hero-title">Fez o serviço.<br />Ficou a <span>prova.</span></h1>
              <p className="hero-subtitle">Ordens de serviço, equipe em campo e comprovantes digitais no mesmo fluxo. Mais clareza para sua operação. Mais confiança para o seu cliente.</p>
              <div className="hero-actions">
                <a className="button button-primary button-large" href="#contato">Ver o Prumo em ação <ArrowRight size={17} /></a>
                <a className="button button-play" href="#plataforma"><span><Play size={12} fill="currentColor" /></span> Conhecer a plataforma</a>
              </div>
              <div className="hero-note"><div className="mini-avatars"><span>RF</span><span>MC</span><span>JL</span></div><span>Do primeiro chamado ao comprovante final.</span></div>
            </div>
            <DashboardPreview />
          </div>
          <div className="hero-bottom-line"><span>MENOS RETRABALHO</span><i /><span>MAIS VISIBILIDADE</span><i /><span>PROVA EM CADA SERVIÇO</span></div>
        </section>

        <section className="trust-strip" aria-label="Benefícios">
          <div className="trust-item"><span className="trust-icon"><Check size={15} /></span> Atendimento com histórico</div>
          <div className="trust-separator" />
          <div className="trust-item"><span className="trust-icon"><Check size={15} /></span> Evidências organizadas</div>
          <div className="trust-separator" />
          <div className="trust-item"><span className="trust-icon"><Check size={15} /></span> Cliente informado</div>
          <div className="trust-separator" />
          <div className="trust-item"><span className="trust-icon"><Check size={15} /></span> Equipe alinhada</div>
        </section>

        <section className="section platform-section" id="plataforma">
          <div className="section-heading centered">
            <Pill>PLATAFORMA</Pill>
            <h2>A operação inteira.<br /><span>Do seu jeito de trabalhar.</span></h2>
            <p>O Prumo conecta quem planeja, quem executa e quem precisa saber que o serviço foi feito.</p>
          </div>
          <div className="feature-grid" id="recursos">
            {benefits.map(({ icon: Icon, title, text }, index) => (
              <article className="feature-card" key={title}>
                <div className="feature-top"><span className="feature-icon"><Icon size={19} strokeWidth={1.7} /></span><span className="feature-number">0{index + 1}</span></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="feature-link">{index === 0 ? 'Gestão organizada' : index === 1 ? 'Registro confiável' : 'Histórico completo'} <ArrowUpRight size={14} /></div>
              </article>
            ))}
          </div>
          <div className="platform-callout">
            <div className="callout-icon"><FileCheck2 size={20} /></div>
            <div><strong>Um comprovante que vale mais do que “serviço concluído”.</strong><span>Data, hora, localização, fotos e assinatura reunidos em um registro profissional.</span></div>
            <a href="#sua-marca" aria-label="Veja como funciona a prova de serviço"><ArrowRight size={17} /></a>
          </div>
        </section>

        <section className="brand-section" id="sua-marca">
          <div className="brand-section-inner">
            <BrandExperience />
            <div className="brand-copy">
              <Pill><Sparkles size={12} /> UM DIFERENCIAL DO PRUMO</Pill>
              <h2>A sua marca vai<br />junto com a equipe.</h2>
              <p className="brand-lead">O app usado pelos funcionários pode refletir a identidade visual de cada empresa: logo, cores e uma experiência com a cara da marca.</p>
              <p className="brand-body">Essa identidade também aparece nos comprovantes digitais enviados ao cliente. Cada atendimento reforça profissionalismo e confiança — desde a tela do técnico até o registro de serviço concluído.</p>
              <div className="brand-checks">
                <span><CircleCheck size={16} /> Sua logo na experiência da equipe</span>
                <span><CircleCheck size={16} /> Cores alinhadas à sua marca</span>
                <span><CircleCheck size={16} /> Comprovantes com apresentação profissional</span>
              </div>
              <a className="text-link" href="#contato">Conheça essa experiência <ArrowRight size={15} /></a>
            </div>
          </div>
        </section>

        <section className="section how-section" id="como-funciona">
          <div className="section-heading centered">
            <Pill>FLUXO SIMPLES</Pill>
            <h2>Do chamado à prova.<br /><span>Sem perder o fio.</span></h2>
          </div>
          <div className="steps-grid">
            <article className="step-card"><span className="step-index">01</span><div className="step-icon"><ClipboardCheck size={19} /></div><h3>Organize o serviço</h3><p>Crie a ordem, associe o cliente e deixe a equipe saber exatamente o que precisa ser feito.</p><div className="step-line"><i /></div></article>
            <article className="step-card"><span className="step-index">02</span><div className="step-icon"><Smartphone size={19} /></div><h3>Registre no local</h3><p>O funcionário acompanha o atendimento pelo celular e registra a execução em campo.</p><div className="step-line"><i /></div></article>
            <article className="step-card"><span className="step-index">03</span><div className="step-icon"><FileCheck2 size={19} /></div><h3>Compartilhe a prova</h3><p>O comprovante reúne as evidências e fica disponível para a empresa e para o cliente.</p><div className="step-line"><i /></div></article>
          </div>
        </section>

        <section className="cta-section" id="contato">
          <div className="cta-orb" />
          <div className="cta-inner">
            <Pill><span className="pill-pulse" /> PRONTO PARA TER MAIS VISIBILIDADE?</Pill>
            <h2>Todo serviço merece<br />uma boa <span>prova.</span></h2>
            <p>Veja como o Prumo pode deixar sua operação mais organizada e cada atendimento mais transparente.</p>
            <ContactForm onSubmit={handleDemoRequest} />
            <small className="cta-caption"><ShieldCheck size={13} /> Sem compromisso. Vamos entender sua operação.</small>
          </div>
          <div className="cta-decoration"><BrandMark /><span>PRUMO / OPERAÇÃO COMPROVADA</span></div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-top"><BrandName light /><span>Serviço bem feito. Prova bem guardada.</span><a href="#inicio">Voltar ao início <ArrowUpRight size={13} /></a></div>
        <div className="footer-bottom"><span>© 2026 Prumo Tecnologia</span><span>Feito para quem faz acontecer.</span><div><a href="#plataforma">Plataforma</a><a href="#recursos">Recursos</a><a href="#sua-marca">Sua marca</a></div></div>
      </footer>

      {notice && <div className={`toast ${notice.ok ? 'toast-success' : 'toast-info'}`} role="status"><span>{notice.ok ? <Check size={15} /> : <Sparkles size={14} />}</span>{notice.message}<button onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={14} /></button></div>}
    </div>
  )
}

export default App
