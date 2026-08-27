import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { getJson, postJson } from './api'

// ─── Types ────────────────────────────────────────────────────────────────────

type CourseStatus = 'abertas' | 'ultimas-vagas' | 'breve'
type Periodo = 'Diurno' | 'Vespertino' | 'Noturno'
type IndicadoPara = 'primeiro-emprego' | 'empreender' | 'mudanca-profissao' | 'atualizacao'

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="17" stroke="#3b82f6" strokeWidth="1.5" fill="rgba(59,130,246,0.08)" />
        <circle cx="18" cy="18" r="11" stroke="#f97316" strokeWidth="1" fill="none" />
        {[0,45,90,135,180,225,270,315].map((a,i) => (
          <line
            key={i}
            x1="18" y1="18"
            x2={18 + 14 * Math.cos(a * Math.PI / 180)}
            y2={18 + 14 * Math.sin(a * Math.PI / 180)}
            stroke="#3b82f6" strokeWidth="1" opacity="0.5"
          />
        ))}
        <circle cx="18" cy="18" r="4" fill="#f97316" />
        <circle cx="18" cy="18" r="2" fill="#fff" />
      </svg>
      <div>
        <div style={{ fontSize: 9, letterSpacing: '0.15em', color: '#94a3b8', textTransform: 'uppercase', lineHeight: 1 }}>
          Prefeitura de
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.04em', lineHeight: 1.2 }}>
          Vitória — ES
        </div>
      </div>
    </div>
  )
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

        {/* Video iframe */}
        <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${course.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={`Apresentação — ${course.name}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none',
            }}
          />
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

function EnrollmentModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const targetClass = course.classes?.find(item => item.status === 'OPEN')
  const [form, setForm] = useState({ name: '', email: '', cpf: '', phone: '', district: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('')
    try {
      const result = await postJson<{ message: string }>('/api/enrollments', { ...form, classId: targetClass?.id })
      setMessage(result.message)
    } catch (requestError) { setError(requestError instanceof Error ? requestError.message : 'Não foi possível realizar a inscrição.') }
    finally { setLoading(false) }
  }
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(0,0,0,.86)', display: 'grid', placeItems: 'center', padding: 20 }}>
    <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 520, background: '#111219', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: 28 }}>
      <button onClick={onClose} style={{ float: 'right', background: 'none', border: 0, color: '#94a3b8', cursor: 'pointer', fontSize: 20 }}>×</button>
      <h2 style={{ color: '#fff', marginTop: 0 }}>Inscrição — {course.name}</h2>
      {message ? <div style={{ color: '#4ade80', padding: 24, textAlign: 'center' }}>{message}</div> : <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
        {[['name','Nome completo'],['email','E-mail'],['cpf','CPF'],['phone','WhatsApp'],['district','Bairro']].map(([key,label]) => <input key={key} type={key === 'email' ? 'email' : 'text'} required placeholder={label} value={form[key as keyof typeof form]} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} style={{ padding: 12, borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', background: 'rgba(255,255,255,.04)', color: '#fff' }} />)}
        <button disabled={loading || !targetClass} style={{ padding: 12, border: 0, borderRadius: 9, background: course.chatColor, color: '#fff', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Enviando…' : targetClass ? 'Confirmar inscrição gratuita' : 'Turma indisponível'}</button>
        {error && <p role="alert" style={{ color: '#f87171', margin: 0 }}>{error}</p>}
      </form>}
    </div>
  </div>
}

function CourseCard({ course, onVideoOpen, onEnroll }: { course: Course; onVideoOpen: () => void; onEnroll: () => void }) {
  const pct = Math.min(95, Math.round((course.inscritos / (course.vagas * 28)) * 100))

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
            onClick={onEnroll}
            style={{
              padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: course.status === 'breve' ? 'rgba(255,255,255,0.05)' : `${course.chatColor}`,
              color: course.status === 'breve' ? '#475569' : '#fff',
              fontWeight: 700, fontSize: 12.5, letterSpacing: '0.02em',
              whiteSpace: 'nowrap', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => { if (course.status !== 'breve') e.currentTarget.style.opacity = '0.86' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {course.status === 'breve' ? 'Avise-me' : 'Inscrever-se — Grátis'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ChatBot() {
  const courses = useCourses()
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

  const reset = () => {
    setChat({ step: 'objetivo', objetivo: '', area: '', periodo: '', results: [], theme: '#f97316' })
    setMessages([{ role: 'bot', text: CHATBOT_STEPS.objetivo.question }])
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
          width: 56, height: 56, borderRadius: '50%',
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
        {open ? '✕' : '🤖'}
      </button>

      {/* Panel */}
      {open && (
        <div
          className="animate-slide-in"
          style={{
            position: 'fixed', bottom: 92, right: 24, zIndex: 99,
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
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}99)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              🎓
            </div>
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
        </div>
      )}
    </>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

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
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
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
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: '#f97316', letterSpacing: '-0.01em' }}>
              Vix
            </span>
          </div>
        </div>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
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
  const [imgIndex, setImgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setImgIndex(i => (i + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section style={{ position: 'relative', height: '100vh', minHeight: 600, overflow: 'hidden' }}>
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

        <h1 style={{
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
            { value: '8', label: 'Cursos disponíveis', color: '#f97316' },
            { value: '7.831', label: 'Alunos matriculados', color: '#3b82f6' },
            { value: '100%', label: 'Gratuito — sem taxas', color: '#22c55e' },
            { value: '4 bairros', label: 'Polos em Vitória', color: '#f97316' },
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

function CoursesSection() {
  const [videoOpen, setVideoOpen] = useState<Course | null>(null)
  const [enrollmentOpen, setEnrollmentOpen] = useState<Course | null>(null)
  const courses = useCourses()
  const sorted = [...courses].sort((a, b) => b.inscritos - a.inscritos)

  return (
    <section id="cursos" style={{ padding: '80px 24px' }}>
      {videoOpen && <VideoModal course={videoOpen} onClose={() => setVideoOpen(null)} />}
      {enrollmentOpen && <EnrollmentModal course={enrollmentOpen} onClose={() => setEnrollmentOpen(null)} />}

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
              onEnroll={() => course.status === 'breve' ? document.getElementById('pesquisa')?.scrollIntoView() : setEnrollmentOpen(course)}
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
      desc: 'Preencha o formulário online com seus dados pessoais. Você precisará de RG, CPF e comprovante de residência em Vitória.',
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

        {/* Requirements */}
        <div style={{
          marginTop: 40, padding: '24px 28px',
          background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)',
          borderRadius: 14, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6', marginBottom: 6 }}>📋 Documentos necessários</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>
              RG ou CNH · CPF · Comprovante de residência em Vitória · Foto 3×4
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <a
              href="#cursos"
              style={{
                padding: '10px 24px', borderRadius: 10,
                background: '#3b82f6', color: '#fff',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}
            >
              Escolher um curso
            </a>
          </div>
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
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: '#f97316' }}>Vix</span>
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
              <div>📍 Av. Marechal Mascarenhas de Moraes</div>
              <div>Vitória, ES — CEP 29.050-015</div>
              <div style={{ marginTop: 8 }}>☎️ (27) 3383-5000</div>
              <div>🌐 vitoria.es.gov.br</div>
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
            {['Termos de Uso', 'Privacidade', 'Acessibilidade'].map(l => (
              <span key={l} style={{ fontSize: 12, color: '#334155', cursor: 'pointer' }}>{l}</span>
            ))}
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

  useEffect(() => {
    getJson<{ courses: Course[] }>('/api/courses').then(result => setCourses(result.courses)).catch(() => {})
  }, [])

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
      <Navbar activeSection={activeSection} />
      <Hero />
      <PopularSection />
      <CoursesSection />
      <EnrollSection />
      <TestimonialsSection />
      <InterestSurvey />
      <SatisfactionSurvey />
      <Footer />
      <ChatBot />
    </div></CoursesContext.Provider>
  )
}
