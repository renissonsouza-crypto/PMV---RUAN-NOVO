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

  async function updateEnrollment(id: string, status: string) {
    try {
      await authorizedJson(`/api/admin/enrollments/${id}`, 'PATCH', token, { status })
      await load('enrollments')
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Falha ao atualizar inscrição.') }
  }

  async function openDocument(id: string) {
    try {
      const response = await fetch(`/api/admin/enrollments/${id}/rg`, { headers: { Authorization: `Bearer ${token}` } })
      if (!response.ok) { const result = await response.json().catch(() => ({})); throw new Error(result.message || 'Documento não encontrado.') }
      const url = URL.createObjectURL(await response.blob())
      window.open(url, '_blank', 'noopener,noreferrer')
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Falha ao abrir RG.') }
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
    <section style={styles.tableBox}><h2>{labels[section]}</h2>{rows.length === 0 ? <p style={styles.muted}>Nenhum registro encontrado.</p> : section === 'enrollments' ? <div style={styles.enrollmentGrid}>{rows.map(row => { const classData=row.class as {name?:string;course?:{name?:string}}|undefined; return <article key={String(row.id)} style={styles.enrollmentCard}><div style={styles.enrollmentHeader}><div><small style={styles.muted}>{classData?.course?.name || 'Curso'}</small><h3 style={{margin:'4px 0'}}>{String(row.name || '')}</h3><span style={styles.status}>{String(row.status || '')}</span></div><select aria-label={`Situação da inscrição de ${String(row.name || '')}`} value={String(row.status || '')} onChange={event=>void updateEnrollment(String(row.id),event.target.value)} style={styles.input}><option value="PENDING">Pendente</option><option value="APPROVED">Aprovada</option><option value="WAITLIST">Lista de espera</option><option value="CANCELLED">Cancelada</option><option value="COMPLETED">Concluída</option></select></div><div style={styles.details}><span><b>E-mail:</b> {String(row.email || '')}</span><span><b>Telefone:</b> {String(row.phone || '')}</span><span><b>CPF:</b> {String(row.cpf || '')}</span><span><b>Vínculo:</b> {row.eligibilityType === 'RESIDENT' ? 'Residente' : 'Trabalha em Vitória'}</span><span><b>CEP:</b> {String(row.cep || '')}</span><span><b>Logradouro:</b> {String(row.street || '')}</span><span><b>Bairro:</b> {String(row.district || '')}</span><span><b>Município/UF:</b> {String(row.municipality || '')}/{String(row.state || '')}</span><span><b>Região:</b> {String(row.region || '')}</span><span><b>CNPJ:</b> {String(row.cnpj || 'Não se aplica')}</span><span><b>Raça:</b> {String(row.race || '')}</span><span><b>Nascimento:</b> {row.birthDate ? new Date(String(row.birthDate)).toLocaleDateString('pt-BR',{timeZone:'UTC'}) : ''}</span><span><b>Gênero:</b> {String(row.gender || '')}</span><span><b>Escolaridade:</b> {String(row.education || '')}</span><span><b>Deficiência:</b> {String(row.disability || 'Não informada')}</span><span><b>Acessibilidade:</b> {String(row.accessibilityNeeds || 'Não informada')}</span><span><b>Acompanhante:</b> {String(row.companionNeeds || 'Não informado')}</span><span><b>LGPD:</b> {row.lgpdAcceptedAt ? 'Aceito' : 'Não aceito'}</span><span><b>Compromisso:</b> {row.commitmentAcceptedAt ? `Aceito (${String(row.termsVersion || '')})` : 'Não aceito'}</span><span><b>Turma:</b> {classData?.name || ''}</span><span><b>Inscrição:</b> {row.createdAt ? new Date(String(row.createdAt)).toLocaleString('pt-BR') : ''}</span></div><button type="button" onClick={()=>void openDocument(String(row.id))} style={styles.secondary}>Visualizar RG protegido</button></article> })}</div> : <div style={{ overflowX: 'auto' }}><table style={styles.table}><thead><tr>{Object.keys(rows[0]).filter(key => !['passwordHash'].includes(key)).slice(0, 8).map(key => <th style={styles.cell} key={key}>{key}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={String(row.id || index)}>{Object.entries(row).filter(([key]) => key !== 'passwordHash').slice(0, 8).map(([key, value]) => <td style={styles.cell} key={key}>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}</td>)}</tr>)}</tbody></table></div>}</section>
  </div></main>
}

const styles: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', background: '#F5F7FA', color: '#0F172A', padding: 24, fontFamily: "'Atkinson Hyperlegible', sans-serif", fontSize: 17 }, shell: { maxWidth: 1280, margin: '0 auto' },
  login: { maxWidth: 400, margin: '12vh auto', padding: 32, background: '#FFFFFF', border: '1px solid #E2E7EE', borderRadius: 18, display: 'grid', gap: 14, boxShadow: '0 12px 40px rgba(15,23,42,0.08)' },
  input: { padding: 12, borderRadius: 9, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontSize: 16, minHeight: 44 }, primary: { padding: 12, border: 0, borderRadius: 9, background: '#FF6B57', color: '#fff', fontWeight: 700, cursor: 'pointer', minHeight: 44 },
  secondary: { padding: '10px 16px', borderRadius: 8, background: '#FFFFFF', color: '#0F172A', border: '1.5px solid #CBD5E1', cursor: 'pointer', fontWeight: 600 }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, margin: '28px 0' }, card: { background: '#FFFFFF', border: '1px solid #E2E7EE', padding: 18, borderRadius: 12 }, number: { display: 'block', fontSize: 28, marginTop: 8, color: '#0A5E66', fontWeight: 800 }, muted: { color: '#64748B' },
  nav: { display: 'flex', flexWrap: 'wrap', gap: 8 }, tab: { padding: '10px 15px', borderRadius: 8, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#334155', cursor: 'pointer', fontWeight: 600 }, activeTab: { padding: '10px 15px', borderRadius: 8, border: '1.5px solid #FF6B57', background: '#FF6B57', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  tableBox: { background: '#FFFFFF', border: '1px solid #E2E7EE', borderRadius: 14, padding: 20, marginTop: 16 }, table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 }, cell: { padding: 10, borderBottom: '1px solid #E4E9F0', textAlign: 'left', maxWidth: 260 }, error: { color: '#B91C1C', fontWeight: 600 }, link: { color: '#0A5E66', textAlign: 'center', fontWeight: 700 },
  enrollmentGrid: { display: 'grid', gap: 14 }, enrollmentHeader: { display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, alignItems: 'center' }, enrollmentCard: { padding: 18, borderRadius: 12, border: '1px solid #E2E7EE', background: '#F5F7FA', display: 'grid', gap: 15 }, details: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '9px 18px', fontSize: 14, color: '#334155' }, status: { display: 'inline-block', padding: '4px 10px', borderRadius: 99, background: '#FFE8E3', color: '#E14B38', fontSize: 13, fontWeight: 700 },
}
