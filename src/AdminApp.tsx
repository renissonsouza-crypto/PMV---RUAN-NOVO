import { useEffect, useState } from 'react'
import { authorizedJson, postJson } from './api'

type Dashboard = Record<'users' | 'courses' | 'classes' | 'enrollments' | 'suggestions' | 'evaluations', number> & { averageRating: number }
type Section = 'enrollments' | 'courses' | 'classes' | 'users' | 'suggestions' | 'evaluations'

const labels: Record<Section, string> = { enrollments: 'Inscrições', courses: 'Cursos', classes: 'Turmas', users: 'Usuários', suggestions: 'Sugestões', evaluations: 'Avaliações' }

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('admin-token') || '')
  const [email, setEmail] = useState('admin@qualificavix.local')
  const [password, setPassword] = useState('')
  const [dashboard, setDashboard] = useState<Dashboard | null>(null)
  const [section, setSection] = useState<Section>('enrollments')
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [error, setError] = useState('')

  async function load(currentSection = section) {
    try {
      const [summary, list] = await Promise.all([
        authorizedJson<Dashboard>('/api/admin/dashboard', 'GET', token),
        authorizedJson<Record<string, Record<string, unknown>[]>>(`/api/admin/${currentSection}`, 'GET', token),
      ])
      setDashboard(summary)
      setRows(list[currentSection] || [])
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Falha ao carregar painel.')
    }
  }

  useEffect(() => { if (token) void load() }, [token, section])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    try {
      const result = await postJson<{ token: string; user: { role: string } }>('/api/auth/login', { email, password })
      if (result.user.role !== 'ADMIN') throw new Error('Este usuário não é administrador.')
      sessionStorage.setItem('admin-token', result.token)
      setToken(result.token)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Falha no acesso.') }
  }

  if (!token) return (
    <main style={styles.page}><form onSubmit={login} style={styles.login}>
      <h1 style={{ marginTop: 0 }}>QualificaVix Admin</h1><p style={styles.muted}>Entre para gerenciar o programa.</p>
      <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail" required />
      <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Senha" required />
      <button style={styles.primary}>Entrar</button>{error && <p style={styles.error}>{error}</p>}
      <a href="/" style={styles.link}>Voltar ao site</a>
    </form></main>
  )

  return <main style={styles.page}><div style={styles.shell}>
    <header style={styles.header}><div><h1 style={{ margin: 0 }}>Painel administrativo</h1><p style={styles.muted}>Gestão do QualificaVix</p></div><button style={styles.secondary} onClick={() => { sessionStorage.removeItem('admin-token'); setToken('') }}>Sair</button></header>
    {dashboard && <section style={styles.cards}>{Object.entries(labels).map(([key, label]) => <article key={key} style={styles.card}><small style={styles.muted}>{label}</small><strong style={styles.number}>{dashboard[key as keyof Dashboard]}</strong></article>)}</section>}
    <nav style={styles.nav}>{(Object.keys(labels) as Section[]).map(item => <button key={item} style={item === section ? styles.activeTab : styles.tab} onClick={() => setSection(item)}>{labels[item]}</button>)}</nav>
    {error && <p style={styles.error}>{error}</p>}
    <section style={styles.tableBox}><h2>{labels[section]}</h2>{rows.length === 0 ? <p style={styles.muted}>Nenhum registro encontrado.</p> : <div style={{ overflowX: 'auto' }}><table style={styles.table}><thead><tr>{Object.keys(rows[0]).filter(key => !['passwordHash'].includes(key)).slice(0, 8).map(key => <th style={styles.cell} key={key}>{key}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id || index)}>{Object.entries(row).filter(([key]) => key !== 'passwordHash').slice(0, 8).map(([key, value]) => <td style={styles.cell} key={key}>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}</td>)}</tr>)}</tbody></table></div>}</section>
  </div></main>
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#0a0b14', color: '#e2e8f0', padding: 24, fontFamily: 'Outfit, sans-serif' }, shell: { maxWidth: 1280, margin: '0 auto' },
  login: { maxWidth: 400, margin: '12vh auto', padding: 32, background: '#111219', border: '1px solid #ffffff12', borderRadius: 18, display: 'grid', gap: 14 },
  input: { padding: 12, borderRadius: 9, border: '1px solid #ffffff1a', background: '#ffffff08', color: '#fff' }, primary: { padding: 12, border: 0, borderRadius: 9, background: '#f97316', color: '#fff', fontWeight: 700, cursor: 'pointer' },
  secondary: { padding: '9px 16px', borderRadius: 8, background: '#ffffff0d', color: '#ddd', border: '1px solid #ffffff18', cursor: 'pointer' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, margin: '28px 0' }, card: { background: '#111219', border: '1px solid #ffffff10', padding: 18, borderRadius: 12 }, number: { display: 'block', fontSize: 28, marginTop: 8 }, muted: { color: '#7c8aa0' },
  nav: { display: 'flex', flexWrap: 'wrap', gap: 8 }, tab: { padding: '9px 14px', borderRadius: 8, border: 0, background: '#ffffff08', color: '#94a3b8', cursor: 'pointer' }, activeTab: { padding: '9px 14px', borderRadius: 8, border: 0, background: '#f97316', color: '#fff', cursor: 'pointer' },
  tableBox: { background: '#111219', border: '1px solid #ffffff10', borderRadius: 14, padding: 20, marginTop: 16 }, table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 }, cell: { padding: 10, borderBottom: '1px solid #ffffff0d', textAlign: 'left', maxWidth: 260 }, error: { color: '#f87171' }, link: { color: '#60a5fa', textAlign: 'center' },
}
