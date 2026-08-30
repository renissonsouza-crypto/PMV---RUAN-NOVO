import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getJson, postJson } from './api'

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseStatus = 'abertas' | 'ultimas-vagas' | 'breve'
type Periodo = 'Diurno' | 'Vespertino' | 'Noturno'
type IndicadoPara = 'primeiro-emprego' | 'empreender' | 'mudanca-profissao' | 'atualizacao'
type StudentProfile = { id: string; name: string; email: string; role: string; active: boolean }
type EnrollmentProfile = {
  name: string; email: string; phone: string; cpf: string; eligibilityType: string; cep: string; cnpj: string
  race: string; birthDate: string; gender: string; education: string; disability: string
  accessibilityNeeds: string; companionNeeds: string; hasRgDocument: boolean
}

interface Course {
  id: string
  name: string
  area: string
  areaKey: string
  image: string
  videoId: string
  synopse: string
  status: CourseStatus
  duracao: string
  periodo: Periodo
  cargaHoraria: number
  inscritos: number
  vagas: number
  indicadoPara: IndicadoPara[]
  mediaSalarial: string
  chatColor: string
  classes?: { id: string; status: string; capacity: number }[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1920&h=1080&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=1920&h=1080&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1555725305-e823b44548de?w=1920&h=1080&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1758691736067-b309ee3ef7b9?w=1920&h=1080&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1726250873194-e9aefd3667ba?w=1920&h=1080&fit=crop&auto=format',
]

const COURSES: Course[] = [
  {
    id: 'prog-web',
    name: 'Programação Web',
    area: 'Tecnologia',
    areaKey: 'tecnologia',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=480&fit=crop&auto=format',
    videoId: 'UB1O30fR-EE',
    synopse: 'HTML, CSS, JavaScript e React do zero. Projetos práticos e portfólio ao final do curso.',
    status: 'abertas',
    duracao: '4 meses',
    periodo: 'Noturno',
    cargaHoraria: 160,
    inscritos: 1247,
    vagas: 40,
    indicadoPara: ['primeiro-emprego', 'mudanca-profissao'],
    mediaSalarial: 'R$ 3.200 – R$ 6.500',
    chatColor: '#3b82f6',
  },
  {
    id: 'design-grafico',
    name: 'Design Gráfico',
    area: 'Criatividade',
    areaKey: 'criatividade',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=480&fit=crop&auto=format',
    videoId: '_9mTJ84uL1Q',
    synopse: 'Canva, Photoshop e Illustrator para criar identidades visuais e peças para redes sociais.',
    status: 'ultimas-vagas',
    duracao: '3 meses',
    periodo: 'Vespertino',
    cargaHoraria: 120,
    inscritos: 932,
    vagas: 40,
    indicadoPara: ['primeiro-emprego', 'empreender', 'mudanca-profissao'],
    mediaSalarial: 'R$ 2.400 – R$ 5.000',
    chatColor: '#8b5cf6',
  },
  {
    id: 'gestao-empresarial',
    name: 'Gestão Empresarial',
    area: 'Negócios',
    areaKey: 'negocios',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=480&fit=crop&auto=format',
    videoId: 'NU_1StN5Tkk',
    synopse: 'Planejamento estratégico, finanças e liderança para quem quer abrir ou crescer no próprio negócio.',
    status: 'abertas',
    duracao: '5 meses',
    periodo: 'Diurno',
    cargaHoraria: 200,
    inscritos: 789,
    vagas: 35,
    indicadoPara: ['empreender', 'atualizacao'],
    mediaSalarial: 'R$ 4.000 – R$ 9.000',
    chatColor: '#f97316',
  },
  {
    id: 'gastronomia',
    name: 'Gastronomia e Culinária',
    area: 'Gastronomia',
    areaKey: 'gastronomia',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=480&fit=crop&auto=format',
    videoId: 'pCZSZZTNuc4',
    synopse: 'Da técnica básica à alta culinária com chefs experientes. Higiene alimentar e gestão de cozinha.',
    status: 'breve',
    duracao: '3 meses',
    periodo: 'Diurno',
    cargaHoraria: 120,
    inscritos: 1103,
    vagas: 30,
    indicadoPara: ['primeiro-emprego', 'empreender'],
    mediaSalarial: 'R$ 2.000 – R$ 4.500',
    chatColor: '#f59e0b',
  },
  {
    id: 'eletricista',
    name: 'Eletricista Predial',
    area: 'Construção Civil',
    areaKey: 'construcao',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=480&fit=crop&auto=format',
    videoId: 'NeQY0lrXMH8',
    synopse: 'Instalações elétricas conforme ABNT. Segurança elétrica e práticas completas em laboratório.',
    status: 'abertas',
    duracao: '2 meses',
    periodo: 'Noturno',
    cargaHoraria: 80,
    inscritos: 654,
    vagas: 25,
    indicadoPara: ['primeiro-emprego', 'mudanca-profissao'],
    mediaSalarial: 'R$ 2.800 – R$ 5.500',
    chatColor: '#f59e0b',
  },
  {
    id: 'marketing-digital',
    name: 'Marketing Digital',
    area: 'Marketing',
    areaKey: 'marketing',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=480&fit=crop&auto=format',
    videoId: 'nU-IIXBWlS4',
    synopse: 'Google Ads, SEO, redes sociais e métricas. Aprenda a alavancar negócios no ambiente digital.',
    status: 'ultimas-vagas',
    duracao: '3 meses',
    periodo: 'Vespertino',
    cargaHoraria: 120,
    inscritos: 1456,
    vagas: 40,
    indicadoPara: ['empreender', 'atualizacao', 'mudanca-profissao'],
    mediaSalarial: 'R$ 2.800 – R$ 6.000',
    chatColor: '#3b82f6',
  },
  {
    id: 'assistente-adm',
    name: 'Assistente Administrativo',
    area: 'Administração',
    areaKey: 'negocios',
    image: 'https://images.unsplash.com/photo-1555725305-e823b44548de?w=800&h=480&fit=crop&auto=format',
    videoId: 'OvKCESe3VlM',
    synopse: 'Excel avançado, rotinas administrativas, documentos e comunicação corporativa.',
    status: 'abertas',
    duracao: '2 meses',
    periodo: 'Diurno',
    cargaHoraria: 80,
    inscritos: 2108,
    vagas: 50,
    indicadoPara: ['primeiro-emprego', 'atualizacao'],
    mediaSalarial: 'R$ 1.800 – R$ 3.200',
    chatColor: '#3b82f6',
  },
  {
    id: 'costura-moda',
    name: 'Costura e Moda',
    area: 'Moda',
    areaKey: 'moda',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=480&fit=crop&auto=format',
    videoId: 'xq_sYLHMGHY',
    synopse: 'Modelagem, montagem de peças e criação de coleções. Como montar seu próprio ateliê.',
    status: 'breve',
    duracao: '4 meses',
    periodo: 'Vespertino',
    cargaHoraria: 160,
    inscritos: 543,
    vagas: 20,
    indicadoPara: ['primeiro-emprego', 'empreender', 'mudanca-profissao'],
    mediaSalarial: 'R$ 1.800 – R$ 3.800',
    chatColor: '#f43f5e',
  },
]

const CoursesContext = createContext<Course[]>(COURSES)
const useCourses = () => useContext(CoursesContext)

const TESTIMONIALS = [
  {
    name: 'Fernanda Oliveira',
    course: 'Marketing Digital',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop&auto=format',
    text: 'Depois do curso, consegui meu primeiro emprego como analista de mídias sociais em três semanas. A qualidade é incrível para um curso totalmente gratuito!',
    occupation: 'Analista de Mídias Sociais',
    salary: 'R$ 2.800/mês',
    neighborhood: 'Jardim Camburi',
  },
  {
    name: 'Carlos Mendes',
    course: 'Eletricista Predial',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format',
    text: 'Hoje tenho minha própria empresa de instalações elétricas com 3 funcionários. O QualificaVix me deu a base técnica e a coragem para empreender.',
    occupation: 'Proprietário — Mendes Elétrica',
    salary: 'R$ 8.000/mês',
    neighborhood: 'Goiabeiras',
  },
  {
    name: 'Beatriz Santos',
    course: 'Gastronomia e Culinária',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&h=120&fit=crop&auto=format',
    text: 'Era dona de casa e queria independência financeira. Hoje trabalho como chef em um restaurante renomado. O QualificaVix mudou completamente a minha vida!',
    occupation: 'Chef de Cozinha — Restaurante Mar e Sol',
    salary: 'R$ 3.500/mês',
    neighborhood: 'Praia do Canto',
  },
  {
    name: 'Rafael Almeida',
    course: 'Programação Web',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop&auto=format',
    text: 'Trabalhava como motoboy e sonhava com algo diferente. Em 5 meses após o curso recebi minha primeira proposta como desenvolvedor júnior. Não desistam!',
    occupation: 'Desenvolvedor Frontend Jr. — TechVix',
    salary: 'R$ 4.200/mês',
    neighborhood: 'Santo Antônio',
  },
]

const STATUS_CONFIG: Record<CourseStatus, { label: string; color: string; bg: string }> = {
  abertas: { label: 'Inscrições Abertas', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  'ultimas-vagas': { label: 'Últimas Vagas!', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  breve: { label: 'Início em Breve', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
}

const INDICADO_LABELS: Record<IndicadoPara, string> = {
  'primeiro-emprego': '🎯 Primeiro Emprego',
  empreender: '💼 Empreender',
  'mudanca-profissao': '🔄 Mudança de Profissão',
  atualizacao: '📈 Atualização',
}

const PERIODO_ICONS: Record<Periodo, string> = {
  Diurno: '☀️',
  Vespertino: '🌤️',
  Noturno: '🌙',
}

const AREA_IDS: Record<string, string[]> = {
  tecnologia: ['prog-web'],
  criatividade: ['design-grafico'],
  negocios: ['gestao-empresarial', 'assistente-adm'],
  gastronomia: ['gastronomia'],
  construcao: ['eletricista'],
  marketing: ['marketing-digital'],
  moda: ['costura-moda'],
}

// ─── Chatbot ──────────────────────────────────────────────────────────────────

type ChatStep = 'objetivo' | 'area' | 'periodo' | 'result'

interface ChatState {
  step: ChatStep
  objetivo: string
  area: string
  periodo: string
  results: Course[]
  theme: string
}

const CHATBOT_STEPS: Record<ChatStep, { question: string; options: { label: string; value: string }[] }> = {
  objetivo: {
    question: 'Olá! Vou te ajudar a encontrar o curso ideal 🎓\n\nO que você está buscando?',
    options: [
      { label: '🎯 Primeiro Emprego', value: 'primeiro-emprego' },
      { label: '💼 Quero Empreender', value: 'empreender' },
      { label: '🔄 Mudança de Profissão', value: 'mudanca-profissao' },
      { label: '📈 Atualização Profissional', value: 'atualizacao' },
    ],
  },
  area: {
    question: 'Que área te desperta mais interesse?',
    options: [
      { label: '💻 Tecnologia e Web', value: 'tecnologia' },
      { label: '🎨 Criatividade e Design', value: 'criatividade' },
      { label: '📊 Negócios e Administração', value: 'negocios' },
      { label: '🍽️ Gastronomia', value: 'gastronomia' },
      { label: '⚡ Construção e Elétrica', value: 'construcao' },
      { label: '📣 Marketing Digital', value: 'marketing' },
      { label: '👗 Moda e Costura', value: 'moda' },
    ],
  },
  periodo: {
    question: 'Qual período é mais conveniente para você?',
    options: [
      { label: '☀️ Diurno — manhã', value: 'Diurno' },
      { label: '🌤️ Vespertino — tarde', value: 'Vespertino' },
      { label: '🌙 Noturno — noite', value: 'Noturno' },
      { label: '🔀 Qualquer período', value: 'qualquer' },
    ],
  },
  result: {
    question: '',
    options: [],
  },
}

const AREA_THEMES: Record<string, string> = {
  tecnologia: '#3b82f6',
  criatividade: '#8b5cf6',
  negocios: '#f97316',
  gastronomia: '#f59e0b',
  construcao: '#f59e0b',
  marketing: '#06b6d4',
  moda: '#f43f5e',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PrefeituraLogo() {
  return (
    <a href="https://www.vitoria.es.gov.br/" target="_blank" rel="noreferrer" aria-label="Acessar o portal da Prefeitura de Vitória" style={{ display: 'block', lineHeight: 0 }}>
      <img src="/assets/brasao-vitoria-header.png" alt="Prefeitura de Vitória" style={{ display: 'block', width: 180, height: 52, objectFit: 'contain' }} />
    </a>
  )
}

const COURSE_DEMO_VIDEOS: Record<string, string> = {
  'prog-web': '/assets/videos/programacao-web.mp4',
  'design-grafico': '/assets/videos/design-grafico.mp4',
  'gestao-empresarial': '/assets/videos/gestao-empresarial.mp4',
  gastronomia: '/assets/videos/gastronomia.mp4',
  eletricista: '/assets/videos/eletricista.mp4',
  'marketing-digital': '/assets/videos/marketing-digital.mp4',
  'assistente-adm': '/assets/videos/assistente-administrativo.mp4',
  'costura-moda': '/assets/videos/costura-moda.mp4',
}

function StatusBadge({ status }: { status: CourseStatus }) {
  const cfg = STATUS_CONFIG[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 999,
      backgroundColor: cfg.bg, color: cfg.color,
      fontSize: 11, fontWeight: 600, letterSpacing: '0.03em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function VideoModal({ course, onClose }: { course: Course; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-slide-in"
        style={{
          width: '100%', maxWidth: 800,
          background: '#111219',
          borderRadius: 20,
          border: `1px solid ${course.chatColor}30`,
          overflow: 'hidden',
          boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${course.chatColor}20`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div>
            <div style={{ fontSize: 11, color: course.chatColor, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Apresentação do Curso
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>{course.name}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8,
              width: 32, height: 32, color: '#64748b', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b' }}
          >
            ✕
          </button>
        </div>

        {/* Vídeo demonstrativo local */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
          <video
            src={COURSE_DEMO_VIDEOS[course.id]}
            poster={course.image}
            aria-label={`Vídeo demonstrativo do curso ${course.name}`}
            controls autoPlay playsInline
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none',
            }}
          >Seu navegador não oferece suporte à reprodução de vídeos.</video>
        </div>

        {/* Quick stats strip */}
        <div style={{
          display: 'flex', padding: '12px 20px', gap: 24,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Duração', value: course.duracao },
            { label: 'Carga', value: `${course.cargaHoraria}h` },
            { label: 'Período', value: course.periodo },
            { label: 'Salário médio', value: course.mediaSalarial, accent: true },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: s.accent ? course.chatColor : '#e2e8f0', marginTop: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function EnrollmentModal({ course, onClose, student, profile, token }: { course: Course; onClose: () => void; student: StudentProfile | null; profile: EnrollmentProfile | null; token: string }) {
  const targetClass = course.classes?.find(item => item.status === 'OPEN')
  const hasReusableEnrollment = Boolean(profile?.phone && profile?.cpf && profile?.eligibilityType && profile?.race && profile?.birthDate && profile?.gender && profile?.education && profile?.hasRgDocument && (profile.eligibilityType === 'WORKER' || profile?.cep))
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: profile?.name || student?.name || '', email: profile?.email || student?.email || '', phone: profile?.phone || '', eligibilityType: profile?.eligibilityType || 'RESIDENT', cpf: profile?.cpf || '', cep: profile?.cep || '', cnpj: profile?.cnpj || '', race: profile?.race || '', birthDate: profile?.birthDate || '', gender: profile?.gender || '', education: profile?.education || '', disability: profile?.disability || '', accessibilityNeeds: profile?.accessibilityNeeds || '', companionNeeds: profile?.companionNeeds || '', lgpdAccepted: false, commitmentAccepted: false })
  const [rgDocument, setRgDocument] = useState<File | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [cepResult, setCepResult] = useState<{ address: { cep: string; street: string; complement: string; neighborhood: string; city: string; state: string; stateName: string; region: string; ibge: string; ddd: string }; eligible: boolean; message: string } | null>(null)
  const [cepError, setCepError] = useState('')
  useEffect(() => {
    if (form.eligibilityType !== 'RESIDENT') { setCepResult(null); setCepError(''); return }
    const cep = form.cep.replace(/\D/g, '')
    setCepResult(null); setCepError('')
    if (cep.length !== 8) return
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setCepLoading(true)
      try {
        const response = await fetch(`/api/address/cep/${cep}`, { signal: controller.signal })
        const result = await response.json()
        if (!response.ok) throw new Error(result.message || 'Não foi possível consultar o CEP.')
        setCepResult(result)
        if (!result.eligible) setCepError(result.message)
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === 'AbortError') return
        setCepError(requestError instanceof Error ? requestError.message : 'Não foi possível consultar o CEP.')
      } finally { if (!controller.signal.aborted) setCepLoading(false) }
    }, 350)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [form.cep, form.eligibilityType])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError('')
    if (form.eligibilityType === 'RESIDENT' && !cepResult?.eligible) { setError('Consulte e informe um CEP válido de Vitória/ES antes de continuar.'); return }
    setLoading(true)
    try {
      const payload = new FormData()
      Object.entries(form).forEach(([key, value]) => payload.append(key, String(value)))
      payload.append('classId', targetClass?.id || '')
      if (rgDocument) payload.append('rgDocument', rgDocument)
      const response = await fetch('/api/enrollments', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined, body: payload })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Não foi possível realizar a inscrição.')
      setMessage(result.message)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível realizar a inscrição.') }
    finally { setLoading(false) }
  }
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.86)', display: 'grid', placeItems: 'center', padding: 20 }}>
    <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', background: '#111219', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: 28 }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
      <h2 style={{ color: '#fff', marginTop: 0 }}>Inscrição — {course.name}</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}><span style={{ color: step === 1 ? '#60a5fa' : '#64748b' }}>1. Contato</span><span style={{ color: '#334155' }}>›</span><span style={{ color: step === 2 ? '#60a5fa' : '#64748b' }}>2. Matrícula</span></div>
      {message ? <div style={{ color: '#4ade80', padding: 24, textAlign: 'center' }}>{message}</div> : step === 1 ? <form onSubmit={event => { event.preventDefault(); setStep(2) }} style={{ display: 'grid', gap: 12 }}>
        {student ? <div style={{...termBox,borderColor:'rgba(34,197,94,.4)',background:'rgba(34,197,94,.08)',color:'#86efac'}}>✓ Usaremos os dados já cadastrados na sua conta. Você só precisa completar o que faltar.</div> : <div style={termBox}>Já possui cadastro? <a href="/estudante" style={{color:'#60a5fa',fontWeight:700}}>Entre na Área do Estudante</a> para aproveitar automaticamente seus dados.</div>}
        {profile?.phone ? <div style={{...termBox,borderColor:'rgba(34,197,94,.4)',background:'rgba(34,197,94,.08)'}}><strong style={{color:'#86efac'}}>Dados de contato encontrados</strong><div style={{marginTop:7,color:'#cbd5e1'}}>{form.name}<br />{form.email}<br />{form.phone}</div><small style={{display:'block',marginTop:8,color:'#94a3b8'}}>Confira seus dados na etapa final antes de concluir.</small></div> : [['name','Nome completo','text'],['email','E-mail','email'],['phone','Telefone','tel']].map(([key,label,type]) => { const accountField=Boolean(student && (key==='name'||key==='email')); return <label key={key} style={{ display: 'grid', gap: 6, color: '#cbd5e1', fontSize: 13 }}>{label}<input type={type} required readOnly={accountField} value={String(form[key as keyof typeof form])} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} style={accountField?readOnlyAddressInput:enrollmentInput} /></label> })}
        <button disabled={!targetClass} style={{ ...enrollmentButton, background: course.chatColor }}>{targetClass ? 'Avançar' : 'Turma indisponível'}</button>
      </form> : <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        {hasReusableEnrollment ? <div style={{...termBox,borderColor:'rgba(34,197,94,.4)',background:'rgba(34,197,94,.08)'}}><strong style={{color:'#86efac'}}>Resumo dos dados para confirmação</strong><p style={{margin:'8px 0 0',lineHeight:1.6}}>Usaremos seus dados cadastrados, incluindo CPF, vínculo com Vitória, endereço e informações de perfil. Nenhuma informação será solicitada novamente.</p><p style={{margin:'8px 0 0',color:'#cbd5e1'}}><strong>Curso:</strong> {course.name}<br /><strong>Contato:</strong> {form.name} · {form.phone}</p></div> : <>
        <label style={enrollmentLabel}>Vínculo com Vitória<select required value={form.eligibilityType} onChange={event => setForm({ ...form, eligibilityType: event.target.value })} style={enrollmentInput}><option value="RESIDENT">Resido em Vitória</option><option value="WORKER">Trabalho em Vitória</option></select></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label style={enrollmentLabel}>CPF<input required value={form.cpf} onChange={e => setForm({...form,cpf:e.target.value})} style={enrollmentInput}/></label>{form.eligibilityType === 'RESIDENT' ? <label style={enrollmentLabel}>CEP residencial<input required inputMode="numeric" maxLength={9} value={form.cep} onChange={e => { const digits=e.target.value.replace(/\D/g,'').slice(0,8); setForm({...form,cep:digits.length>5?`${digits.slice(0,5)}-${digits.slice(5)}`:digits}) }} style={{...enrollmentInput,borderColor:cepResult?.eligible?'#22c55e':cepError?'#ef4444':undefined}} placeholder="29000-000"/><small aria-live="polite" style={{color:cepLoading?'#60a5fa':cepResult?.eligible?'#4ade80':'#f87171'}}>{cepLoading?'Consultando CEP…':cepResult?.eligible?'✓ CEP válido para Vitória/ES':cepError}</small></label> : <label style={enrollmentLabel}>CNPJ da empresa<input required value={form.cnpj} onChange={e => setForm({...form,cnpj:e.target.value})} style={enrollmentInput}/></label>}</div>
        {form.eligibilityType === 'RESIDENT' && cepResult && <fieldset style={{...termBox,borderColor:cepResult.eligible?'rgba(34,197,94,.45)':'rgba(248,113,113,.45)',background:cepResult.eligible?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><legend style={{padding:'0 7px',fontWeight:700}}>Endereço preenchido pelo CEP</legend><label style={{...enrollmentLabel,gridColumn:'1 / -1'}}>Logradouro<input readOnly value={cepResult.address.street} placeholder="Não informado pelo CEP" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Bairro<input readOnly value={cepResult.address.neighborhood} placeholder="Não informado pelo CEP" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Município<input readOnly value={cepResult.address.city} style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>UF<input readOnly value={`${cepResult.address.state} — ${cepResult.address.stateName}`} style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Região<input readOnly value={cepResult.address.region} placeholder="Não informada" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>DDD<input readOnly value={cepResult.address.ddd} placeholder="Não informado" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Código IBGE<input readOnly value={cepResult.address.ibge} placeholder="Não informado" style={readOnlyAddressInput}/></label><label style={{...enrollmentLabel,gridColumn:'1 / -1'}}>Complemento do CEP<input readOnly value={cepResult.address.complement} placeholder="Não informado pelo CEP" style={readOnlyAddressInput}/></label></fieldset>}
        {profile?.hasRgDocument ? <div style={{...termBox,borderColor:'rgba(34,197,94,.4)',background:'rgba(34,197,94,.08)',color:'#86efac'}}>✓ Documento de identificação já validado no seu cadastro e será reutilizado.</div> : <label style={enrollmentLabel}>Foto do RG <small style={{color:'#64748b'}}>JPG, PNG ou WebP · até 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setRgDocument(e.target.files?.[0] || null)} style={enrollmentInput}/></label>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label style={enrollmentLabel}>Autodeclaração de raça<select required value={form.race} onChange={e=>setForm({...form,race:e.target.value})} style={enrollmentInput}><option value="">Selecione</option><option value="PARDO">Pardo</option><option value="AMARELO">Amarelo</option><option value="BRANCO">Branco</option><option value="PRETO">Preto</option></select></label><label style={enrollmentLabel}>Data de nascimento<input type="date" required value={form.birthDate} onChange={e=>setForm({...form,birthDate:e.target.value})} style={enrollmentInput}/></label></div>
        <label style={enrollmentLabel}>Gênero<select required value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} style={enrollmentInput}><option value="">Selecione</option><option value="FEMININO">Feminino</option><option value="MASCULINO">Masculino</option><option value="NAO_BINARIO">Não binário</option><option value="OUTRO">Outro</option><option value="NAO_INFORMAR">Prefiro não informar</option></select></label>
        <label style={enrollmentLabel}>Grau de escolaridade<select required value={form.education} onChange={e=>setForm({...form,education:e.target.value})} style={enrollmentInput}><option value="">Selecione</option><option value="FUNDAMENTAL_INCOMPLETO">Fundamental incompleto</option><option value="FUNDAMENTAL_COMPLETO">Fundamental completo</option><option value="MEDIO_INCOMPLETO">Médio incompleto</option><option value="MEDIO_COMPLETO">Médio completo</option><option value="SUPERIOR_INCOMPLETO">Superior incompleto</option><option value="SUPERIOR_COMPLETO">Superior completo</option><option value="POS_GRADUACAO">Pós-graduação</option></select></label>
        <label style={enrollmentLabel}>Possui deficiência? Qual?<textarea value={form.disability} onChange={e=>setForm({...form,disability:e.target.value})} style={enrollmentInput}/></label>
        <label style={enrollmentLabel}>Necessidade de acessibilidade para as aulas<textarea value={form.accessibilityNeeds} onChange={e=>setForm({...form,accessibilityNeeds:e.target.value})} style={enrollmentInput} placeholder="Descreva os recursos necessários, caso haja."/></label>
        <label style={enrollmentLabel}>Necessidade de acompanhante nas aulas<textarea value={form.companionNeeds} onChange={e=>setForm({...form,companionNeeds:e.target.value})} style={enrollmentInput} placeholder="Descreva a necessidade, caso haja."/></label>
        </>}
        <div style={termBox}><strong>Proteção de dados — LGPD</strong><p style={termText}>Autorizo o tratamento dos meus dados pessoais e sensíveis exclusivamente para seleção, matrícula, acompanhamento pedagógico, acessibilidade e certificação. O RG será armazenado em área privada e acessível somente por pessoal autorizado.</p><label><input type="checkbox" required checked={form.lgpdAccepted} onChange={e=>setForm({...form,lgpdAccepted:e.target.checked})}/> Li e autorizo o tratamento descrito.</label></div>
        <div style={termBox}><strong>Termo de compromisso do estudante</strong><p style={termText}>Comprometo-me a fornecer informações verdadeiras, participar das atividades e cumprir a frequência mínima definida para a turma. Faltas injustificadas, abandono ou fraude podem causar cancelamento da matrícula e impedimento temporário de novas inscrições, após análise administrativa e conforme regulamentação vigente. O limite da plataforma é de 3 inscrições por CPF a cada ano.</p><label><input type="checkbox" required checked={form.commitmentAccepted} onChange={e=>setForm({...form,commitmentAccepted:e.target.checked})}/> Li e aceito o termo de compromisso.</label></div>
        <div style={{display:'flex',gap:10}}><button type="button" onClick={()=>setStep(1)} style={{...enrollmentButton,background:'#334155'}}>Voltar</button><button disabled={loading || cepLoading || (form.eligibilityType === 'RESIDENT' && !cepResult?.eligible)} style={{...enrollmentButton,background:course.chatColor,flex:1,opacity:(loading || cepLoading || (form.eligibilityType === 'RESIDENT' && !cepResult?.eligible)) ? .55 : 1}}>{loading?'Validando e enviando…':'Finalizar matrícula'}</button></div>
        {error && <p role="alert" style={{ color: '#f87171', margin: 0 }}>{error}</p>}
      </form>}
    </div>
  </div>
}

const enrollmentInput: React.CSSProperties = { padding: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,.13)', background: '#0b1220', color: '#e2e8f0', fontFamily: 'inherit' }
const readOnlyAddressInput: React.CSSProperties = { ...enrollmentInput, background: '#161d2b', color: '#cbd5e1', cursor: 'not-allowed' }
const enrollmentLabel: React.CSSProperties = { display: 'grid', gap: 6, color: '#cbd5e1', fontSize: 13 }
const enrollmentButton: React.CSSProperties = { padding: 12, border: 0, borderRadius: 9, color: '#fff', fontWeight: 700, cursor: 'pointer' }
const termBox: React.CSSProperties = { padding: 16, border: '1px solid rgba(96,165,250,.25)', borderRadius: 10, background: 'rgba(37,99,235,.08)', color: '#cbd5e1', fontSize: 13 }
const termText: React.CSSProperties = { color: '#94a3b8', lineHeight: 1.55, margin: '8px 0 12px' }

function AvailabilityNoticeModal({ course, profile, token, onClose }: { course: Course; profile: EnrollmentProfile | null; token: string; onClose: () => void }) {
  const [phone, setPhone] = useState(profile?.phone || '')
  const [editing, setEditing] = useState(!profile?.phone)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const savedPhone = profile?.phone || ''

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true); setError('')
    try {
      const response = await fetch('/api/course-availability-notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ courseId: course.databaseId, phone: editing ? phone : undefined }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || 'Não foi possível registrar o aviso.')
      setMessage(result.message)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível registrar o aviso.') }
    finally { setLoading(false) }
  }

  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:210,background:'rgba(0,0,0,.72)',display:'grid',placeItems:'center',padding:20}}>
    <div onClick={event=>event.stopPropagation()} className="animate-slide-in" style={{width:'100%',maxWidth:460,background:'#111827',border:'1px solid rgba(96,165,250,.28)',borderRadius:18,padding:26,color:'#e2e8f0',boxShadow:'0 20px 60px rgba(0,0,0,.5)'}}>
      <button onClick={onClose} aria-label="Fechar" style={{float:'right',background:'none',border:0,color:'#94a3b8',fontSize:22,cursor:'pointer'}}>×</button>
      <div style={{fontSize:28,marginBottom:10}}>🔔</div>
      <h2 style={{margin:'0 0 8px',fontSize:22,color:'#fff'}}>Avise-me quando estiver disponível</h2>
      <p style={{margin:'0 0 20px',color:'#94a3b8',lineHeight:1.55}}>Receba um aviso quando <strong style={{color:'#e2e8f0'}}>{course.name}</strong> voltar a aceitar inscrições.</p>
      {message ? <div style={{...termBox,borderColor:'rgba(34,197,94,.45)',background:'rgba(34,197,94,.08)',color:'#86efac'}}>{message}</div> : <form onSubmit={submit} style={{display:'grid',gap:14}}>
        {savedPhone && !editing ? <>
          <div style={{...termBox,borderColor:'rgba(96,165,250,.35)'}}>Podemos avisar você pelo telefone:<br /><strong style={{display:'block',fontSize:18,color:'#fff',marginTop:6}}>{savedPhone}</strong></div>
          <p style={{margin:0,color:'#cbd5e1'}}>Este número continua correto?</p>
          <div style={{display:'flex',gap:10}}><button type="submit" disabled={loading} style={{...enrollmentButton,background:'#2563eb',flex:1}}>{loading?'Salvando…':'Sim, está correto'}</button><button type="button" onClick={()=>setEditing(true)} style={{...enrollmentButton,background:'#334155',flex:1}}>Alterar número</button></div>
        </> : <>
          <label style={enrollmentLabel}>Telefone<input autoFocus required type="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="(27) 99999-9999" style={enrollmentInput}/></label>
          <button disabled={loading} style={{...enrollmentButton,background:'#2563eb'}}>{loading?'Salvando…':'Avise-me'}</button>
          {savedPhone && <button type="button" onClick={()=>{setPhone(savedPhone);setEditing(false)}} style={{background:'none',border:0,color:'#93c5fd',cursor:'pointer'}}>Usar número cadastrado</button>}
        </>}
        {error && <p role="alert" style={{margin:0,color:'#f87171'}}>{error}</p>}
      </form>}
    </div>
  </div>
}

function CourseCard({ course, onVideoOpen, onEnroll, onNotify }: { course: Course; onVideoOpen: () => void; onEnroll: () => void; onNotify: () => void }) {
  const pct = Math.min(95, Math.round((course.inscritos / (course.vagas * 28)) * 100))
  const hasOpenClass = Boolean(course.classes?.some(item => item.status === 'OPEN'))

  return (
    <div
      style={{
        background: '#111219',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16, overflow: 'hidden',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${course.chatColor}35`
        e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.35)`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Video thumbnail */}
      <div
        onClick={onVideoOpen}
        style={{ position: 'relative', height: 172, overflow: 'hidden', cursor: 'pointer', flexShrink: 0 }}
      >
        <img
          src={course.image}
          alt={course.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.4s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.04)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,11,20,0.85) 0%, rgba(10,11,20,0.15) 55%, transparent 100%)',
        }} />

        {/* Play button */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)',
          border: '1.5px solid rgba(255,255,255,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s, transform 0.2s',
          fontSize: 16, paddingLeft: 3,
        }}>
          ▶
        </div>

        {/* Video label */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '3px 8px',
          fontSize: 10, fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ color: '#f97316' }}>▶</span> VER APRESENTAÇÃO
        </div>

        {/* Status badge bottom right */}
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
          <StatusBadge status={course.status} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '14px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Title + area */}
        <div>
          <div style={{ fontSize: 10, color: course.chatColor, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>
            {course.area}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.2 }}>{course.name}</div>
          <p style={{ fontSize: 12.5, color: '#64748b', lineHeight: 1.55, margin: '6px 0 0' }}>{course.synopse}</p>
        </div>

        {/* Compact stats: 4 inline chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { icon: '⏱️', value: course.duracao },
            { icon: PERIODO_ICONS[course.periodo], value: course.periodo },
            { icon: '📚', value: `${course.cargaHoraria}h` },
          ].map(s => (
            <div key={s.value} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(255,255,255,0.04)', borderRadius: 6,
              padding: '4px 9px', fontSize: 12, color: '#94a3b8', fontWeight: 500,
            }}>
              <span style={{ fontSize: 11 }}>{s.icon}</span>
              {s.value}
            </div>
          ))}
        </div>

        {/* Inscritos bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: '#475569' }}>Inscritos</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: course.chatColor }}>
              {course.inscritos.toLocaleString('pt-BR')}
            </span>
          </div>
          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2, width: `${pct}%`,
              background: `linear-gradient(to right, ${course.chatColor}, ${course.chatColor}99)`,
            }} />
          </div>
        </div>

        {/* Indicado para */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {course.indicadoPara.map(ip => (
            <span key={ip} style={{
              fontSize: 10.5, padding: '3px 9px', borderRadius: 999, fontWeight: 500,
              background: `${course.chatColor}14`, color: course.chatColor,
              border: `1px solid ${course.chatColor}28`,
            }}>
              {INDICADO_LABELS[ip]}
            </span>
          ))}
        </div>

        {/* Salary + CTA */}
        <div style={{
          marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10,
          paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Salário médio</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: course.chatColor }}>{course.mediaSalarial}</div>
          </div>
          <button
            onClick={hasOpenClass ? onEnroll : onNotify}
            style={{
              padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: hasOpenClass ? `${course.chatColor}` : 'rgba(255,255,255,0.08)',
              color: hasOpenClass ? '#fff' : '#cbd5e1',
              fontWeight: 700, fontSize: 12.5, letterSpacing: '0.02em',
              whiteSpace: 'nowrap', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { if (hasOpenClass) e.currentTarget.style.opacity = '0.86' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {hasOpenClass ? 'Inscrever-se — Grátis' : 'Avise-me'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatBot({ onEnroll, onNotify }: { onEnroll: (course: Course) => void; onNotify: (course: Course) => void }) {
  const courses = useCourses()
  const turtleAccessory: Record<string, string> = { tecnologia: '💻', criatividade: '🎨', negocios: '💼', gastronomia: '👨‍🍳', construcao: '🦺', marketing: '📣', moda: '🧵' }
  const [open, setOpen] = useState(false)
  const [chat, setChat] = useState<ChatState>({
    step: 'objetivo',
    objetivo: '',
    area: '',
    periodo: '',
    results: [],
    theme: '#f97316',
  })
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([])
  const [chatInput, setChatInput] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [started, setStarted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !started) {
      setMessages([{ role: 'bot', text: CHATBOT_STEPS.objetivo.question }])
      setStarted(true)
    }
  }, [open, started])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleOption = (value: string, label: string) => {
    const newMessages = [...messages, { role: 'user' as const, text: label }]

    if (chat.step === 'objetivo') {
      const next = { ...chat, objetivo: value, step: 'area' as ChatStep }
      setChat(next)
      setMessages([...newMessages, { role: 'bot', text: CHATBOT_STEPS.area.question }])
    } else if (chat.step === 'area') {
      const theme = AREA_THEMES[value] || '#f97316'
      const next = { ...chat, area: value, step: 'periodo' as ChatStep, theme }
      setChat(next)
      setMessages([...newMessages, { role: 'bot', text: CHATBOT_STEPS.periodo.question }])
    } else if (chat.step === 'periodo') {
      const areaIds = AREA_IDS[chat.area] || []
      let candidates = courses.filter(c => areaIds.includes(c.id))
      if (value !== 'qualquer') candidates = candidates.filter(c => c.periodo === value || candidates.length === 0)
      if (candidates.length === 0) candidates = courses.filter(c => areaIds.includes(c.id))
      const objetivo = chat.objetivo as IndicadoPara
      const sorted = [...candidates].sort((a, b) =>
        (b.indicadoPara.includes(objetivo) ? 1 : 0) - (a.indicadoPara.includes(objetivo) ? 1 : 0)
      )
      const next = { ...chat, periodo: value, step: 'result' as ChatStep, results: sorted.slice(0, 2) }
      setChat(next)
      const resultMsg = sorted.length > 0
        ? `Encontrei ${sorted.length} curso(s) perfeito(s) para você! 🎉`
        : 'Não encontrei um curso exato, mas veja nossas opções mais populares:'
      setMessages([...newMessages, { role: 'bot', text: resultMsg }])
    }
  }

  const selectCourse = (course: Course) => {
    setSelectedCourse(course)
    setMessages(previous => [...previous, { role: 'bot', text: `${course.name} tem ${course.cargaHoraria}h, duração de ${course.duracao} e acontece no período ${course.periodo}. ${course.synopse}\n\n${course.classes?.some(item => item.status === 'OPEN') ? 'Se quiser, posso iniciar sua inscrição agora.' : 'No momento as inscrições não estão abertas, mas posso registrar seu telefone para avisar você.'}` }])
  }

  const submitChat = (event: React.FormEvent) => {
    event.preventDefault()
    const text = chatInput.trim()
    if (!text) return
    setChatInput('')
    const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    const namedCourse = courses.find(course => normalized.includes(course.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()))
    const course = namedCourse || selectedCourse || chat.results[0]
    const wantsEnrollment = /(inscrev|participar|fazer esse curso|entrar nesse curso|quero esse curso)/.test(normalized)
    const wantsNotice = /(avise|avisar|notifique|notificar)/.test(normalized)
    const wantsDetails = /(detalh|sobre|duracao|carga horaria|periodo)/.test(normalized)
    setMessages(previous => [...previous, { role: 'user', text }])
    if (namedCourse) setSelectedCourse(namedCourse)
    if (wantsEnrollment && !course) {
      const available = courses.filter(item => item.classes?.some(currentClass => currentClass.status === 'OPEN'))
      setChat(previous => ({ ...previous, step: 'result', results: available.slice(0, 4) }))
      setMessages(previous => [...previous, { role: 'bot', text: 'Claro! Qual curso você quer fazer? Escolha uma opção disponível abaixo e eu inicio sua inscrição.' }])
      return
    }
    if ((wantsEnrollment || wantsNotice) && course) {
      if (course.classes?.some(item => item.status === 'OPEN') && wantsEnrollment) {
        setMessages(previous => [...previous, { role: 'bot', text: `Perfeito — vou iniciar a inscrição em ${course.name}. Usarei seus dados já cadastrados e pedirei somente o que faltar. Antes de finalizar, você poderá revisar tudo.` }])
        onEnroll(course)
      } else {
        setMessages(previous => [...previous, { role: 'bot', text: `${course.name} ainda não está disponível. Vou abrir o aviso; se já houver um telefone cadastrado, basta confirmá-lo.` }])
        onNotify(course)
      }
      return
    }
    if (wantsDetails && course) { selectCourse(course); return }
    if (namedCourse) { selectCourse(namedCourse); return }
    setMessages(previous => [...previous, { role: 'bot', text: 'Posso ajudar você a encontrar um curso, explicar uma opção ou iniciar uma inscrição. Diga o nome do curso ou escolha uma das opções abaixo.' }])
  }

  const reset = () => {
    setChat({ step: 'objetivo', objetivo: '', area: '', periodo: '', results: [], theme: '#f97316' })
    setMessages([{ role: 'bot', text: CHATBOT_STEPS.objetivo.question }])
    setSelectedCourse(null)
  }

  const currentStep = CHATBOT_STEPS[chat.step]
  const accentColor = chat.theme

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 100,
          width: 68, height: 68, borderRadius: '50%',
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          border: 'none', cursor: 'pointer', color: '#fff', fontSize: 22,
          boxShadow: `0 4px 20px ${accentColor}66`,
          transition: 'transform 0.2s, box-shadow 0.2s',
          position: 'fixed' as const,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'scale(1.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
        title="Assistente de Cursos"
      >
        {open ? '✕' : <span className="turtle-mascot" data-area={chat.area || 'default'} style={{ position: 'relative', display: 'block', width: 64, height: 64 }}><img src="/assets/tartaruga-qualificavix.png" alt="Assistente tartaruga do QualificaVix" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />{turtleAccessory[chat.area] && <span style={{ position: 'absolute', top: -8, right: -5, fontSize: 24 }}>{turtleAccessory[chat.area]}</span>}</span>}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="animate-slide-in"
          style={{
            position: 'fixed', bottom: 104, right: 24, zIndex: 99,
            width: 360, maxWidth: 'calc(100vw - 48px)',
            background: '#0f1019',
            border: `1px solid ${accentColor}30`,
            borderRadius: 20,
            boxShadow: `0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px ${accentColor}15`,
            display: 'flex', flexDirection: 'column', maxHeight: '70vh',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '14px 18px',
            background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}08)`,
            borderBottom: `1px solid ${accentColor}20`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div className="turtle-mascot" data-area={chat.area || 'default'} style={{ width: 44, height: 44, position: 'relative', flexShrink: 0 }}><img src="/assets/tartaruga-qualificavix.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />{turtleAccessory[chat.area] && <span style={{ position: 'absolute', top: -7, right: -7, fontSize: 18 }}>{turtleAccessory[chat.area]}</span>}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0' }}>Assistente QualificaVix</div>
              <div style={{ fontSize: 11, color: accentColor }}>● Online agora</div>
            </div>
            <button
              onClick={reset}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,0.06)',
                border: 'none', borderRadius: 8, padding: '4px 10px',
                color: '#64748b', fontSize: 11, cursor: 'pointer',
              }}
            >
              Reiniciar
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '14px 14px 8px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                marginBottom: 10,
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '80%', padding: '9px 13px', borderRadius: 14,
                  background: m.role === 'user'
                    ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                    : 'rgba(255,255,255,0.06)',
                  color: m.role === 'user' ? '#fff' : '#d1d5db',
                  fontSize: 13, lineHeight: 1.55,
                  borderTopRightRadius: m.role === 'user' ? 4 : 14,
                  borderTopLeftRadius: m.role === 'bot' ? 4 : 14,
                  whiteSpace: 'pre-line',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {/* Course results */}
            {chat.step === 'result' && chat.results.map(c => (
              <div key={c.id} style={{
                background: `${c.chatColor}12`,
                border: `1px solid ${c.chatColor}30`,
                borderRadius: 12, padding: 12, marginBottom: 8,
              }}>
                <img src={c.image} alt={c.name} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: '#e2e8f0', marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{c.area} · {c.cargaHoraria}h · {c.periodo}</div>
                <StatusBadge status={c.status} />
                <div style={{ marginTop: 8, fontSize: 12, color: c.chatColor, fontWeight: 600 }}>{c.mediaSalarial}</div>
                <div style={{display:'flex',gap:8,marginTop:10}}><button type="button" onClick={() => selectCourse(c)} style={{...enrollmentButton,flex:1,padding:9,background:'#334155'}}>Detalhes</button>{c.classes?.some(item => item.status === 'OPEN') ? <button type="button" onClick={() => { selectCourse(c); onEnroll(c) }} style={{...enrollmentButton,flex:1,padding:9,background:c.chatColor}}>Inscrever-se</button> : <button type="button" onClick={() => { selectCourse(c); onNotify(c) }} style={{...enrollmentButton,flex:1,padding:9,background:'#334155'}}>Avise-me</button>}</div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Options */}
          {chat.step !== 'result' && currentStep.options.length > 0 && (
            <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {currentStep.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOption(opt.value, opt.label)}
                  style={{
                    padding: '9px 14px', borderRadius: 10, textAlign: 'left',
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid rgba(255,255,255,0.08)`,
                    color: '#d1d5db', fontSize: 13, cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${accentColor}18`
                    e.currentTarget.style.borderColor = `${accentColor}40`
                    e.currentTarget.style.color = '#fff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
                    e.currentTarget.style.color = '#d1d5db'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {chat.step === 'result' && (
            <div style={{ padding: '8px 14px 14px' }}>
              <button
                onClick={() => window.location.hash = '#cursos'}
                style={{
                  width: '100%', padding: '10px 0', borderRadius: 10,
                  background: accentColor, color: '#fff',
                  fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                }}
              >
                Ver todos os cursos
              </button>
            </div>
          )}
          <form onSubmit={submitChat} style={{display:'flex',gap:8,padding:'0 14px 14px'}}>
            <input value={chatInput} onChange={event=>setChatInput(event.target.value)} placeholder="Digite sua mensagem" aria-label="Mensagem para o assistente" style={{...enrollmentInput,flex:1,padding:'10px 12px',fontSize:13}} />
            <button type="submit" style={{...enrollmentButton,background:accentColor,padding:'10px 14px'}}>Enviar</button>
          </form>
        </div>
      )}
    </>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function GovernmentBar() {
  return <div style={{ position: 'fixed', inset: '0 0 auto', zIndex: 60, height: 34, background: '#092f57', borderBottom: '1px solid rgba(255,255,255,.15)', color: '#fff' }}>
    <div style={{ maxWidth: 1200, height: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
      <span className="government-label">Prefeitura Municipal de Vitória · Portal de Qualificação Profissional</span>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <a href="#conteudo" style={{ color: '#fff' }}>Ir para o conteúdo</a>
        <a href="https://www.vitoria.es.gov.br/cidadao/acessibilidade" target="_blank" rel="noreferrer" style={{ color: '#fff' }}>Acessibilidade</a>
        <a href="https://www.vitoria.es.gov.br/" target="_blank" rel="noreferrer" style={{ color: '#fff' }}>Portal da Prefeitura ↗</a>
      </div>
    </div>
  </div>
}

function Navbar({ activeSection }: { activeSection: string }) {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { href: '#cursos', label: 'Cursos' },
    { href: '#como-funciona', label: 'Como Funciona' },
    { href: '#historias', label: 'Histórias' },
    { href: '#pesquisa', label: 'Pesquisa' },
  ]

  return (
    <nav style={{
      position: 'fixed', top: 34, left: 0, right: 0, zIndex: 50,
      padding: '0 24px',
      background: scrolled ? 'rgba(10,11,20,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition: 'background 0.4s, border-color 0.4s, backdrop-filter 0.4s',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 68,
      }}>
        {/* Left: city logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <PrefeituraLogo />
          <div style={{ width: 1, height: 32, background: 'rgba(255,255,255,0.1)' }} />
          <div>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: '#fff', letterSpacing: '-0.01em' }}>
              Qualifica
            </span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: '#3b82f6', letterSpacing: '-0.01em' }}>
              Vix
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: '#94a3b8', fontSize: 14, fontWeight: 500,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8' }}
            >
              {l.label}
            </a>
          ))}
          <a href="/estudante" style={{ color: '#60a5fa', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Área do estudante</a>
          <a
            href="#cursos"
            style={{
              padding: '8px 20px', borderRadius: 10,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', fontWeight: 700, fontSize: 14,
              textDecoration: 'none', letterSpacing: '0.02em',
              boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            Inscreva-se Grátis
          </a>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  const courses = useCourses()
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setImgIndex(i => (i + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section id="conteudo" aria-labelledby="titulo-principal" style={{ position: 'relative', height: '100vh', minHeight: 680, overflow: 'hidden' }}>
      {/* Background images */}
      {HERO_IMAGES.map((src, i) => (
        <div
          key={src}
          className="hero-img"
          style={{ opacity: i === imgIndex ? 1 : 0, backgroundImage: `url(${src})` }}
        />
      ))}

      {/* Overlays */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(10,11,20,0.65) 0%, rgba(10,11,20,0.45) 40%, rgba(10,11,20,0.85) 80%, #0a0b14 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.12) 0%, transparent 60%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 800, margin: '0 auto',
        padding: '0 24px',
        height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.3)',
          borderRadius: 999, padding: '5px 14px', marginBottom: 24,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#f97316', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Cursos 100% gratuitos — Vitória, ES
          </span>
        </div>

        <h1 id="titulo-principal" style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(44px, 7vw, 80px)',
          fontWeight: 400, color: '#fff', lineHeight: 1.1,
          letterSpacing: '-0.02em', margin: '0 0 20px',
        }}>
          Qualifique-se e<br />
          <span style={{ color: '#f97316' }}>transforme</span> sua<br />
          <span style={{ color: '#3b82f6' }}>carreira</span>.
        </h1>

        <p style={{
          fontSize: 18, color: '#94a3b8', lineHeight: 1.65,
          maxWidth: 520, margin: '0 0 36px',
        }}>
          A Prefeitura de Vitória oferece cursos profissionalizantes gratuitos para moradores que buscam o primeiro emprego, empreender ou crescer na carreira.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a
            href="#cursos"
            style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', fontWeight: 700, fontSize: 15,
              textDecoration: 'none', letterSpacing: '0.02em',
              boxShadow: '0 6px 24px rgba(249,115,22,0.45)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(249,115,22,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(249,115,22,0.45)'
            }}
          >
            Ver cursos disponíveis
          </a>
          <a
            href="#como-funciona"
            style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#e2e8f0', fontWeight: 600, fontSize: 15,
              textDecoration: 'none', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
          >
            Como funciona
          </a>
        </div>

        {/* Image dots indicator */}
        <div style={{ display: 'flex', gap: 6, marginTop: 40 }}>
          {HERO_IMAGES.map((_, i) => (
            <button
              key={i}
              aria-label={`Exibir imagem ${i + 1} de ${HERO_IMAGES.length}`}
              onClick={() => setImgIndex(i)}
              style={{
                width: i === imgIndex ? 24 : 6, height: 6, borderRadius: 3,
                background: i === imgIndex ? '#f97316' : 'rgba(255,255,255,0.25)',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'width 0.3s, background 0.3s',
              }}
            />
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 3,
        background: 'rgba(10,11,20,0.9)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}>
          {[
            { value: String(courses.length), label: 'Cursos no catálogo', color: '#f97316' },
            { value: 'Online', label: 'Pré-inscrição simplificada', color: '#3b82f6' },
            { value: '100%', label: 'Gratuito — sem taxas', color: '#22c55e' },
            { value: 'Vitória', label: 'Oportunidades para moradores', color: '#f97316' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '18px 0', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CoursesSection({ onEnroll, onNotify }: { onEnroll: (course: Course) => void; onNotify: (course: Course) => void }) {
  const [videoOpen, setVideoOpen] = useState<Course | null>(null)
  const courses = useCourses()
  const sorted = [...courses].sort((a, b) => b.inscritos - a.inscritos)

  return (
    <section id="cursos" style={{ padding: '80px 24px' }}>
      {videoOpen && <VideoModal course={videoOpen} onClose={() => setVideoOpen(null)} />}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 48, maxWidth: 560 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#f97316', marginBottom: 12,
          }}>
            Cursos Profissionalizantes
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 400, color: '#fff',
            lineHeight: 1.15, letterSpacing: '-0.02em', margin: '0 0 14px',
          }}>
            Escolha o seu<br />
            <span style={{ color: '#3b82f6' }}>próximo passo</span>.
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Todos os cursos são gratuitos, com certificado reconhecido e instrutores qualificados. Clique na miniatura de qualquer curso para assistir a apresentação em vídeo.
          </p>
        </div>

        <div style={{
          marginBottom: 20,
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
          borderRadius: 999, padding: '5px 14px',
        }}>
          <span style={{ fontSize: 12, color: '#f97316', fontWeight: 600 }}>🔥 Ordenado por popularidade</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}>
          {sorted.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onVideoOpen={() => setVideoOpen(course)}
              onEnroll={() => onEnroll(course)}
              onNotify={() => onNotify(course)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function EnrollSection() {
  const steps = [
    {
      n: '01', title: 'Escolha o Curso', icon: '🔍',
      desc: 'Navegue pelos cursos disponíveis e encontre o que mais combina com seus objetivos. Nosso assistente virtual pode te ajudar.',
      color: '#f97316',
    },
    {
      n: '02', title: 'Faça o Cadastro', icon: '📝',
      desc: 'Preencha o formulário online com os dados necessários. Se você já tem cadastro, suas informações são aproveitadas automaticamente.',
      color: '#3b82f6',
    },
    {
      n: '03', title: 'Confirmação', icon: '✅',
      desc: 'Você receberá uma confirmação por e-mail ou SMS com data, horário e endereço do polo onde o curso será realizado.',
      color: '#22c55e',
    },
    {
      n: '04', title: 'Comece a Estudar', icon: '🎓',
      desc: 'Compareça ao curso no dia marcado. Material didático e certificado são fornecidos gratuitamente pela Prefeitura de Vitória.',
      color: '#f97316',
    },
  ]

  return (
    <section id="como-funciona" style={{ padding: '80px 24px', background: '#0d0e1a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>
            Processo de Inscrição
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#fff',
            lineHeight: 1.15, margin: '0 0 14px', letterSpacing: '-0.02em',
          }}>
            Como se inscrever
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', maxWidth: 480, margin: '0 auto' }}>
            Em 4 passos simples você garante sua vaga em um curso profissionalizante gratuito.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative' }}>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  display: 'none', // hidden on mobile, shown via CSS would need media query
                }} />
              )}
              <div style={{
                background: '#111219',
                border: `1px solid rgba(255,255,255,0.06)`,
                borderRadius: 16, padding: '28px 24px',
                height: '100%',
                transition: 'border-color 0.3s, transform 0.3s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${s.color}44`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: `${s.color}18`, border: `1px solid ${s.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22,
                  }}>
                    {s.icon}
                  </div>
                  <span style={{
                    fontFamily: "'DM Serif Display', serif",
                    fontSize: 32, fontWeight: 400, color: `${s.color}30`,
                    lineHeight: 1,
                  }}>
                    {s.n}
                  </span>
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#e2e8f0', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}

function TestimonialsSection() {
  const [idx, setIdx] = useState(0)
  const current = TESTIMONIALS[idx]

  return (
    <section id="historias" style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: 12 }}>
            Histórias reais
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, color: '#fff',
            lineHeight: 1.15, margin: 0, letterSpacing: '-0.02em',
          }}>
            Quem transformou sua vida<br />com o QualificaVix
          </h2>
        </div>

        <div style={{
          background: '#111219', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '48px 48px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Orange accent */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ fontSize: 48, color: '#f97316', lineHeight: 1, marginBottom: 24, opacity: 0.6 }}>"</div>

          <p style={{
            fontSize: 'clamp(16px, 2vw, 20px)', color: '#d1d5db', lineHeight: 1.7,
            margin: '0 0 32px', fontStyle: 'italic',
          }}>
            {current.text}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <img
              src={current.photo}
              alt={current.name}
              style={{ width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2px solid #f97316' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>{current.name}</div>
              <div style={{ fontSize: 13, color: '#64748b' }}>{current.occupation}</div>
              <div style={{ fontSize: 12, color: '#f97316', marginTop: 1 }}>
                Curso: {current.course} · {current.neighborhood}
              </div>
            </div>
            <div style={{
              marginLeft: 'auto',
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 10, padding: '8px 16px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: '#64748b' }}>Salário atual</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{current.salary}</div>
            </div>
          </div>

          {/* Nav dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 28 : 8, height: 8, borderRadius: 4,
                  background: i === idx ? '#f97316' : 'rgba(255,255,255,0.15)',
                  border: 'none', cursor: 'pointer', padding: 0,
                  transition: 'width 0.3s, background 0.3s',
                }}
              />
            ))}
          </div>

          {/* Arrows */}
          <div style={{ position: 'absolute', top: '50%', left: 12, transform: 'translateY(-50%)' }}>
            <button
              onClick={() => setIdx(i => (i - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: 36, height: 36, color: '#94a3b8',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              ←
            </button>
          </div>
          <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}>
            <button
              onClick={() => setIdx(i => (i + 1) % TESTIMONIALS.length)}
              style={{
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '50%', width: 36, height: 36, color: '#94a3b8',
                cursor: 'pointer', fontSize: 14,
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function PopularSection() {
  const courses = useCourses()
  const top = [...courses].sort((a, b) => b.inscritos - a.inscritos).slice(0, 4)
  return (
    <section style={{ padding: '60px 24px 0', background: '#0d0e1a' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: 8 }}>
              🔥 Mais Procurados
            </div>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 400, color: '#fff',
              margin: 0, letterSpacing: '-0.02em',
            }}>
              Os favoritos dos alunos
            </h2>
          </div>
          <a href="#cursos" style={{ color: '#3b82f6', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
            Ver todos os cursos →
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {top.map((c, i) => (
            <div key={c.id} style={{
              background: '#111219', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.06)',
              padding: '16px', display: 'flex', gap: 14, alignItems: 'center',
              transition: 'border-color 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${c.chatColor}44` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${c.chatColor}20`, border: `1px solid ${c.chatColor}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: c.chatColor,
                fontFamily: "'DM Serif Display', serif",
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{c.inscritos.toLocaleString('pt-BR')} inscritos</div>
              </div>
              <StatusBadge status={c.status} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InterestSurvey() {
  const [form, setForm] = useState({ nome: '', bairro: '', curso: '', contato: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await postJson('/api/interests', form)
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar a sugestão.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section id="pesquisa" style={{ padding: '80px 24px', background: '#0d0e1a' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#3b82f6', marginBottom: 12 }}>
            Pesquisa de Interesse
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 400, color: '#fff',
            lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.02em',
          }}>
            Não achou o curso que procurava?
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Conte para nós qual curso você gostaria que a Prefeitura de Vitória oferecesse. Seu interesse pode influenciar nossa próxima grade.
          </p>
        </div>

        {submitted ? (
          <div style={{
            background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: 16, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Resposta enviada!</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              Obrigado, {form.nome}! Sua sugestão foi registrada e será analisada pela equipe do QualificaVix.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: '#111219', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '32px',
          }}>
            {[
              { id: 'nome', label: 'Seu nome completo', placeholder: 'Ex: Maria Silva', required: true },
              { id: 'bairro', label: 'Bairro / Região onde mora', placeholder: 'Ex: Jardim da Penha, Goiabeiras…', required: true },
              { id: 'curso', label: 'Nome do curso que você gostaria', placeholder: 'Ex: Curso de Enfermagem, Fotografia…', required: true },
              { id: 'contato', label: 'WhatsApp ou e-mail (opcional)', placeholder: 'Para te avisarmos quando o curso estiver disponível', required: false },
            ].map(f => (
              <div key={f.id} style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                  {f.label} {f.required && <span style={{ color: '#f97316' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={form[f.id as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.required}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#e2e8f0', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#3b82f6' }}
                  onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12,
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {submitting ? 'Enviando…' : 'Enviar sugestão de curso'}
            </button>
            {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
          </form>
        )}
      </div>
    </section>
  )
}

function SatisfactionSurvey() {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [recommend, setRecommend] = useState('')
  const [comment, setComment] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const questions = [
    { label: 'Ficou satisfeito?', value: 'sim', emoji: '😊' },
    { label: 'Regular', value: 'regular', emoji: '😐' },
    { label: 'Poderia melhorar', value: 'nao', emoji: '😕' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating || !recommend) return
    setSubmitting(true)
    setError('')
    try {
      await postJson('/api/satisfaction', { rating, recommend, comment })
      setSubmitted(true)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section style={{ padding: '80px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#f97316', marginBottom: 12 }}>
            Sua Opinião Importa
          </div>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 400, color: '#fff',
            lineHeight: 1.15, margin: '0 0 12px', letterSpacing: '-0.02em',
          }}>
            Pesquisa de satisfação
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
            Sua avaliação nos ajuda a melhorar o programa QualificaVix para toda a cidade.
          </p>
        </div>

        {submitted ? (
          <div style={{
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
            borderRadius: 16, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>Obrigado pelo feedback!</div>
            <div style={{ fontSize: 14, color: '#64748b' }}>
              Sua avaliação foi registrada. Continuamos trabalhando para oferecer os melhores cursos para Vitória.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: '#111219', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.06)',
            padding: '32px',
          }}>
            {/* Star rating */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>
                Como você avalia o programa QualificaVix? <span style={{ color: '#f97316' }}>*</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                      filter: n <= (hoverRating || rating) ? 'none' : 'grayscale(1) opacity(0.3)',
                      transform: n <= (hoverRating || rating) ? 'scale(1.2)' : 'scale(1)',
                      transition: 'filter 0.15s, transform 0.15s',
                    }}
                  >
                    ⭐
                  </button>
                ))}
                {rating > 0 && (
                  <span style={{ fontSize: 13, color: '#f97316', alignSelf: 'center', marginLeft: 8 }}>
                    {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente!'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Satisfaction */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 12 }}>
                Você recomendaria o QualificaVix para amigos e familiares? <span style={{ color: '#f97316' }}>*</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {questions.map(q => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setRecommend(q.value)}
                    style={{
                      padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
                      background: recommend === q.value ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.04)',
                      border: recommend === q.value ? '1px solid rgba(249,115,22,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      color: recommend === q.value ? '#f97316' : '#94a3b8',
                      fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span>{q.emoji}</span> {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                Deixe um comentário (opcional)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="O que você achou? O que poderia melhorar?"
                rows={4}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e2e8f0', fontSize: 14, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'inherit', transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#f97316' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {submitting ? 'Enviando…' : 'Enviar avaliação'}
            </button>
            {error && <p role="alert" style={{ color: '#f87171', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
          </form>
        )}
      </div>
    </section>
  )
}

function Footer() {
  const courses = useCourses()
  return (
    <footer style={{
      background: '#080910',
      borderTop: '1px solid rgba(255,255,255,0.05)',
      padding: '40px 24px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#fff' }}>Qualifica</span>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#3b82f6' }}>Vix</span>
            </div>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, margin: 0 }}>
              Programa de qualificação profissional gratuita da Prefeitura de Vitória — ES. Investindo nas pessoas que fazem a nossa cidade.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              Cursos
            </div>
            {courses.slice(0, 4).map(c => (
              <div key={c.id} style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{c.name}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              Links Úteis
            </div>
            {['Como se inscrever', 'Histórias de alunos', 'Pesquisa de interesse', 'Avaliação'].map(l => (
              <div key={l} style={{ fontSize: 13, color: '#475569', marginBottom: 8 }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
              Contato
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              <div>📍 Av. Marechal Mascarenhas de Moraes, 1927</div>
              <div>Bento Ferreira, Vitória — ES · CEP 29.050-945</div>
              <div style={{ marginTop: 8 }}><a href="https://www.vitoria.es.gov.br/contato" target="_blank" rel="noreferrer" style={{ color: '#94a3b8' }}>Fale com a Prefeitura ↗</a></div>
              <div><a href="https://vixcursos.vitoria.es.gov.br" target="_blank" rel="noreferrer" style={{ color: '#94a3b8' }}>Portal VixCursos ↗</a></div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          paddingTop: 20, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 12, color: '#334155' }}>
            © 2026 Prefeitura Municipal de Vitória — Todos os direitos reservados
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="https://www.vitoria.es.gov.br/cidadao/acessibilidade" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#64748b' }}>Acessibilidade</a>
            <a href="https://transparencia.vitoria.es.gov.br/" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#64748b' }}>Transparência</a>
            <a href="/admin" style={{ fontSize: 12, color: '#64748b' }}>Área administrativa</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeSection, setActiveSection] = useState('home')
  const [courses, setCourses] = useState<Course[]>(COURSES)
  const [enrollmentOpen, setEnrollmentOpen] = useState<Course | null>(null)
  const [noticeOpen, setNoticeOpen] = useState<Course | null>(null)
  const [studentToken, setStudentToken] = useState(() => localStorage.getItem('student-token') || '')
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [enrollmentProfile, setEnrollmentProfile] = useState<EnrollmentProfile | null>(null)

  useEffect(() => {
    getJson<{ courses: Course[] }>('/api/courses').then(result => setCourses(result.courses)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!studentToken) { setStudent(null); setEnrollmentProfile(null); return }
    getJson<{ user: StudentProfile }>('/api/auth/me', studentToken).then(result => setStudent(result.user)).catch(() => { localStorage.removeItem('student-token'); setStudentToken(''); setStudent(null) })
    getJson<{ profile: EnrollmentProfile }>('/api/student/enrollment-profile', studentToken).then(result => setEnrollmentProfile(result.profile)).catch(() => setEnrollmentProfile(null))
  }, [studentToken])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveSection(e.target.id || 'home')
        })
      },
      { threshold: 0.3 }
    )
    document.querySelectorAll('section[id]').forEach(s => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <CoursesContext.Provider value={courses}><div style={{ minHeight: '100vh', background: '#0a0b14' }}>
      {enrollmentOpen && <EnrollmentModal course={enrollmentOpen} student={student} profile={enrollmentProfile} token={studentToken} onClose={() => setEnrollmentOpen(null)} />}
      {noticeOpen && <AvailabilityNoticeModal course={noticeOpen} profile={enrollmentProfile} token={studentToken} onClose={() => setNoticeOpen(null)} />}
      <a className="skip-link" href="#conteudo">Ir para o conteúdo principal</a>
      <GovernmentBar />
      <Navbar activeSection={activeSection} />
      <Hero />
      <PopularSection />
      <CoursesSection onEnroll={setEnrollmentOpen} onNotify={setNoticeOpen} />
      <EnrollSection />
      <TestimonialsSection />
      <InterestSurvey />
      <SatisfactionSurvey />
      <Footer />
      <ChatBot onEnroll={setEnrollmentOpen} onNotify={setNoticeOpen} />
    </div></CoursesContext.Provider>
  )
}
