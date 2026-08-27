import { useEffect, useState } from 'react'
import { getJson, postJson } from './api'

type Module = { id: string; title: string; description: string; workload: number; position: number }
type Session = { id: string; title: string; startsAt: string; endsAt: string; location?: string }
type Enrollment = { id: string; status: string; createdAt: string; certificate?: { code: string; issuedAt: string; fileUrl?: string }; class: { name: string; period: string; location?: string; sessions: Session[]; course: { name: string; image: string; duration: string; workload: number; curriculum: Module[] } } }
type Dashboard = { student: { name: string; email: string; enrollments: Enrollment[] } }
type Tab = 'cursos' | 'calendario' | 'grade' | 'certificados'

const statusText: Record<string, string> = { PENDING: 'Em análise', APPROVED: 'Matriculado', WAITLIST: 'Lista de espera', CANCELLED: 'Cancelado', COMPLETED: 'Concluído' }
const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(value))

export default function StudentApp() {
  const [token, setToken] = useState(() => localStorage.getItem('student-token') || '')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [tab, setTab] = useState<Tab>('cursos')
  const [registering, setRegistering] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')

  useEffect(() => { if (token) getJson<Dashboard>('/api/student/dashboard', token).then(setDashboard).catch(err => { setError(err.message); localStorage.removeItem('student-token'); setToken('') }) }, [token])
  const access = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    try {
      const path = registering ? '/api/auth/register' : '/api/auth/login'
      const result = await postJson<{ token: string }>(path, registering ? form : { email: form.email, password: form.password })
      localStorage.setItem('student-token', result.token); setToken(result.token)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível entrar.') }
  }

  if (!token) return <main style={s.page}><form onSubmit={access} style={s.login}>
    <a href="/" style={s.back}>← Voltar ao QualificaVix</a><h1 style={{ marginBottom: 4 }}>Área do estudante</h1><p style={s.muted}>Acompanhe sua jornada de aprendizagem.</p>
    {registering && <input style={s.input} placeholder="Nome completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />}
    <input style={s.input} type="email" placeholder="E-mail usado na inscrição" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
    <input style={s.input} type="password" placeholder="Senha (mínimo 8 caracteres)" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={8} />
    <button style={s.primary}>{registering ? 'Criar minha conta' : 'Entrar'}</button>{error && <p style={s.error}>{error}</p>}
    <button type="button" style={s.linkButton} onClick={() => { setRegistering(!registering); setError('') }}>{registering ? 'Já tenho conta' : 'Primeiro acesso? Criar conta'}</button>
  </form></main>

  if (!dashboard) return <main style={s.page}><p>Carregando sua área…</p></main>
  const enrollments = dashboard.student.enrollments
  const sessions = enrollments.flatMap(item => item.class.sessions.map(session => ({ ...session, course: item.class.course.name }))).sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  return <main style={s.page}><div style={s.shell}>
    <header style={s.header}><div><a href="/" style={s.back}>Qualifica<span style={{ color: '#3b82f6' }}>Vix</span></a><h1 style={{ margin: '12px 0 4px' }}>Olá, {dashboard.student.name.split(' ')[0]}</h1><p style={s.muted}>Aqui está o seu percurso formativo.</p></div><button style={s.secondary} onClick={() => { localStorage.removeItem('student-token'); setToken('') }}>Sair</button></header>
    <nav style={s.nav}>{([['cursos','Meus cursos'],['calendario','Calendário'],['grade','Grade curricular'],['certificados','Certificados']] as [Tab,string][]).map(([key,label]) => <button key={key} onClick={() => setTab(key)} style={tab === key ? s.activeTab : s.tab}>{label}</button>)}</nav>
    {enrollments.length === 0 && <section style={s.empty}><h2>Nenhuma inscrição vinculada</h2><p style={s.muted}>Faça uma inscrição usando o e-mail {dashboard.student.email} para acompanhá-la aqui.</p><a href="/#cursos" style={s.primaryLink}>Conhecer cursos</a></section>}
    {tab === 'cursos' && enrollments.map(item => <article key={item.id} style={s.course}><img src={item.class.course.image} alt="" style={s.courseImage}/><div><span style={s.badge}>{statusText[item.status] || item.status}</span><h2>{item.class.course.name}</h2><p style={s.muted}>{item.class.name} · {item.class.location || 'Local a confirmar'}</p><p>{item.class.course.workload} horas · {item.class.course.duration}</p></div></article>)}
    {tab === 'calendario' && <section style={s.panel}><h2>Calendário de aulas</h2>{sessions.length ? sessions.map(item => <div key={item.id} style={s.row}><div style={s.dateBox}>{new Date(item.startsAt).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</div><div><strong>{item.course}</strong><div>{item.title}</div><small style={s.muted}>{date(item.startsAt)} · {item.location || 'Local a confirmar'}</small></div></div>) : <p style={s.muted}>O calendário será publicado após a confirmação da turma.</p>}</section>}
    {tab === 'grade' && enrollments.map(item => <section key={item.id} style={s.panel}><h2>{item.class.course.name}</h2>{item.class.course.curriculum.map(module => <div key={module.id} style={s.row}><div style={s.number}>{module.position}</div><div><strong>{module.title}</strong><p style={{ margin: '5px 0', color: '#94a3b8' }}>{module.description}</p><small style={s.muted}>{module.workload} horas</small></div></div>)}</section>)}
    {tab === 'certificados' && <section style={s.panel}><h2>Meus certificados</h2>{enrollments.some(item => item.certificate) ? enrollments.filter(item => item.certificate).map(item => <div key={item.id} style={s.certificate}><div><strong>{item.class.course.name}</strong><p style={s.muted}>Código: {item.certificate?.code}</p></div><button style={s.secondary}>Visualizar certificado</button></div>) : <div style={s.empty}><div style={{ fontSize: 48 }}>🎓</div><h3>Seus certificados aparecerão aqui</h3><p style={s.muted}>Ao concluir um curso, o certificado será disponibilizado nesta aba.</p></div>}</section>}
  </div></main>
}

const s: Record<string, React.CSSProperties> = {
  page:{minHeight:'100vh',background:'linear-gradient(145deg,#071426,#0a0b14)',color:'#e2e8f0',padding:24,fontFamily:'Outfit,sans-serif'},shell:{maxWidth:1100,margin:'0 auto'},login:{maxWidth:420,margin:'10vh auto',padding:32,background:'#111827',border:'1px solid #ffffff18',borderRadius:20,display:'grid',gap:14},input:{padding:13,borderRadius:9,border:'1px solid #ffffff1a',background:'#ffffff08',color:'#fff'},primary:{padding:13,border:0,borderRadius:9,background:'#2563eb',color:'#fff',fontWeight:700,cursor:'pointer'},secondary:{padding:'9px 15px',borderRadius:8,border:'1px solid #ffffff20',background:'#ffffff0b',color:'#fff',cursor:'pointer'},linkButton:{border:0,background:'none',color:'#60a5fa',cursor:'pointer'},back:{color:'#e2e8f0',textDecoration:'none',fontWeight:700},muted:{color:'#8493a8'},error:{color:'#f87171'},header:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:28},nav:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:20},tab:{padding:'10px 16px',border:0,borderRadius:9,background:'#ffffff0a',color:'#94a3b8',cursor:'pointer'},activeTab:{padding:'10px 16px',border:0,borderRadius:9,background:'#2563eb',color:'#fff',cursor:'pointer'},panel:{background:'#111827',border:'1px solid #ffffff12',borderRadius:16,padding:24,marginBottom:16},course:{display:'grid',gridTemplateColumns:'180px 1fr',gap:22,background:'#111827',border:'1px solid #ffffff12',borderRadius:16,padding:16,marginBottom:14},courseImage:{width:'100%',height:130,objectFit:'cover',borderRadius:11},badge:{display:'inline-block',padding:'4px 9px',borderRadius:20,background:'#2563eb22',color:'#60a5fa',fontSize:12,fontWeight:700},row:{display:'flex',gap:16,padding:'16px 0',borderBottom:'1px solid #ffffff0d'},dateBox:{minWidth:64,textAlign:'center',padding:10,borderRadius:10,background:'#2563eb22',color:'#60a5fa',fontWeight:800},number:{width:36,height:36,borderRadius:18,display:'grid',placeItems:'center',background:'#2563eb',fontWeight:800},empty:{textAlign:'center',padding:40,background:'#111827',border:'1px solid #ffffff12',borderRadius:16},primaryLink:{display:'inline-block',marginTop:12,padding:'11px 18px',borderRadius:9,background:'#2563eb',color:'#fff',textDecoration:'none',fontWeight:700},certificate:{display:'flex',justifyContent:'space-between',alignItems:'center',padding:18,border:'1px solid #ffffff12',borderRadius:12},
}
