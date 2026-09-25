import { useEffect, useState } from 'react'
import { getJson, postJson, ApiRequestError } from './api'

type Module = { id: string; title: string; description: string; workload: number; position: number }
type Session = { id: string; title: string; startsAt: string; endsAt: string; location?: string }
type Enrollment = { id: string; status: string; createdAt: string; certificate?: { code: string; issuedAt: string; fileUrl?: string }; class: { name: string; period: string; location?: string; sessions?: Session[]; course: { name: string; image: string; duration: string; workload: number; curriculum?: Module[] } } }
type Dashboard = { student: { name: string; email: string; enrollments: Enrollment[] } }
type Tab = 'cursos' | 'calendario' | 'grade' | 'certificados'

const statusText: Record<string, string> = { PENDING: 'Em análise', APPROVED: 'Matriculado', WAITLIST: 'Lista de espera', CANCELLED: 'Cancelado', COMPLETED: 'Concluído' }
// Uma cor por status deixa o card escaneável rapidamente — o mesmo princípio
// de "wayfinding por cor" usado no site público, aplicado aqui à situação
// da matrícula de cada aluno (dado que vem direto do banco).
const statusColor: Record<string, { bg: string; fg: string }> = {
  PENDING: { bg: '#FEF3C7', fg: '#A15C04' },
  APPROVED: { bg: '#DCFCE7', fg: '#0F7A38' },
  WAITLIST: { bg: '#E0F2FE', fg: '#0A5E66' },
  CANCELLED: { bg: '#FEE2E2', fg: '#B91C1C' },
  COMPLETED: { bg: '#F3E8FF', fg: '#7C3AED' },
}
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value))

export default function StudentApp() {
  const [token, setToken] = useState(() => localStorage.getItem('student-token') || '')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [tab, setTab] = useState<Tab>('cursos')
  const [loadError, setLoadError] = useState('')
  // ?mode=register abre a aba de criação de conta direto — é para onde o
  // botão "Inscreva-se Grátis" do site aponta, mantendo a navegação pelos
  // cursos (página inicial) totalmente livre de login.
  const [registering, setRegistering] = useState(() => new URLSearchParams(window.location.search).get('mode') === 'register')
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  const loadDashboard = (authToken: string) => {
    setLoadError('')
    getJson<Dashboard>('/api/student/dashboard', authToken)
      .then(setDashboard)
      .catch(err => {
        // Token expirado/inválido: volta para o login. Qualquer outro erro
        // (rede, servidor fora do ar) mantém a sessão e mostra um retry.
        const status = err instanceof ApiRequestError ? err.status : 0
        if (status === 401 || status === 403) {
          localStorage.removeItem('student-token'); setToken(''); setDashboard(null)
        } else {
          setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar seus dados agora.')
        }
      })
  }

  useEffect(() => { if (token) loadDashboard(token) }, [token])

  const access = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSubmitting(true)
    try {
      const path = registering ? '/api/auth/register' : '/api/auth/login'
      const result = await postJson<{ token: string }>(path, registering ? form : { email: form.email, password: form.password })
      localStorage.setItem('student-token', result.token); setToken(result.token)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível entrar.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) return <main style={s.page}><form onSubmit={access} style={s.login}>
    <a href="/" style={s.back}>← Voltar ao QualificaVix</a>
    <h1 style={{ marginBottom: 4 }}>{registering ? 'Criar minha conta' : 'Área do estudante'}</h1>
    <p style={s.muted}>{registering ? 'Leva menos de um minuto — e não é obrigatório para conhecer os cursos.' : 'Acompanhe sua jornada de aprendizagem.'}</p>
    {registering && <input style={s.input} placeholder="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />}
    <input style={s.input} type="email" placeholder="E-mail usado na inscrição" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
    <input style={s.input} type="password" placeholder="Senha (mínimo 8 caracteres)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
    <button style={{ ...s.primary, opacity: submitting ? 0.6 : 1 }} disabled={submitting}>{submitting ? 'Enviando…' : registering ? 'Criar minha conta' : 'Entrar'}</button>
    {error && <p role="alert" style={s.error}>{error}</p>}
    <button type="button" style={s.linkButton} onClick={() => { setRegistering(!registering); setError('') }}>{registering ? 'Já tenho conta' : 'Primeiro acesso? Criar conta'}</button>
    <div style={{ borderTop: '1px solid #E2E7EE', paddingTop: 14, marginTop: 4, textAlign: 'center' }}>
      <span style={s.muted}>Só quer dar uma olhada? </span>
      <a href="/#cursos" style={{ color: '#0A5E66', fontWeight: 700 }}>Ver cursos sem criar conta →</a>
    </div>
  </form></main>

  if (loadError) return <main style={s.page}><div style={{ ...s.empty, maxWidth: 480, margin: '15vh auto' }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
    <h2 style={{ margin: '0 0 8px' }}>Não foi possível carregar sua área</h2>
    <p style={s.muted}>{loadError}</p>
    <button style={{ ...s.primary, marginTop: 16 }} onClick={() => loadDashboard(token)}>Tentar novamente</button>
  </div></main>

  if (!dashboard) return <main style={s.page}><p style={{ textAlign: 'center', marginTop: '20vh' }}>Carregando sua área…</p></main>

  const enrollments = dashboard.student.enrollments ?? []
  const sessions = enrollments
    .flatMap(item => (item.class.sessions ?? []).map(session => ({ ...session, course: item.class.course.name })))
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))

  return <main style={s.page}><div style={s.shell}>
    <header style={s.header}><div><a href="/" style={s.back}>Qualifica<span style={{ color: '#FF6B57' }}>Vix</span></a><h1 style={{ margin: '12px 0 4px' }}>Olá, {dashboard.student.name.split(' ')[0]}</h1><p style={s.muted}>Aqui está o seu percurso formativo.</p></div><button style={s.secondary} onClick={() => { localStorage.removeItem('student-token'); setToken(''); setDashboard(null) }}>Sair</button></header>
    <nav style={s.nav}>{([['cursos','Meus cursos'],['calendario','Calendário'],['grade','Grade curricular'],['certificados','Certificados']] as [Tab,string][]).map(([key,label]) => <button key={key} onClick={() => setTab(key)} style={tab === key ? s.activeTab : s.tab}>{label}</button>)}</nav>
    {enrollments.length === 0 && <section style={s.empty}><h2>Nenhuma inscrição vinculada</h2><p style={s.muted}>Faça uma inscrição usando o e-mail {dashboard.student.email} para acompanhá-la aqui.</p><a href="/#cursos" style={s.primaryLink}>Conhecer cursos</a></section>}
    {tab === 'cursos' && enrollments.map(item => {
      const badge = statusColor[item.status] || { bg: '#E4E9F0', fg: '#334155' }
      return <article key={item.id} style={s.course}><img src={item.class.course.image} alt="" style={s.courseImage}/><div><span style={{ ...s.badge, background: badge.bg, color: badge.fg }}>{statusText[item.status] || item.status}</span><h2>{item.class.course.name}</h2><p style={s.muted}>{item.class.name} · {item.class.location || 'Local a confirmar'}</p><p>{item.class.course.workload} horas · {item.class.course.duration}</p></div></article>
    })}
    {tab === 'calendario' && <section style={s.panel}><h2>Calendário de aulas</h2>{sessions.length ? sessions.map(item => <div key={item.id} style={s.row}><div style={s.dateBox}>{new Date(item.startsAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</div><div><strong>{item.course}</strong><div>{item.title}</div><small style={s.muted}>{date(item.startsAt)} · {item.location || 'Local a confirmar'}</small></div></div>) : <p style={s.muted}>O calendário será publicado após a confirmação da turma.</p>}</section>}
    {tab === 'grade' && enrollments.map(item => <section key={item.id} style={s.panel}><h2>{item.class.course.name}</h2>{(item.class.course.curriculum ?? []).length ? item.class.course.curriculum!.map(module => <div key={module.id} style={s.row}><div style={s.number}>{module.position}</div><div><strong>{module.title}</strong><p style={{ margin: '5px 0', color: '#334155' }}>{module.description}</p><small style={s.muted}>{module.workload} horas</small></div></div>) : <p style={s.muted}>A grade curricular ainda não foi publicada para esta turma.</p>}</section>)}
    {tab === 'certificados' && <section style={s.panel}><h2>Meus certificados</h2>{enrollments.some(item => item.certificate) ? enrollments.filter(item => item.certificate).map(item => <div key={item.id} style={s.certificate}><div><strong>{item.class.course.name}</strong><p style={s.muted}>Código: {item.certificate?.code}</p></div><button style={s.secondary}>Visualizar certificado</button></div>) : <div style={s.empty}><div style={{ fontSize: 48 }}>🎓</div><h3>Seus certificados aparecerão aqui</h3><p style={s.muted}>Ao concluir um curso, o certificado será disponibilizado nesta aba.</p></div>}</section>}
  </div></main>
}

const s: Record<string, React.CSSProperties> = {
  page:{minHeight:'100vh',background:'#F5F7FA',color:'#0F172A',padding:24,fontFamily:"'Atkinson Hyperlegible', sans-serif",fontSize:18},shell:{maxWidth:1100,margin:'0 auto'},login:{maxWidth:420,margin:'10vh auto',padding:32,background:'#FFFFFF',border:'1px solid #E2E7EE',borderRadius:20,display:'grid',gap:14,boxShadow:'0 12px 40px rgba(15,23,42,0.08)'},input:{padding:13,borderRadius:9,border:'1.5px solid #CBD5E1',background:'#FFFFFF',color:'#0F172A',fontSize:17,minHeight:46},primary:{padding:13,border:0,borderRadius:9,background:'#0A5E66',color:'#fff',fontWeight:700,cursor:'pointer',fontSize:17,minHeight:46},secondary:{padding:'10px 16px',borderRadius:8,border:'1.5px solid #CBD5E1',background:'#FFFFFF',color:'#0F172A',cursor:'pointer',fontWeight:600},linkButton:{border:0,background:'none',color:'#0A5E66',cursor:'pointer',fontWeight:700,textDecoration:'underline'},back:{color:'#0F172A',textDecoration:'none',fontWeight:700},muted:{color:'#64748B'},error:{color:'#B91C1C',fontWeight:600},header:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28},nav:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20},tab:{padding:'11px 18px',border:'1.5px solid #CBD5E1',borderRadius:9,background:'#FFFFFF',color:'#334155',cursor:'pointer',fontWeight:600,minHeight:44},activeTab:{padding:'11px 18px',border:'1.5px solid #0A5E66',borderRadius:9,background:'#0A5E66',color:'#fff',cursor:'pointer',fontWeight:700,minHeight:44},panel:{background:'#FFFFFF',border:'1px solid #E2E7EE',borderRadius:16,padding:24,marginBottom:16},course:{display:'grid',gridTemplateColumns:'180px 1fr',gap:22,background:'#FFFFFF',border:'1px solid #E2E7EE',borderRadius:16,padding:16,marginBottom:14},courseImage:{width:'100%',height:130,objectFit:'cover',borderRadius:11},badge:{display:'inline-block',padding:'4px 10px',borderRadius:20,background:'#E0F2FE',color:'#0A5E66',fontSize:14,fontWeight:700},row:{display:'flex',gap:16,padding:'16px 0',borderBottom:'1px solid #E4E9F0'},dateBox:{minWidth:64,textAlign:'center',padding:10,borderRadius:10,background:'#E0F2FE',color:'#0A5E66',fontWeight:800},number:{width:38,height:38,borderRadius:19,display:'grid',placeItems:'center',background:'#0A5E66',color:'#fff',fontWeight:800},empty:{textAlign:'center',padding:40,background:'#FFFFFF',border:'1px solid #E2E7EE',borderRadius:16},primaryLink:{display:'inline-block',marginTop:12,padding:'12px 20px',borderRadius:9,background:'#0A5E66',color:'#fff',textDecoration:'none',fontWeight:700},certificate:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:18,border:'1px solid #E2E7EE',borderRadius:12,background:'#FFFFFF'},
}
