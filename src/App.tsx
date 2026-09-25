import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react'
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
  microResumo: string
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

// Paleta categórica QualificaVix: cada área de formação tem UMA cor, definida
// uma única vez aqui e propagada para os cursos via `chatColor` (ver abaixo).
// Isso corrige uma inconsistência do código anterior, em que cada curso
// definia sua própria cor solta — dois cursos da mesma área podiam ter
// cores diferentes. Agora a cor é 100% derivada da área (fonte única).
const AREA_THEMES: Record<string, string> = {
  tecnologia: '#0891B2',   // Azul-petróleo
  criatividade: '#7C3AED', // Violeta
  negocios: '#059669',     // Esmeralda
  gastronomia: '#EA580C',  // Laranja-queimado
  construcao: '#D97706',   // Âmbar
  marketing: '#DB2777',    // Magenta
  moda: '#C026D3',         // Fúcsia
}

const RAW_COURSES: Omit<Course, 'chatColor'>[] = [
  {
    id: 'prog-web',
    name: 'Programação Web',
    area: 'Tecnologia',
    areaKey: 'tecnologia',
    image: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=480&fit=crop&auto=format',
    videoId: 'UB1O30fR-EE',
    microResumo: 'Do zero ao primeiro projeto publicado.',
    synopse: 'HTML, CSS, JavaScript e React do zero. Projetos práticos e portfólio ao final do curso.',
    status: 'abertas',
    duracao: '4 meses',
    periodo: 'Noturno',
    cargaHoraria: 160,
    inscritos: 1247,
    vagas: 40,
    indicadoPara: ['primeiro-emprego', 'mudanca-profissao'],
    mediaSalarial: 'R$ 3.200 – R$ 6.500',
  },
  {
    id: 'design-grafico',
    name: 'Design Gráfico',
    area: 'Criatividade',
    areaKey: 'criatividade',
    image: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=480&fit=crop&auto=format',
    videoId: '_9mTJ84uL1Q',
    microResumo: 'Crie peças profissionais em semanas.',
    synopse: 'Canva, Photoshop e Illustrator para criar identidades visuais e peças para redes sociais.',
    status: 'ultimas-vagas',
    duracao: '3 meses',
    periodo: 'Vespertino',
    cargaHoraria: 120,
    inscritos: 932,
    vagas: 40,
    indicadoPara: ['primeiro-emprego', 'empreender', 'mudanca-profissao'],
    mediaSalarial: 'R$ 2.400 – R$ 5.000',
  },
  {
    id: 'gestao-empresarial',
    name: 'Gestão Empresarial',
    area: 'Negócios',
    areaKey: 'negocios',
    image: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=480&fit=crop&auto=format',
    videoId: 'NU_1StN5Tkk',
    microResumo: 'Estruture e faça seu negócio crescer.',
    synopse: 'Planejamento estratégico, finanças e liderança para quem quer abrir ou crescer no próprio negócio.',
    status: 'abertas',
    duracao: '5 meses',
    periodo: 'Diurno',
    cargaHoraria: 200,
    inscritos: 789,
    vagas: 35,
    indicadoPara: ['empreender', 'atualizacao'],
    mediaSalarial: 'R$ 4.000 – R$ 9.000',
  },
  {
    id: 'gastronomia',
    name: 'Gastronomia e Culinária',
    area: 'Gastronomia',
    areaKey: 'gastronomia',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=480&fit=crop&auto=format',
    videoId: 'pCZSZZTNuc4',
    microResumo: 'Da cozinha de casa à profissional.',
    synopse: 'Da técnica básica à alta culinária com chefs experientes. Higiene alimentar e gestão de cozinha.',
    status: 'breve',
    duracao: '3 meses',
    periodo: 'Diurno',
    cargaHoraria: 120,
    inscritos: 1103,
    vagas: 30,
    indicadoPara: ['primeiro-emprego', 'empreender'],
    mediaSalarial: 'R$ 2.000 – R$ 4.500',
  },
  {
    id: 'eletricista',
    name: 'Eletricista Predial',
    area: 'Construção Civil',
    areaKey: 'construcao',
    image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=480&fit=crop&auto=format',
    videoId: 'NeQY0lrXMH8',
    microResumo: 'Instalações elétricas com segurança.',
    synopse: 'Instalações elétricas conforme ABNT. Segurança elétrica e práticas completas em laboratório.',
    status: 'abertas',
    duracao: '2 meses',
    periodo: 'Noturno',
    cargaHoraria: 80,
    inscritos: 654,
    vagas: 25,
    indicadoPara: ['primeiro-emprego', 'mudanca-profissao'],
    mediaSalarial: 'R$ 2.800 – R$ 5.500',
  },
  {
    id: 'marketing-digital',
    name: 'Marketing Digital',
    area: 'Marketing',
    areaKey: 'marketing',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=480&fit=crop&auto=format',
    videoId: 'nU-IIXBWlS4',
    microResumo: 'Venda mais usando o digital a favor.',
    synopse: 'Google Ads, SEO, redes sociais e métricas. Aprenda a alavancar negócios no ambiente digital.',
    status: 'ultimas-vagas',
    duracao: '3 meses',
    periodo: 'Vespertino',
    cargaHoraria: 120,
    inscritos: 1456,
    vagas: 40,
    indicadoPara: ['empreender', 'atualizacao', 'mudanca-profissao'],
    mediaSalarial: 'R$ 2.800 – R$ 6.000',
  },
  {
    id: 'assistente-adm',
    name: 'Assistente Administrativo',
    area: 'Administração',
    areaKey: 'negocios',
    image: 'https://images.unsplash.com/photo-1555725305-e823b44548de?w=800&h=480&fit=crop&auto=format',
    videoId: 'OvKCESe3VlM',
    microResumo: 'Rotinas de escritório sem mistério.',
    synopse: 'Excel avançado, rotinas administrativas, documentos e comunicação corporativa.',
    status: 'abertas',
    duracao: '2 meses',
    periodo: 'Diurno',
    cargaHoraria: 80,
    inscritos: 2108,
    vagas: 50,
    indicadoPara: ['primeiro-emprego', 'atualizacao'],
    mediaSalarial: 'R$ 1.800 – R$ 3.200',
  },
  {
    id: 'costura-moda',
    name: 'Costura e Moda',
    area: 'Moda',
    areaKey: 'moda',
    image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=480&fit=crop&auto=format',
    videoId: 'xq_sYLHMGHY',
    microResumo: 'Da modelagem à sua própria coleção.',
    synopse: 'Modelagem, montagem de peças e criação de coleções. Como montar seu próprio ateliê.',
    status: 'breve',
    duracao: '4 meses',
    periodo: 'Vespertino',
    cargaHoraria: 160,
    inscritos: 543,
    vagas: 20,
    indicadoPara: ['primeiro-emprego', 'empreender', 'mudanca-profissao'],
    mediaSalarial: 'R$ 1.800 – R$ 3.800',
  },
]

// Fonte única de verdade: a cor de cada curso vem sempre da sua área.
const COURSES: Course[] = RAW_COURSES.map(course => ({ ...course, chatColor: AREA_THEMES[course.areaKey] }))

// Banner da Home: em vez de fotos genéricas de banco de imagens sem relação
// com o conteúdo, o carrossel usa as fotos reais dos cursos em destaque —
// o visitante já entende, no primeiro segundo, "que tipo de curso" existe
// aqui, e a legenda linka direto para aquele curso.
const HERO_SLIDES = [...COURSES]
  .sort((a, b) => b.inscritos - a.inscritos)
  .slice(0, 5)
  .map(c => ({
    image: c.image.replace('w=800&h=480', 'w=1920&h=1080'),
    courseId: c.id,
    courseName: c.name,
    area: c.area,
    color: c.chatColor,
  }))

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

// ─── Stories (estilo Instagram) ────────────────────────────────────────────
// Estrutura pensada para 3 tipos de conteúdo dinâmico: avisos da equipe,
// destaques de cursos e depoimentos — todos remontados a partir dos dados
// que a página já tem (COURSES, TESTIMONIALS), sem duplicar informação.
type StorySlide = {
  id: string
  eyebrow: string
  title: string
  body: string
  image: string
  accent: string
  cta: { label: string; href: string }
}
type StoryGroup = {
  id: string
  label: string
  avatarImage?: string
  avatarEmoji?: string
  ring: string
  slides: StorySlide[]
}

const STORY_ANNOUNCEMENTS: StorySlide[] = [
  {
    id: 'aviso-abertas', eyebrow: '📣 Aviso', title: 'Novas turmas abertas',
    body: 'Programação Web, Gestão Empresarial, Eletricista Predial e Assistente Administrativo estão com inscrições abertas agora.',
    image: COURSES.find(c => c.id === 'prog-web')!.image, accent: '#FF6B57',
    cta: { label: 'Ver cursos abertos', href: '#cursos' },
  },
  {
    id: 'aviso-vagas', eyebrow: '⏳ Últimas vagas', title: 'Não deixe para depois',
    body: 'Design Gráfico e Marketing Digital estão quase lotando. Se você já pensava em se inscrever, esta é a hora.',
    image: COURSES.find(c => c.id === 'design-grafico')!.image, accent: '#D97706',
    cta: { label: 'Garantir minha vaga', href: '#curso-design-grafico' },
  },
  {
    id: 'aviso-breve', eyebrow: '🔔 Em breve', title: 'Gastronomia e Costura & Moda',
    body: 'Duas turmas novas abrem em breve. Deixe seu contato cadastrado para ser avisado assim que a inscrição abrir.',
    image: COURSES.find(c => c.id === 'gastronomia')!.image, accent: '#7C3AED',
    cta: { label: 'Quero ser avisado', href: '#curso-gastronomia' },
  },
]

const STORY_GROUPS: StoryGroup[] = [
  { id: 'avisos', label: 'Avisos', avatarEmoji: '📣', ring: 'linear-gradient(135deg,#FF6B57,#DB2777)', slides: STORY_ANNOUNCEMENTS },
  ...[...COURSES].sort((a, b) => b.inscritos - a.inscritos).slice(0, 4).map((c): StoryGroup => ({
    id: `curso-${c.id}`,
    label: c.name.split(' ')[0],
    avatarImage: c.image,
    ring: `linear-gradient(135deg, ${c.chatColor}, ${c.chatColor}90)`,
    slides: [{
      id: c.id, eyebrow: c.area, title: c.name, body: c.microResumo,
      image: c.image, accent: c.chatColor, cta: { label: 'Ver curso completo', href: `#curso-${c.id}` },
    }],
  })),
  {
    id: 'depoimentos', label: 'Histórias', avatarEmoji: '💬', ring: 'linear-gradient(135deg,#7C3AED,#0891B2)',
    slides: TESTIMONIALS.map((t): StorySlide => ({
      id: t.name, eyebrow: t.occupation, title: t.name, body: t.text,
      image: t.photo, accent: '#7C3AED', cta: { label: 'Ver todas as histórias', href: '#historias' },
    })),
  },
]
const STATUS_CONFIG: Record<CourseStatus, { label: string; color: string; bg: string }> = {
  abertas: { label: 'Inscrições Abertas', color: '#0F7A38', bg: '#FFFFFF' },
  'ultimas-vagas': { label: 'Últimas Vagas!', color: '#A15C04', bg: '#FFFFFF' },
  breve: { label: 'Início em Breve', color: '#0A5E66', bg: '#FFFFFF' },
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

// ─── Sub-components ───────────────────────────────────────────────────────────

// O brasão de Vitória (PNG transparente) aparece ao lado do logotipo
// "QualificaVix" — reforça, visualmente, que este é um serviço oficial da
// Prefeitura, não um produto privado. Se o arquivo não carregar por algum
// motivo, cai graciosamente em um selo de texto (nunca um ícone quebrado).
function PrefeituraLogo({ size = 52 }: { size?: number }) {
  const [broken, setBroken] = useState(false)
  if (broken) {
    return (
      <a href="https://www.vitoria.es.gov.br/" target="_blank" rel="noreferrer" aria-label="Acessar o portal da Prefeitura de Vitória" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size, borderRadius: '50%',
        background: '#0A5E66', border: '1.5px solid rgba(255,255,255,0.5)',
        color: '#fff', fontWeight: 800, fontSize: size * 0.34, textDecoration: 'none', flexShrink: 0,
      }}>
        PMV
      </a>
    )
  }
  return (
    <a href="https://www.vitoria.es.gov.br/" target="_blank" rel="noreferrer" aria-label="Acessar o portal da Prefeitura de Vitória" style={{ display: 'block', lineHeight: 0, flexShrink: 0 }}>
      <img
        src="/assets/brasao-vitoria-header.png"
        alt="Brasão da Prefeitura Municipal de Vitória"
        style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
        onError={() => setBroken(true)}
      />
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
      fontSize: 16, fontWeight: 600, letterSpacing: '0.03em',
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
          background: '#0A2B3D',
          borderRadius: 20,
          border: `1px solid ${course.chatColor}40`,
          overflow: 'hidden',
          boxShadow: `0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px ${course.chatColor}25`,
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 22px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div>
            <div style={{ fontSize: 15, color: course.chatColor, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Apresentação do Curso
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{course.name}</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar vídeo"
            style={{
              background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8,
              width: 40, height: 40, color: '#C5D2DB', cursor: 'pointer', fontSize: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#C5D2DB' }}
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
          display: 'flex', padding: '14px 22px', gap: 26,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap',
        }}>
          {[
            { label: 'Duração', value: course.duracao },
            { label: 'Carga', value: `${course.cargaHoraria}h` },
            { label: 'Período', value: course.periodo },
            { label: 'Salário médio', value: course.mediaSalarial, accent: true },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontSize: 14, color: '#8FA3B3', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{s.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: s.accent ? course.chatColor : '#fff', marginTop: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Modal de detalhes do curso: abre ao clicar em qualquer parte do card
// (exceto a miniatura de vídeo e o botão de ação, que têm rota própria) e
// mostra a sinopse COMPLETA — o card em si só tem espaço para um
// micro-resumo de uma linha, então quem quer se aprofundar clica e lê aqui,
// sem precisar sair da página nem adivinhar que existe mais informação.
function CourseDetailModal({ course, onClose, onWatchVideo, onEnroll, onNotify }: { course: Course; onClose: () => void; onWatchVideo: () => void; onEnroll: () => void; onNotify: () => void }) {
  const hasOpenClass = Boolean(course.classes?.some(item => item.status === 'OPEN'))
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15,23,42,.6)', display: 'grid', placeItems: 'center', padding: 20 }}>
      <div
        onClick={e => e.stopPropagation()}
        className="animate-slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        style={{
          width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto',
          background: '#FFFFFF', borderRadius: 22, border: '1px solid #E2E7EE',
          boxShadow: '0 24px 60px rgba(15,23,42,.35)',
        }}
      >
        <div onClick={onWatchVideo} style={{ position: 'relative', height: 220, cursor: 'pointer', flexShrink: 0 }}>
          <img src={course.image} alt={course.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,11,20,0.75) 0%, transparent 55%)' }} />
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            aria-label="Fechar detalhes do curso"
            style={{
              position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
              border: 'none', borderRadius: 8, width: 38, height: 38, color: '#fff', cursor: 'pointer', fontSize: 20,
            }}
          >✕</button>
          <div style={{
            position: 'absolute', bottom: 14, left: 14, right: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
              borderRadius: 999, padding: '6px 14px', color: '#fff', fontWeight: 700, fontSize: 15,
            }}>▶ Assistir apresentação</span>
            <StatusBadge status={course.status} />
          </div>
        </div>

        <div style={{ padding: '26px 28px 28px' }}>
          <div style={{ fontSize: 14, color: course.chatColor, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 6 }}>
            {course.area}
          </div>
          <h2 id="detail-modal-title" style={{ fontFamily: "'Fraunces', serif", fontSize: 28, fontWeight: 600, color: '#0F172A', margin: '0 0 6px' }}>
            {course.name}
          </h2>
          <p style={{ fontSize: 17, fontWeight: 600, color: course.chatColor, margin: '0 0 16px' }}>{course.microResumo}</p>

          {/* Sinopse completa — só aparece aqui, na modal */}
          <p style={{ fontSize: 17, color: '#334155', lineHeight: 1.7, margin: '0 0 22px' }}>{course.synopse}</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 22 }}>
            {[
              { label: 'Duração', value: course.duracao },
              { label: 'Período', value: course.periodo },
              { label: 'Carga horária', value: `${course.cargaHoraria}h` },
              { label: 'Inscritos', value: course.inscritos.toLocaleString('pt-BR') },
            ].map(s => (
              <div key={s.label} style={{ background: '#F5F7FA', borderRadius: 12, padding: '12px 14px' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {course.indicadoPara.map(ip => (
              <span key={ip} style={{
                fontSize: 14, padding: '5px 12px', borderRadius: 999, fontWeight: 600,
                background: `${course.chatColor}16`, color: course.chatColor, border: `1px solid ${course.chatColor}30`,
              }}>
                {INDICADO_LABELS[ip]}
              </span>
            ))}
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
            paddingTop: 20, borderTop: '1px solid #E4E9F0',
          }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontSize: 13, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Salário médio</div>
              <div style={{ fontSize: 21, fontWeight: 700, color: course.chatColor }}>{course.mediaSalarial}</div>
            </div>
            <button onClick={onWatchVideo} style={{ ...enrollmentButton, background: '#0F172A', flex: '0 0 auto' }}>▶ Ver vídeo</button>
            <button onClick={hasOpenClass ? onEnroll : onNotify} style={{ ...enrollmentButton, background: course.chatColor, flex: '0 0 auto' }}>
              {hasOpenClass ? 'Inscrever-se — Grátis' : 'Avise-me'}
            </button>
          </div>
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
  return <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 220, background: 'rgba(20,28,36,.7)', display: 'grid', placeItems: 'center', padding: 20 }}>
    <div onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', background: '#FFFFFF', border: '1px solid #E2E7EE', borderRadius: 20, padding: 30, boxShadow: '0 24px 60px rgba(20,28,36,.35)' }}>
      <button onClick={onClose} aria-label="Fechar formulário" style={{ float: 'right', background: '#EEF1F5', border: 0, borderRadius: 8, width: 36, height: 36, color: '#334155', cursor: 'pointer', fontSize: 22 }}>×</button>
      <h2 style={{ color: '#0F172A', marginTop: 0, fontFamily: "'Fraunces', serif", fontWeight: 600 }}>Inscrição — {course.name}</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, fontWeight: 700 }}><span style={{ color: step === 1 ? '#0A5E66' : '#64748B' }}>1. Contato</span><span style={{ color: '#CBD5E1' }}>›</span><span style={{ color: step === 2 ? '#0A5E66' : '#64748B' }}>2. Matrícula</span></div>
      {message ? <div style={{ color: '#0F7A38', padding: 24, textAlign: 'center', fontSize: 18, fontWeight: 600 }}>{message}</div> : step === 1 ? <form onSubmit={event => { event.preventDefault(); setStep(2) }} style={{ display: 'grid', gap: 12 }}>
        {student ? <div style={{...termBox,borderColor:'#A9E8C1',background:'#E7F8ED',color:'#0F7A38'}}>✓ Usaremos os dados já cadastrados na sua conta. Você só precisa completar o que faltar.</div> : <div style={termBox}>Já possui cadastro? <a href="/estudante" style={{color:'#0A5E66',fontWeight:700}}>Entre na Área do Estudante</a> para aproveitar automaticamente seus dados.</div>}
        {profile?.phone ? <div style={{...termBox,borderColor:'#A9E8C1',background:'#E7F8ED'}}><strong style={{color:'#0F7A38'}}>Dados de contato encontrados</strong><div style={{marginTop:7,color:'#0F172A'}}>{form.name}<br />{form.email}<br />{form.phone}</div><small style={{display:'block',marginTop:8,color:'#475569'}}>Confira seus dados na etapa final antes de concluir.</small></div> : [['name','Nome completo','text'],['email','E-mail','email'],['phone','Telefone','tel']].map(([key,label,type]) => { const accountField=Boolean(student && (key==='name'||key==='email')); return <label key={key} style={enrollmentLabel}>{label}<input type={type} required readOnly={accountField} value={String(form[key as keyof typeof form])} onChange={event => setForm(previous => ({ ...previous, [key]: event.target.value }))} style={accountField?readOnlyAddressInput:enrollmentInput} /></label> })}
        <button disabled={!targetClass} style={{ ...enrollmentButton, background: course.chatColor }}>{targetClass ? 'Avançar' : 'Turma indisponível'}</button>
      </form> : <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        {hasReusableEnrollment ? <div style={{...termBox,borderColor:'#A9E8C1',background:'#E7F8ED'}}><strong style={{color:'#0F7A38'}}>Resumo dos dados para confirmação</strong><p style={{margin:'8px 0 0',lineHeight:1.6}}>Usaremos seus dados cadastrados, incluindo CPF, vínculo com Vitória, endereço e informações de perfil. Nenhuma informação será solicitada novamente.</p><p style={{margin:'8px 0 0',color:'#0F172A'}}><strong>Curso:</strong> {course.name}<br /><strong>Contato:</strong> {form.name} · {form.phone}</p></div> : <>
        <label style={enrollmentLabel}>Vínculo com Vitória<select required value={form.eligibilityType} onChange={event => setForm({ ...form, eligibilityType: event.target.value })} style={enrollmentInput}><option value="RESIDENT">Resido em Vitória</option><option value="WORKER">Trabalho em Vitória</option></select></label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label style={enrollmentLabel}>CPF<input required value={form.cpf} onChange={e => setForm({...form,cpf:e.target.value})} style={enrollmentInput}/></label>{form.eligibilityType === 'RESIDENT' ? <label style={enrollmentLabel}>CEP residencial<input required inputMode="numeric" maxLength={9} value={form.cep} onChange={e => { const digits=e.target.value.replace(/\D/g,'').slice(0,8); setForm({...form,cep:digits.length>5?`${digits.slice(0,5)}-${digits.slice(5)}`:digits}) }} style={{...enrollmentInput,borderColor:cepResult?.eligible?'#16A34A':cepError?'#DC2626':undefined}} placeholder="29000-000"/><small aria-live="polite" style={{color:cepLoading?'#0A5E66':cepResult?.eligible?'#0F7A38':'#B91C1C', fontWeight:600}}>{cepLoading?'Consultando CEP…':cepResult?.eligible?'✓ CEP válido para Vitória/ES':cepError}</small></label> : <label style={enrollmentLabel}>CNPJ da empresa<input required value={form.cnpj} onChange={e => setForm({...form,cnpj:e.target.value})} style={enrollmentInput}/></label>}</div>
        {form.eligibilityType === 'RESIDENT' && cepResult && <fieldset style={{...termBox,borderColor:cepResult.eligible?'#A9E8C1':'#FECACA',background:cepResult.eligible?'#E7F8ED':'#FEE2E2',display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}><legend style={{padding:'0 7px',fontWeight:700}}>Endereço preenchido pelo CEP</legend><label style={{...enrollmentLabel,gridColumn:'1 / -1'}}>Logradouro<input readOnly value={cepResult.address.street} placeholder="Não informado pelo CEP" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Bairro<input readOnly value={cepResult.address.neighborhood} placeholder="Não informado pelo CEP" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Município<input readOnly value={cepResult.address.city} style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>UF<input readOnly value={`${cepResult.address.state} — ${cepResult.address.stateName}`} style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Região<input readOnly value={cepResult.address.region} placeholder="Não informada" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>DDD<input readOnly value={cepResult.address.ddd} placeholder="Não informado" style={readOnlyAddressInput}/></label><label style={enrollmentLabel}>Código IBGE<input readOnly value={cepResult.address.ibge} placeholder="Não informado" style={readOnlyAddressInput}/></label><label style={{...enrollmentLabel,gridColumn:'1 / -1'}}>Complemento do CEP<input readOnly value={cepResult.address.complement} placeholder="Não informado pelo CEP" style={readOnlyAddressInput}/></label></fieldset>}
        {profile?.hasRgDocument ? <div style={{...termBox,borderColor:'#A9E8C1',background:'#E7F8ED',color:'#0F7A38'}}>✓ Documento de identificação já validado no seu cadastro e será reutilizado.</div> : <label style={enrollmentLabel}>Foto do RG <small style={{color:'#64748B',fontWeight:400}}>JPG, PNG ou WebP · até 5 MB</small><input type="file" accept="image/jpeg,image/png,image/webp" required onChange={e => setRgDocument(e.target.files?.[0] || null)} style={enrollmentInput}/></label>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}><label style={enrollmentLabel}>Autodeclaração de raça<select required value={form.race} onChange={e=>setForm({...form,race:e.target.value})} style={enrollmentInput}><option value="">Selecione</option><option value="PARDO">Pardo</option><option value="AMARELO">Amarelo</option><option value="BRANCO">Branco</option><option value="PRETO">Preto</option></select></label><label style={enrollmentLabel}>Data de nascimento<input type="date" required value={form.birthDate} onChange={e=>setForm({...form,birthDate:e.target.value})} style={enrollmentInput}/></label></div>
        <label style={enrollmentLabel}>Gênero<select required value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} style={enrollmentInput}><option value="">Selecione</option><option value="FEMININO">Feminino</option><option value="MASCULINO">Masculino</option><option value="NAO_BINARIO">Não binário</option><option value="OUTRO">Outro</option><option value="NAO_INFORMAR">Prefiro não informar</option></select></label>
        <label style={enrollmentLabel}>Grau de escolaridade<select required value={form.education} onChange={e=>setForm({...form,education:e.target.value})} style={enrollmentInput}><option value="">Selecione</option><option value="FUNDAMENTAL_INCOMPLETO">Fundamental incompleto</option><option value="FUNDAMENTAL_COMPLETO">Fundamental completo</option><option value="MEDIO_INCOMPLETO">Médio incompleto</option><option value="MEDIO_COMPLETO">Médio completo</option><option value="SUPERIOR_INCOMPLETO">Superior incompleto</option><option value="SUPERIOR_COMPLETO">Superior completo</option><option value="POS_GRADUACAO">Pós-graduação</option></select></label>
        <label style={enrollmentLabel}>Possui deficiência? Qual?<textarea value={form.disability} onChange={e=>setForm({...form,disability:e.target.value})} style={enrollmentInput}/></label>
        <label style={enrollmentLabel}>Necessidade de acessibilidade para as aulas<textarea value={form.accessibilityNeeds} onChange={e=>setForm({...form,accessibilityNeeds:e.target.value})} style={enrollmentInput} placeholder="Descreva os recursos necessários, caso haja."/></label>
        <label style={enrollmentLabel}>Necessidade de acompanhante nas aulas<textarea value={form.companionNeeds} onChange={e=>setForm({...form,companionNeeds:e.target.value})} style={enrollmentInput} placeholder="Descreva a necessidade, caso haja."/></label>
        </>}
        <div style={termBox}><strong>Proteção de dados — LGPD</strong><p style={termText}>Autorizo o tratamento dos meus dados pessoais e sensíveis exclusivamente para seleção, matrícula, acompanhamento pedagógico, acessibilidade e certificação. O RG será armazenado em área privada e acessível somente por pessoal autorizado.</p><label><input type="checkbox" required checked={form.lgpdAccepted} onChange={e=>setForm({...form,lgpdAccepted:e.target.checked})}/> Li e autorizo o tratamento descrito.</label></div>
        <div style={termBox}><strong>Termo de compromisso do estudante</strong><p style={termText}>Comprometo-me a fornecer informações verdadeiras, participar das atividades e cumprir a frequência mínima definida para a turma. Faltas injustificadas, abandono ou fraude podem causar cancelamento da matrícula e impedimento temporário de novas inscrições, após análise administrativa e conforme regulamentação vigente. O limite da plataforma é de 3 inscrições por CPF a cada ano.</p><label><input type="checkbox" required checked={form.commitmentAccepted} onChange={e=>setForm({...form,commitmentAccepted:e.target.checked})}/> Li e aceito o termo de compromisso.</label></div>
        <div style={{display:'flex',gap:10}}><button type="button" onClick={()=>setStep(1)} style={{...enrollmentButton,background:'#475569'}}>Voltar</button><button disabled={loading || cepLoading || (form.eligibilityType === 'RESIDENT' && !cepResult?.eligible)} style={{...enrollmentButton,background:course.chatColor,flex:1,opacity:(loading || cepLoading || (form.eligibilityType === 'RESIDENT' && !cepResult?.eligible)) ? .55 : 1}}>{loading?'Validando e enviando…':'Finalizar matrícula'}</button></div>
        {error && <p role="alert" style={{ color: '#B91C1C', margin: 0, fontWeight: 600 }}>{error}</p>}
      </form>}
    </div>
  </div>
}

// Estilos compartilhados dos formulários (inscrição, chatbot etc.) — claros,
// com bordas visíveis e áreas de toque generosas (min. 44px de altura),
// pensados para quem preenche formulários oficiais com menos frequência.
const enrollmentInput: React.CSSProperties = { padding: 13, borderRadius: 9, border: '1.5px solid #CBD5E1', background: '#FFFFFF', color: '#0F172A', fontFamily: 'inherit', fontSize: 17, minHeight: 46 }
const readOnlyAddressInput: React.CSSProperties = { ...enrollmentInput, background: '#EEF1F5', color: '#475569', cursor: 'not-allowed' }
const enrollmentLabel: React.CSSProperties = { display: 'grid', gap: 6, color: '#334155', fontSize: 16, fontWeight: 600 }
const enrollmentButton: React.CSSProperties = { padding: 13, border: 0, borderRadius: 10, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 17, minHeight: 46 }
const termBox: React.CSSProperties = { padding: 16, border: '1px solid #BAE6FD', borderRadius: 12, background: '#E0F2FE', color: '#0F172A', fontSize: 16, lineHeight: 1.55 }
const termText: React.CSSProperties = { color: '#334155', lineHeight: 1.55, margin: '8px 0 12px' }

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

  return <div onClick={onClose} style={{position:'fixed',inset:0,zIndex:210,background:'rgba(20,28,36,.65)',display:'grid',placeItems:'center',padding:20}}>
    <div onClick={event=>event.stopPropagation()} className="animate-slide-in" style={{width:'100%',maxWidth:460,background:'#FFFFFF',border:'1px solid #E2E7EE',borderRadius:20,padding:28,color:'#0F172A',boxShadow:'0 24px 60px rgba(20,28,36,.3)'}}>
      <button onClick={onClose} aria-label="Fechar" style={{float:'right',background:'#EEF1F5',border:0,borderRadius:8,width:36,height:36,color:'#334155',fontSize: 22,cursor:'pointer'}}>×</button>
      <div style={{fontSize:30,marginBottom:10}}>🔔</div>
      <h2 style={{margin:'0 0 8px',fontSize: 24,color:'#0F172A',fontFamily:"'Fraunces', serif",fontWeight:600}}>Avise-me quando estiver disponível</h2>
      <p style={{margin:'0 0 20px',color:'#475569',lineHeight:1.55}}>Receba um aviso quando <strong style={{color:'#0F172A'}}>{course.name}</strong> voltar a aceitar inscrições.</p>
      {message ? <div style={{...termBox,borderColor:'#A9E8C1',background:'#E7F8ED',color:'#0F7A38'}}>{message}</div> : <form onSubmit={submit} style={{display:'grid',gap:14}}>
        {savedPhone && !editing ? <>
          <div style={termBox}>Podemos avisar você pelo telefone:<br /><strong style={{display:'block',fontSize: 21,color:'#0F172A',marginTop:6}}>{savedPhone}</strong></div>
          <p style={{margin:0,color:'#334155'}}>Este número continua correto?</p>
          <div style={{display:'flex',gap:10}}><button type="submit" disabled={loading} style={{...enrollmentButton,background:'#0A5E66',flex:1}}>{loading?'Salvando…':'Sim, está correto'}</button><button type="button" onClick={()=>setEditing(true)} style={{...enrollmentButton,background:'#475569',flex:1}}>Alterar número</button></div>
        </> : <>
          <label style={enrollmentLabel}>Telefone<input autoFocus required type="tel" value={phone} onChange={event=>setPhone(event.target.value)} placeholder="(27) 99999-9999" style={enrollmentInput}/></label>
          <button disabled={loading} style={{...enrollmentButton,background:'#0A5E66'}}>{loading?'Salvando…':'Avise-me'}</button>
          {savedPhone && <button type="button" onClick={()=>{setPhone(savedPhone);setEditing(false)}} style={{background:'none',border:0,color:'#0A5E66',fontWeight:700,textDecoration:'underline',cursor:'pointer'}}>Usar número cadastrado</button>}
        </>}
        {error && <p role="alert" style={{margin:0,color:'#B91C1C',fontWeight:600}}>{error}</p>}
      </form>}
    </div>
  </div>
}

function CourseCard({ course, onVideoOpen, onDetailOpen, onEnroll, onNotify }: { course: Course; onVideoOpen: () => void; onDetailOpen: () => void; onEnroll: () => void; onNotify: () => void }) {
  const pct = Math.min(95, Math.round((course.inscritos / (course.vagas * 28)) * 100))
  const hasOpenClass = Boolean(course.classes?.some(item => item.status === 'OPEN'))
  const [previewing, setPreviewing] = useState(false)
  const previewSrc = COURSE_DEMO_VIDEOS[course.id]

  return (
    <div
      id={`curso-${course.id}`}
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E7EE',
        borderRadius: 18, overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.25s',
        display: 'flex', flexDirection: 'column',
        scrollMarginTop: 130,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = `${course.chatColor}55`
        e.currentTarget.style.boxShadow = `0 10px 28px rgba(15,23,42,0.14)`
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = '#E2E7EE'
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.06)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      {/* Preview de vídeo: ao passar o mouse, a foto estática dá lugar a um
          trecho do vídeo introdutório (mudo, em loop) — dá vida ao card sem
          exigir clique. Clicar na miniatura abre a apresentação completa. */}
      <div
        onClick={e => { e.stopPropagation(); onVideoOpen() }}
        onMouseEnter={() => setPreviewing(true)}
        onMouseLeave={() => setPreviewing(false)}
        style={{ position: 'relative', height: 172, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, background: '#0F172A' }}
      >
        {previewing && previewSrc ? (
          <video
            src={previewSrc}
            autoPlay muted loop playsInline
            aria-hidden="true"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <img
            src={course.image}
            alt={course.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(to top, rgba(10,11,20,0.85) 0%, rgba(10,11,20,0.15) 55%, transparent 100%)',
        }} />

        {/* Play button — não aparece durante a prévia em vídeo */}
        {!previewing && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)',
            border: '1.5px solid rgba(255,255,255,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.2s, transform 0.2s',
            fontSize: 20, paddingLeft: 3, pointerEvents: 'none',
          }}>
            ▶
          </div>
        )}

        {/* Video label */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
          borderRadius: 6, padding: '3px 8px',
          fontSize: 15, fontWeight: 600, color: '#e2e8f0', letterSpacing: '0.04em',
          display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none',
        }}>
          <span style={{ color: '#FF6B57' }}>{previewing ? '●' : '▶'}</span> {previewing ? 'PRÉVIA' : 'VER APRESENTAÇÃO'}
        </div>

        {/* Status badge bottom right */}
        <div style={{ position: 'absolute', bottom: 10, right: 10 }}>
          <StatusBadge status={course.status} />
        </div>
      </div>

      {/* Corpo do card: 100% clicável — abre a modal de detalhes com a
          sinopse completa. Só a miniatura (vídeo) e o botão de ação (CTA)
          têm comportamento próprio e não disparam a modal. */}
      <div
        role="button"
        tabIndex={0}
        onClick={onDetailOpen}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onDetailOpen() } }}
        aria-label={`Ver detalhes do curso ${course.name}`}
        style={{ padding: '16px 20px 20px', flex: 1, display: 'flex', flexDirection: 'column', gap: 13, cursor: 'pointer' }}
      >
        {/* Title + area + micro-resumo */}
        <div>
          <div style={{ fontSize: 14, color: course.chatColor, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 4 }}>
            {course.area}
          </div>
          <div style={{ fontSize: 21, fontWeight: 700, color: '#0F172A', lineHeight: 1.25 }}>{course.name}</div>
          {/* Micro-resumo: uma linha curta e concreta, sempre visível no
              card. A sinopse completa (mais longa) fica reservada para a
              modal de detalhes, evitando poluir o card com texto demais. */}
          <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.55, margin: '6px 0 0', fontWeight: 500 }}>{course.microResumo}</p>
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
              background: '#F1F5F9', borderRadius: 7,
              padding: '5px 10px', fontSize: 15, color: '#334155', fontWeight: 600,
            }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              {s.value}
            </div>
          ))}
        </div>

        {/* Inscritos bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 15, color: '#64748B' }}>Inscritos</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: course.chatColor }}>
              {course.inscritos.toLocaleString('pt-BR')}
            </span>
          </div>
          <div style={{ height: 5, background: '#E4E9F0', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 3, width: `${pct}%`,
              background: `linear-gradient(to right, ${course.chatColor}, ${course.chatColor}bb)`,
            }} />
          </div>
        </div>

        {/* Indicado para */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {course.indicadoPara.map(ip => (
            <span key={ip} style={{
              fontSize: 14, padding: '4px 10px', borderRadius: 999, fontWeight: 600,
              background: `${course.chatColor}16`, color: course.chatColor,
              border: `1px solid ${course.chatColor}30`,
            }}>
              {INDICADO_LABELS[ip]}
            </span>
          ))}
        </div>

        {/* Salary + CTA */}
        <div style={{
          marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 10,
          paddingTop: 14, borderTop: '1px solid #E4E9F0',
        }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>Salário médio</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: course.chatColor }}>{course.mediaSalarial}</div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); (hasOpenClass ? onEnroll : onNotify)() }}
            style={{
              padding: '11px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: hasOpenClass ? `${course.chatColor}` : '#E2E7EE',
              color: hasOpenClass ? '#fff' : '#475569',
              fontWeight: 700, fontSize: 16, letterSpacing: '0.01em',
              whiteSpace: 'nowrap', transition: 'opacity 0.2s',
              minHeight: 44,
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
    theme: '#FF6B57',
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
      const theme = AREA_THEMES[value] || '#FF6B57'
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
    setChat({ step: 'objetivo', objetivo: '', area: '', periodo: '', results: [], theme: '#FF6B57' })
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
          border: 'none', cursor: 'pointer', color: '#fff', fontSize: 25,
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
        {open ? '✕' : <span className="turtle-mascot" data-area={chat.area || 'default'} style={{ position: 'relative', display: 'block', width: 64, height: 64 }}><img src="/assets/tartaruga-qualificavix.png" alt="Assistente tartaruga do QualificaVix" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none' }} />{turtleAccessory[chat.area] && <span style={{ position: 'absolute', top: -8, right: -5, fontSize: 27 }}>{turtleAccessory[chat.area]}</span>}</span>}
      </button>

      {/* Panel — painel claro: um assistente de conversa fica mais próximo e
          menos "sistema" quando parece papel/conversa, não um console técnico. */}
      {open && (
        <div
          className="animate-slide-in"
          style={{
            position: 'fixed', bottom: 104, right: 24, zIndex: 99,
            width: 380, maxWidth: 'calc(100vw - 48px)',
            background: '#FFFFFF',
            border: `1px solid ${accentColor}35`,
            borderRadius: 22,
            boxShadow: `0 20px 50px rgba(20,28,36,0.25), 0 0 0 1px ${accentColor}12`,
            display: 'flex', flexDirection: 'column', maxHeight: '72vh',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px 18px',
            background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}08)`,
            borderBottom: `1px solid ${accentColor}25`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div className="turtle-mascot" data-area={chat.area || 'default'} style={{ width: 46, height: 46, position: 'relative', flexShrink: 0 }}>
              <img src="/assets/tartaruga-qualificavix.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none' }} />
              {turtleAccessory[chat.area] && <span style={{ position: 'absolute', top: -7, right: -7, fontSize: 21 }}>{turtleAccessory[chat.area]}</span>}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#0F172A' }}>Assistente QualificaVix</div>
              <div style={{ fontSize: 15, color: accentColor, fontWeight: 600 }}>● Online agora</div>
            </div>
            <button
              onClick={reset}
              style={{
                marginLeft: 'auto', background: 'rgba(15,23,42,0.06)',
                border: 'none', borderRadius: 8, padding: '6px 12px',
                color: '#334155', fontSize: 15, fontWeight: 600, cursor: 'pointer',
                minHeight: 36,
              }}
            >
              Reiniciar
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px', background: '#F5F7FA' }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                marginBottom: 10,
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '82%', padding: '10px 14px', borderRadius: 14,
                  background: m.role === 'user'
                    ? `linear-gradient(135deg, ${accentColor}, ${accentColor}dd)`
                    : '#FFFFFF',
                  border: m.role === 'bot' ? '1px solid #E4E9F0' : 'none',
                  color: m.role === 'user' ? '#fff' : '#0F172A',
                  fontSize: 17, lineHeight: 1.55,
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
                background: '#FFFFFF',
                border: `1px solid ${c.chatColor}40`,
                borderRadius: 14, padding: 12, marginBottom: 8,
                boxShadow: '0 2px 8px rgba(15,23,42,0.05)',
              }}>
                <img src={c.image} alt={c.name} style={{ width: '100%', height: 84, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: 18, color: '#0F172A', marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 15, color: '#64748B', marginBottom: 6 }}>{c.area} · {c.cargaHoraria}h · {c.periodo}</div>
                <StatusBadge status={c.status} />
                <div style={{ marginTop: 8, fontSize: 17, color: c.chatColor, fontWeight: 700 }}>{c.mediaSalarial}</div>
                <div style={{display:'flex',gap:8,marginTop:10}}><button type="button" onClick={() => selectCourse(c)} style={{...enrollmentButton,flex:1,padding:9,background:'#475569'}}>Detalhes</button>{c.classes?.some(item => item.status === 'OPEN') ? <button type="button" onClick={() => { selectCourse(c); onEnroll(c) }} style={{...enrollmentButton,flex:1,padding:9,background:c.chatColor}}>Inscrever-se</button> : <button type="button" onClick={() => { selectCourse(c); onNotify(c) }} style={{...enrollmentButton,flex:1,padding:9,background:'#475569'}}>Avise-me</button>}</div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Options */}
          {chat.step !== 'result' && currentStep.options.length > 0 && (
            <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: 7, background: '#F5F7FA' }}>
              {currentStep.options.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleOption(opt.value, opt.label)}
                  style={{
                    padding: '11px 14px', borderRadius: 10, textAlign: 'left',
                    background: '#FFFFFF',
                    border: `1.5px solid #CBD5E1`,
                    color: '#0F172A', fontSize: 17, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                    minHeight: 44,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = `${accentColor}14`
                    e.currentTarget.style.borderColor = `${accentColor}80`
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = '#FFFFFF'
                    e.currentTarget.style.borderColor = '#CBD5E1'
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {chat.step === 'result' && (
            <div style={{ padding: '10px 14px 14px', background: '#F5F7FA' }}>
              <button
                onClick={() => window.location.hash = '#cursos'}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 10,
                  background: accentColor, color: '#fff',
                  fontWeight: 700, fontSize: 17, border: 'none', cursor: 'pointer',
                  minHeight: 44,
                }}
              >
                Ver todos os cursos
              </button>
            </div>
          )}
          <form onSubmit={submitChat} style={{display:'flex',gap:8,padding:'0 14px 14px', background: '#F5F7FA'}}>
            <input value={chatInput} onChange={event=>setChatInput(event.target.value)} placeholder="Digite sua mensagem" aria-label="Mensagem para o assistente" style={{...enrollmentInput,flex:1,padding:'11px 14px',fontSize: 17}} />
            <button type="submit" style={{...enrollmentButton,background:accentColor,padding:'11px 16px'}}>Enviar</button>
          </form>
        </div>
      )}
    </>
  )
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function GovernmentBar() {
  const [broken, setBroken] = useState(false)
  return <div style={{ position: 'fixed', inset: '0 0 auto', zIndex: 60, height: 40, background: '#0A5E66', borderBottom: '1px solid rgba(255,255,255,.15)', color: '#fff' }}>
    <div style={{ maxWidth: 1200, height: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 15, fontWeight: 500 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }} className="government-label">
        {!broken && <img src="/assets/brasao-vitoria-header.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} onError={() => setBroken(true)} />}
        Prefeitura Municipal de Vitória · Portal de Qualificação Profissional
      </span>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
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

  // O menu começa transparente sobre a foto do herói (texto claro) e, ao
  // rolar a página, ganha fundo bege-claro sólido — nesse momento o texto
  // precisa virar escuro para manter contraste. Isso evita o clássico
  // problema de menus que "somem" ou ficam ilegíveis em sites institucionais.
  const linkColor = scrolled ? '#334155' : 'rgba(255,255,255,0.92)'
  const linkHoverColor = scrolled ? '#0A5E66' : '#ffffff'
  const brandInkColor = scrolled ? '#0F172A' : '#ffffff'
  const dividerColor = scrolled ? 'rgba(10,94,102,0.15)' : 'rgba(255,255,255,0.25)'

  return (
    <nav style={{
      position: 'fixed', top: 40, left: 0, right: 0, zIndex: 50,
      padding: '0 24px',
      background: scrolled ? 'rgba(250,246,240,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(10,94,102,0.1)' : 'none',
      boxShadow: scrolled ? '0 2px 16px rgba(15,23,42,0.06)' : 'none',
      transition: 'background 0.3s, border-color 0.3s, box-shadow 0.3s',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 76,
      }}>
        {/* Left: city logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <PrefeituraLogo size={44} />
          <div style={{ width: 1, height: 32, background: dividerColor, transition: 'background 0.3s' }} />
          <a href="#conteudo" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline' }} aria-label="QualificaVix — página inicial">
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 600, color: brandInkColor, letterSpacing: '-0.01em', transition: 'color 0.3s' }}>
              Qualifica
            </span>
            <span style={{ fontFamily: "'Fraunces', serif", fontSize: 27, fontWeight: 600, color: '#FF6B57', letterSpacing: '-0.01em' }}>
              Vix
            </span>
          </a>
        </div>

        {/* Nav links */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              style={{
                color: linkColor, fontSize: 18, fontWeight: 600,
                textDecoration: 'none', transition: 'color 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = linkHoverColor }}
              onMouseLeave={e => { e.currentTarget.style.color = linkColor }}
            >
              {l.label}
            </a>
          ))}
          <a href="/estudante" style={{ color: scrolled ? '#0A5E66' : '#ffffff', fontSize: 18, fontWeight: 700, textDecoration: 'none' }}>Área do estudante</a>
          <a
            href="/estudante?mode=register"
            title="Criar sua conta gratuita QualificaVix — não é necessário para conhecer os cursos"
            style={{
              padding: '10px 22px', borderRadius: 10,
              background: 'linear-gradient(135deg, #FF6B57, #E14B38)',
              color: '#fff', fontWeight: 700, fontSize: 18,
              textDecoration: 'none', letterSpacing: '0.02em',
              boxShadow: '0 4px 14px rgba(255,107,87,0.35)',
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
      setImgIndex(i => (i + 1) % HERO_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const activeSlide = HERO_SLIDES[imgIndex]

  return (
    <section id="conteudo" aria-labelledby="titulo-principal" style={{ position: 'relative', height: '100vh', minHeight: 680, overflow: 'hidden' }}>
      {/* Background images — fotos reais dos cursos mais procurados, não
          fotos de banco de imagens genéricas e desconectadas do conteúdo. */}
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.courseId}
          className="hero-img"
          style={{ opacity: i === imgIndex ? 1 : 0, backgroundImage: `url(${slide.image})` }}
        />
      ))}

      {/* Overlays: gradiente na cor institucional (azul-baía), não mais preto puro —
          mantém a fotografia viva e ainda garante contraste AA para o texto branco. */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(7,27,46,0.55) 0%, rgba(7,27,46,0.4) 40%, rgba(7,27,46,0.88) 80%, #071B2E 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 70% 50%, rgba(255,107,87,0.14) 0%, transparent 60%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', zIndex: 2,
        maxWidth: 800, margin: '0 auto',
        padding: '0 24px',
        height: '100%',
        display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start',
      }}>
        {/* Legenda dinâmica: mostra qual curso está em destaque na foto de fundo */}
        <a href={`#curso-${activeSlide.courseId}`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: `${activeSlide.color}2A`, border: `1px solid ${activeSlide.color}66`,
          borderRadius: 999, padding: '7px 16px', marginBottom: 24,
          textDecoration: 'none', transition: 'background 0.3s, border-color 0.3s',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: activeSlide.color, display: 'inline-block' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
            Em destaque: {activeSlide.courseName} <span style={{ opacity: 0.75, fontWeight: 500 }}>· {activeSlide.area}</span>
          </span>
        </a>

        <h1 id="titulo-principal" style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 'clamp(40px, 6.5vw, 72px)',
          fontWeight: 600, color: '#fff', lineHeight: 1.12,
          letterSpacing: '-0.01em', margin: '0 0 22px',
        }}>
          Qualifique-se e<br />
          <span style={{ color: '#FFA694' }}>transforme</span> sua<br />
          <span style={{ color: '#8FE0E8' }}>carreira</span>.
        </h1>

        <p style={{
          fontSize: 21, color: '#D7E1E9', lineHeight: 1.65,
          maxWidth: 520, margin: '0 0 36px',
        }}>
          A Prefeitura de Vitória oferece cursos profissionalizantes gratuitos para moradores que buscam o primeiro emprego, empreender ou crescer na carreira.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          <a
            href="#cursos"
            style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'linear-gradient(135deg, #FF6B57, #E14B38)',
              color: '#fff', fontWeight: 700, fontSize: 19,
              textDecoration: 'none', letterSpacing: '0.02em',
              boxShadow: '0 6px 24px rgba(255,107,87,0.45)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(255,107,87,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(255,107,87,0.45)'
            }}
          >
            Ver cursos disponíveis
          </a>
          <a
            href="#como-funciona"
            style={{
              padding: '14px 32px', borderRadius: 12,
              background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(255,255,255,0.4)',
              color: '#fff', fontWeight: 600, fontSize: 19,
              textDecoration: 'none', transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
          >
            Como funciona
          </a>
        </div>

        {/* Image dots indicator */}
        <div style={{ display: 'flex', gap: 6, marginTop: 40 }}>
          {HERO_SLIDES.map((slide, i) => (
            <button
              key={slide.courseId}
              aria-label={`Exibir curso em destaque: ${slide.courseName}`}
              onClick={() => setImgIndex(i)}
              style={{
                width: i === imgIndex ? 24 : 6, height: 6, borderRadius: 3,
                background: i === imgIndex ? '#FF6B57' : 'rgba(255,255,255,0.25)',
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
        background: 'rgba(7,27,46,0.94)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 24px',
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 0,
        }}>
          {[
            { value: String(courses.length), label: 'Cursos no catálogo', color: '#FFA694' },
            { value: 'Online', label: 'Pré-inscrição simplificada', color: '#8FE0E8' },
            { value: '100%', label: 'Gratuito — sem taxas', color: '#8FD1AE' },
            { value: 'Vitória', label: 'Oportunidades para moradores', color: '#FFA694' },
          ].map((s, i) => (
            <div key={i} style={{
              padding: '20px 0', textAlign: 'center',
              borderRight: i < 3 ? '1px solid rgba(255,255,255,0.1)' : 'none',
            }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
              <div style={{ fontSize: 16, color: '#C5D2DB', marginTop: 3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Barra de Stories, estilo Instagram: círculos com anel colorido — cada
// círculo é um "grupo" (Avisos, um curso em destaque, Histórias). Clicar
// abre o visualizador em tela cheia com avanço automático, como o público
// já está acostumado a usar em redes sociais — reduz a curva de aprendizado
// e cria um canal de conteúdo "rápido" complementar às seções mais longas.
function StoriesBar() {
  const [openGroup, setOpenGroup] = useState<number | null>(null)
  return (
    <section aria-label="Novidades em destaque" style={{ background: '#FFFFFF', borderBottom: '1px solid #E4E9F0', padding: '18px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 18, overflowX: 'auto', paddingBottom: 4 }}>
          {STORY_GROUPS.map((group, i) => (
            <button
              key={group.id}
              onClick={() => setOpenGroup(i)}
              aria-label={`Ver stories: ${group.label}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7,
                background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, width: 76,
              }}
            >
              <span style={{
                width: 68, height: 68, borderRadius: '50%', padding: 3,
                background: group.ring, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
                  border: '2.5px solid #FFFFFF', background: '#F5F7FA',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>
                  {group.avatarImage
                    ? <img src={group.avatarImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : group.avatarEmoji}
                </span>
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 76 }}>
                {group.label}
              </span>
            </button>
          ))}
        </div>
      </div>
      {openGroup !== null && (
        <StoryViewer
          startGroup={openGroup}
          onClose={() => setOpenGroup(null)}
        />
      )}
    </section>
  )
}

const STORY_SLIDE_DURATION = 6000

function StoryViewer({ startGroup, onClose }: { startGroup: number; onClose: () => void }) {
  const [groupIdx, setGroupIdx] = useState(startGroup)
  const [slideIdx, setSlideIdx] = useState(0)
  const [paused, setPaused] = useState(false)

  const group = STORY_GROUPS[groupIdx]
  const slide = group.slides[slideIdx]

  const goNext = () => {
    if (slideIdx < group.slides.length - 1) { setSlideIdx(i => i + 1); return }
    if (groupIdx < STORY_GROUPS.length - 1) { setGroupIdx(g => g + 1); setSlideIdx(0); return }
    onClose()
  }
  const goPrev = () => {
    if (slideIdx > 0) { setSlideIdx(i => i - 1); return }
    if (groupIdx > 0) { const prevGroup = STORY_GROUPS[groupIdx - 1]; setGroupIdx(g => g - 1); setSlideIdx(prevGroup.slides.length - 1) }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Stories: ${group.label}`}
      style={{ position: 'fixed', inset: 0, zIndex: 300, background: '#000', display: 'grid', placeItems: 'center' }}
    >
      <div style={{ position: 'relative', width: '100%', maxWidth: 420, height: '100%', maxHeight: 760, overflow: 'hidden', background: '#0F172A' }}>
        <img src={slide.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.15) 55%, rgba(0,0,0,0.9) 100%)` }} />

        {/* Barras de progresso — uma por slide do grupo atual */}
        <div style={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', gap: 4, zIndex: 2 }}>
          {group.slides.map((s, i) => (
            <div key={s.id} style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.35)', overflow: 'hidden' }}>
              <div
                key={`${groupIdx}-${i}`}
                onAnimationEnd={() => { if (i === slideIdx && !paused) goNext() }}
                style={{
                  height: '100%', background: '#fff', borderRadius: 2,
                  width: i < slideIdx ? '100%' : i > slideIdx ? '0%' : undefined,
                  animationName: i === slideIdx ? 'storyProgress' : undefined,
                  animationDuration: `${STORY_SLIDE_DURATION}ms`,
                  animationTimingFunction: 'linear',
                  animationFillMode: 'forwards',
                  animationPlayState: paused ? 'paused' : 'running',
                }}
              />
            </div>
          ))}
        </div>

        {/* Cabeçalho: avatar do grupo + fechar */}
        <div style={{ position: 'absolute', top: 22, left: 12, right: 12, display: 'flex', alignItems: 'center', gap: 10, zIndex: 2 }}>
          <span style={{
            width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            border: '2px solid #fff', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
          }}>
            {group.avatarImage ? <img src={group.avatarImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : group.avatarEmoji}
          </span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, flex: 1 }}>{group.label} · QualificaVix</span>
          <button
            onClick={() => setPaused(p => !p)}
            aria-label={paused ? 'Retomar' : 'Pausar'}
            style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8, width: 34, height: 34, color: '#fff', fontSize: 15, cursor: 'pointer' }}
          >
            {paused ? '▶' : '❚❚'}
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar stories"
            style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8, width: 34, height: 34, color: '#fff', fontSize: 18, cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>

        {/* Zonas de toque para navegar (esquerda = anterior, direita = próximo) */}
        <button aria-label="Story anterior" onClick={goPrev} style={{ position: 'absolute', top: 60, bottom: 90, left: 0, width: '30%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 1 }} />
        <button aria-label="Próximo story" onClick={goNext} style={{ position: 'absolute', top: 60, bottom: 90, right: 0, width: '70%', background: 'none', border: 'none', cursor: 'pointer', zIndex: 1 }} />

        {/* Conteúdo */}
        <div style={{ position: 'absolute', left: 20, right: 20, bottom: 28, zIndex: 2 }}>
          <div style={{
            display: 'inline-block', fontSize: 14, fontWeight: 700, color: '#fff', background: `${slide.accent}CC`,
            borderRadius: 999, padding: '5px 12px', marginBottom: 12,
          }}>
            {slide.eyebrow}
          </div>
          <h3 style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 600, color: '#fff', margin: '0 0 8px', lineHeight: 1.2 }}>{slide.title}</h3>
          <p style={{ fontSize: 16, color: '#E4E9F0', lineHeight: 1.55, margin: '0 0 18px' }}>{slide.body}</p>
          <a
            href={slide.cta.href}
            onClick={onClose}
            style={{
              display: 'inline-block', padding: '12px 22px', borderRadius: 10, fontWeight: 700, fontSize: 16,
              background: slide.accent, color: '#fff', textDecoration: 'none', minHeight: 44,
            }}
          >
            {slide.cta.label}
          </a>
        </div>
      </div>
    </div>
  )
}

function CoursesSection({ onEnroll, onNotify }: { onEnroll: (course: Course) => void; onNotify: (course: Course) => void }) {
  const [videoOpen, setVideoOpen] = useState<Course | null>(null)
  const [detailOpen, setDetailOpen] = useState<Course | null>(null)
  const courses = useCourses()

  const [search, setSearch] = useState('')
  const [area, setArea] = useState<string>('todas')
  const [status, setStatus] = useState<CourseStatus | 'todos'>('todos')
  const [periodo, setPeriodo] = useState<Periodo | 'todos'>('todos')
  const [sortBy, setSortBy] = useState<'popularidade' | 'nome' | 'salario'>('popularidade')

  // Lista de áreas disponíveis, derivada dos próprios cursos — se um curso
  // novo de outra área for cadastrado no futuro, o filtro aparece sozinho,
  // sem precisar editar esta seção manualmente.
  const areaOptions = useMemo(() => {
    const seen = new Map<string, string>()
    courses.forEach(c => { if (!seen.has(c.areaKey)) seen.set(c.areaKey, c.area) })
    return Array.from(seen, ([key, label]) => ({ key, label }))
  }, [courses])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    let list = courses.filter(c => {
      const matchesSearch = !term || c.name.toLowerCase().includes(term) || c.synopse.toLowerCase().includes(term) || c.area.toLowerCase().includes(term)
      const matchesArea = area === 'todas' || c.areaKey === area
      const matchesStatus = status === 'todos' || c.status === status
      const matchesPeriodo = periodo === 'todos' || c.periodo === periodo
      return matchesSearch && matchesArea && matchesStatus && matchesPeriodo
    })
    const salaryFloor = (s: string) => Number(s.replace(/[^\d,]/g, '').split(',')[0].replace(/\D/g, '')) || 0
    if (sortBy === 'nome') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    else if (sortBy === 'salario') list = [...list].sort((a, b) => salaryFloor(b.mediaSalarial) - salaryFloor(a.mediaSalarial))
    else list = [...list].sort((a, b) => b.inscritos - a.inscritos)
    return list
  }, [courses, search, area, status, periodo, sortBy])

  const clearFilters = () => { setSearch(''); setArea('todas'); setStatus('todos'); setPeriodo('todos') }
  const hasActiveFilters = search !== '' || area !== 'todas' || status !== 'todos' || periodo !== 'todos'

  return (
    <section id="cursos" style={{ padding: '80px 24px' }}>
      {videoOpen && <VideoModal course={videoOpen} onClose={() => setVideoOpen(null)} />}

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 40, maxWidth: 560 }}>
          <div style={{
            fontSize: 17, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: '#0891B2', marginBottom: 12,
          }}>
            Cursos Profissionalizantes
          </div>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 600, color: '#0F172A',
            lineHeight: 1.18, letterSpacing: '-0.01em', margin: '0 0 14px',
          }}>
            Escolha o seu<br />
            <span style={{ color: '#0891B2' }}>próximo passo</span>.
          </h2>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Todos os cursos são gratuitos, com certificado reconhecido e instrutores qualificados. Passe o mouse sobre a miniatura para ver uma prévia em vídeo.
          </p>
        </div>

        {/* Busca */}
        <div style={{ position: 'relative', maxWidth: 440, marginBottom: 18 }}>
          <span aria-hidden="true" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#64748B' }}>🔎</span>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar curso por nome, área ou palavra-chave…"
            aria-label="Buscar curso"
            style={{
              width: '100%', padding: '13px 16px 13px 44px', borderRadius: 12,
              border: '1.5px solid #CBD5E1', background: '#FFFFFF',
              fontSize: 17, color: '#0F172A', outline: 'none', boxSizing: 'border-box',
              minHeight: 48, transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#0891B2' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#CBD5E1' }}
          />
        </div>

        {/* Chips de área */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
          <FilterChip active={area === 'todas'} onClick={() => setArea('todas')} label="Todas as áreas" color="#0F172A" />
          {areaOptions.map(opt => (
            <FilterChip key={opt.key} active={area === opt.key} onClick={() => setArea(opt.key)} label={opt.label} color={AREA_THEMES[opt.key]} />
          ))}
        </div>

        {/* Status + período + ordenação */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 28 }}>
          <select value={status} onChange={e => setStatus(e.target.value as CourseStatus | 'todos')} aria-label="Filtrar por status das inscrições" style={selectStyle}>
            <option value="todos">Qualquer status</option>
            <option value="abertas">Inscrições abertas</option>
            <option value="ultimas-vagas">Últimas vagas</option>
            <option value="breve">Início em breve</option>
          </select>
          <select value={periodo} onChange={e => setPeriodo(e.target.value as Periodo | 'todos')} aria-label="Filtrar por período das aulas" style={selectStyle}>
            <option value="todos">Qualquer período</option>
            <option value="Diurno">Diurno</option>
            <option value="Vespertino">Vespertino</option>
            <option value="Noturno">Noturno</option>
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} aria-label="Ordenar cursos por" style={selectStyle}>
            <option value="popularidade">Mais procurados</option>
            <option value="nome">Nome (A–Z)</option>
            <option value="salario">Maior salário médio</option>
          </select>
          {hasActiveFilters && (
            <button onClick={clearFilters} style={{
              background: 'none', border: 'none', color: '#B91C1C', fontWeight: 700,
              fontSize: 16, cursor: 'pointer', textDecoration: 'underline', padding: '6px 4px',
            }}>
              Limpar filtros
            </button>
          )}
        </div>

        <div style={{
          marginBottom: 20, fontSize: 16, color: '#475569', fontWeight: 600,
        }} aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'curso encontrado' : 'cursos encontrados'}
        </div>

        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '56px 24px', background: '#FFFFFF',
            border: '1px dashed #CBD5E1', borderRadius: 16,
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ fontSize: 21, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Nenhum curso encontrado</div>
            <p style={{ fontSize: 17, color: '#475569', margin: '0 0 18px' }}>Tente outra palavra-chave ou remova alguns filtros.</p>
            <button onClick={clearFilters} style={{
              padding: '11px 22px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: '#0891B2', color: '#fff', fontWeight: 700, fontSize: 16, minHeight: 44,
            }}>
              Ver todos os cursos
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {filtered.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                onVideoOpen={() => setVideoOpen(course)}
                onDetailOpen={() => setDetailOpen(course)}
                onEnroll={() => onEnroll(course)}
                onNotify={() => onNotify(course)}
              />
            ))}
          </div>
        )}
      </div>
      {detailOpen && (
        <CourseDetailModal
          course={detailOpen}
          onClose={() => setDetailOpen(null)}
          onWatchVideo={() => { setVideoOpen(detailOpen); setDetailOpen(null) }}
          onEnroll={() => { onEnroll(detailOpen); setDetailOpen(null) }}
          onNotify={() => { onNotify(detailOpen); setDetailOpen(null) }}
        />
      )}
    </section>
  )
}

const selectStyle: React.CSSProperties = {
  padding: '11px 14px', borderRadius: 10, border: '1.5px solid #CBD5E1',
  background: '#FFFFFF', color: '#0F172A', fontSize: 16, fontWeight: 600,
  cursor: 'pointer', minHeight: 44,
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '9px 16px', borderRadius: 999, fontSize: 16, fontWeight: 700, cursor: 'pointer',
        border: `1.5px solid ${active ? color : '#CBD5E1'}`,
        background: active ? `${color}18` : '#FFFFFF',
        color: active ? color : '#334155',
        transition: 'all 0.15s', minHeight: 40,
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      {label}
    </button>
  )
}

function EnrollSection() {
  // Os 4 passos usam tons da MESMA família (verde-esmeralda) — a cor de
  // assinatura desta seção — variando apenas a tonalidade para diferenciar
  // a sequência, em vez de cores soltas sem relação com o restante da seção.
  const steps = [
    {
      n: '01', title: 'Escolha o Curso', icon: '🔍',
      desc: 'Navegue pelos cursos disponíveis e encontre o que mais combina com seus objetivos. Nosso assistente virtual pode te ajudar.',
      color: '#34D399',
    },
    {
      n: '02', title: 'Faça o Cadastro', icon: '📝',
      desc: 'Preencha o formulário online com os dados necessários. Se você já tem cadastro, suas informações são aproveitadas automaticamente.',
      color: '#059669',
    },
    {
      n: '03', title: 'Confirmação', icon: '✅',
      desc: 'Você receberá uma confirmação por e-mail ou SMS com data, horário e endereço do polo onde o curso será realizado.',
      color: '#0D9488',
    },
    {
      n: '04', title: 'Comece a Estudar', icon: '🎓',
      desc: 'Compareça ao curso no dia marcado. Material didático e certificado são fornecidos gratuitamente pela Prefeitura de Vitória.',
      color: '#047857',
    },
  ]

  return (
    <section id="como-funciona" style={{ padding: '84px 24px', background: '#FFFFFF', borderTop: '1px solid #E4E9F0', borderBottom: '1px solid #E4E9F0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#059669', marginBottom: 12 }}>
            Processo de Inscrição
          </div>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, color: '#0F172A',
            lineHeight: 1.2, margin: '0 0 14px', letterSpacing: '-0.01em',
          }}>
            Como se inscrever
          </h2>
          <p style={{ fontSize: 19, color: '#475569', maxWidth: 480, margin: '0 auto' }}>
            Em 4 passos simples você garante sua vaga em um curso profissionalizante gratuito.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 22 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{
                background: '#F5F7FA',
                border: `1px solid #E4E9F0`,
                borderRadius: 18, padding: '30px 26px',
                height: '100%',
                transition: 'border-color 0.3s, transform 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `${s.color}55`
                  e.currentTarget.style.transform = 'translateY(-4px)'
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(15,23,42,0.1)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#E4E9F0'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 15,
                    background: `${s.color}1c`, border: `1px solid ${s.color}38`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 26,
                  }}>
                    {s.icon}
                  </div>
                  <span style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 36, fontWeight: 600, color: `${s.color}45`,
                    lineHeight: 1,
                  }}>
                    {s.n}
                  </span>
                </div>
                <h3 style={{ fontSize: 21, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 17, color: '#475569', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
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
    <section id="historias" style={{ padding: '84px 24px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 12 }}>
            Histórias reais
          </div>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, color: '#0F172A',
            lineHeight: 1.2, margin: 0, letterSpacing: '-0.01em',
          }}>
            Quem transformou sua vida<br />com o QualificaVix
          </h2>
        </div>

        <div style={{
          background: '#FFFFFF', borderRadius: 22,
          border: '1px solid #E4E9F0',
          boxShadow: '0 12px 40px rgba(15,23,42,0.08)',
          padding: '48px 48px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Acento decorativo violeta — cor de assinatura desta seção */}
          <div style={{
            position: 'absolute', top: -40, right: -40,
            width: 200, height: 200, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 56, color: '#7C3AED', lineHeight: 1, marginBottom: 12, opacity: 0.35 }}>"</div>

          <p style={{
            fontSize: 'clamp(18px, 2vw, 22px)', color: '#334155', lineHeight: 1.7,
            margin: '0 0 32px', fontStyle: 'italic',
          }}>
            {current.text}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <img
              src={current.photo}
              alt={current.name}
              style={{ width: 58, height: 58, borderRadius: '50%', objectFit: 'cover', border: '3px solid #7C3AED' }}
            />
            <div>
              <div style={{ fontWeight: 700, fontSize: 19, color: '#0F172A' }}>{current.name}</div>
              <div style={{ fontSize: 16, color: '#64748B' }}>{current.occupation}</div>
              <div style={{ fontSize: 16, color: '#7C3AED', marginTop: 1, fontWeight: 600 }}>
                Curso: {current.course} · {current.neighborhood}
              </div>
            </div>
            <div style={{
              marginLeft: 'auto',
              background: '#E7F8ED', border: '1px solid #A9E8C1',
              borderRadius: 12, padding: '10px 18px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 15, color: '#475569' }}>Salário atual</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#0F7A38' }}>{current.salary}</div>
            </div>
          </div>

          {/* Nav dots */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 32 }}>
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Ver depoimento ${i + 1} de ${TESTIMONIALS.length}`}
                style={{
                  width: i === idx ? 28 : 10, height: 10, borderRadius: 5,
                  background: i === idx ? '#7C3AED' : '#E2E7EE',
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
              aria-label="Depoimento anterior"
              style={{
                background: '#FFFFFF', border: '1px solid #E2E7EE', boxShadow: '0 2px 8px rgba(15,23,42,0.1)',
                borderRadius: '50%', width: 44, height: 44, color: '#0F172A',
                cursor: 'pointer', fontSize: 19,
              }}
            >
              ←
            </button>
          </div>
          <div style={{ position: 'absolute', top: '50%', right: 12, transform: 'translateY(-50%)' }}>
            <button
              onClick={() => setIdx(i => (i + 1) % TESTIMONIALS.length)}
              aria-label="Próximo depoimento"
              style={{
                background: '#FFFFFF', border: '1px solid #E2E7EE', boxShadow: '0 2px 8px rgba(15,23,42,0.1)',
                borderRadius: '50%', width: 44, height: 44, color: '#0F172A',
                cursor: 'pointer', fontSize: 19,
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
    <section style={{ padding: '20px 24px 84px', background: '#F5F7FA' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#D97706', marginBottom: 8 }}>
              🔥 Mais Procurados
            </div>
            <h2 style={{
              fontFamily: "'Fraunces', serif",
              fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 600, color: '#0F172A',
              margin: 0, letterSpacing: '-0.01em',
            }}>
              Os favoritos dos alunos
            </h2>
          </div>
          <a href="#cursos" style={{ color: '#D97706', fontSize: 18, textDecoration: 'underline', textUnderlineOffset: 3, fontWeight: 700 }}>
            Ver todos os cursos →
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {top.map((c, i) => (
            <div key={c.id} style={{
              background: '#FFFFFF', borderRadius: 14,
              border: '1px solid #E2E7EE',
              padding: '16px', display: 'flex', gap: 14, alignItems: 'center',
              transition: 'border-color 0.25s, box-shadow 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = `${c.chatColor}55`; e.currentTarget.style.boxShadow = '0 6px 18px rgba(15,23,42,0.08)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E7EE'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: `${c.chatColor}1c`, border: `1px solid ${c.chatColor}38`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, fontWeight: 800, color: c.chatColor,
                fontFamily: "'Fraunces', serif",
              }}>
                {i + 1}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</div>
                <div style={{ fontSize: 16, color: '#64748B' }}>{c.inscritos.toLocaleString('pt-BR')} inscritos</div>
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
    <section id="pesquisa" style={{ padding: '84px 24px', background: '#FFFFFF', borderTop: '1px solid #E4E9F0' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#0EA5E9', marginBottom: 12 }}>
            Pesquisa de Interesse
          </div>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 600, color: '#0F172A',
            lineHeight: 1.2, margin: '0 0 12px', letterSpacing: '-0.01em',
          }}>
            Não achou o curso que procurava?
          </h2>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Conte para nós qual curso você gostaria que a Prefeitura de Vitória oferecesse. Seu interesse pode influenciar nossa próxima grade.
          </p>
        </div>

        {submitted ? (
          <div style={{
            background: '#E7F8ED', border: '1px solid #A9E8C1',
            borderRadius: 18, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 23, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Resposta enviada!</div>
            <div style={{ fontSize: 18, color: '#334155' }}>
              Obrigado, {form.nome}! Sua sugestão foi registrada e será analisada pela equipe do QualificaVix.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: '#F5F7FA', borderRadius: 20,
            border: '1px solid #E4E9F0',
            padding: '32px',
          }}>
            {[
              { id: 'nome', label: 'Seu nome completo', placeholder: 'Ex: Maria Silva', required: true },
              { id: 'bairro', label: 'Bairro / Região onde mora', placeholder: 'Ex: Jardim da Penha, Goiabeiras…', required: true },
              { id: 'curso', label: 'Nome do curso que você gostaria', placeholder: 'Ex: Curso de Enfermagem, Fotografia…', required: true },
              { id: 'contato', label: 'WhatsApp ou e-mail (opcional)', placeholder: 'Para te avisarmos quando o curso estiver disponível', required: false },
            ].map(f => (
              <div key={f.id} style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  {f.label} {f.required && <span style={{ color: '#E14B38' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={form[f.id as keyof typeof form]}
                  onChange={e => setForm(prev => ({ ...prev, [f.id]: e.target.value }))}
                  placeholder={f.placeholder}
                  required={f.required}
                  style={{
                    width: '100%', padding: '13px 16px', borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    color: '#0F172A', fontSize: 18, outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s',
                    minHeight: 48,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#0EA5E9' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#CBD5E1' }}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 12,
                background: 'linear-gradient(135deg, #0EA5E9, #0369A1)',
                color: '#fff', fontWeight: 700, fontSize: 19, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(14,165,233,0.35)',
                transition: 'opacity 0.2s',
                minHeight: 48,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {submitting ? 'Enviando…' : 'Enviar sugestão de curso'}
            </button>
            {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 17, margin: '12px 0 0', fontWeight: 600 }}>{error}</p>}
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
    <section style={{ padding: '84px 24px', background: '#F5F7FA' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#DB2777', marginBottom: 12 }}>
            Sua Opinião Importa
          </div>
          <h2 style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 600, color: '#0F172A',
            lineHeight: 1.2, margin: '0 0 12px', letterSpacing: '-0.01em',
          }}>
            Pesquisa de satisfação
          </h2>
          <p style={{ fontSize: 19, color: '#475569', lineHeight: 1.6, margin: 0 }}>
            Sua avaliação nos ajuda a melhorar o programa QualificaVix para toda a cidade.
          </p>
        </div>

        {submitted ? (
          <div style={{
            background: '#FCE7F3', border: '1px solid #F9A8D4',
            borderRadius: 18, padding: '40px 32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🙏</div>
            <div style={{ fontSize: 23, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Obrigado pelo feedback!</div>
            <div style={{ fontSize: 18, color: '#334155' }}>
              Sua avaliação foi registrada. Continuamos trabalhando para oferecer os melhores cursos para Vitória.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{
            background: '#FFFFFF', borderRadius: 20,
            border: '1px solid #E4E9F0',
            padding: '32px',
          }}>
            {/* Star rating */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
                Como você avalia o programa QualificaVix? <span style={{ color: '#BE185D' }}>*</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${n} de 5 estrelas`}
                    style={{
                      fontSize: 34, background: 'none', border: 'none', cursor: 'pointer',
                      filter: n <= (hoverRating || rating) ? 'none' : 'grayscale(1) opacity(0.35)',
                      transform: n <= (hoverRating || rating) ? 'scale(1.2)' : 'scale(1)',
                      transition: 'filter 0.15s, transform 0.15s',
                    }}
                  >
                    ⭐
                  </button>
                ))}
                {rating > 0 && (
                  <span style={{ fontSize: 17, color: '#BE185D', alignSelf: 'center', marginLeft: 8, fontWeight: 600 }}>
                    {['', 'Muito ruim', 'Ruim', 'Regular', 'Bom', 'Excelente!'][rating]}
                  </span>
                )}
              </div>
            </div>

            {/* Satisfaction */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#334155', marginBottom: 12 }}>
                Você recomendaria o QualificaVix para amigos e familiares? <span style={{ color: '#BE185D' }}>*</span>
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {questions.map(q => (
                  <button
                    key={q.value}
                    type="button"
                    onClick={() => setRecommend(q.value)}
                    style={{
                      padding: '11px 18px', borderRadius: 10, cursor: 'pointer',
                      background: recommend === q.value ? '#FCE7F3' : '#F5F7FA',
                      border: recommend === q.value ? '1.5px solid #DB2777' : '1.5px solid #CBD5E1',
                      color: recommend === q.value ? '#BE185D' : '#334155',
                      fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.15s', minHeight: 44,
                    }}
                  >
                    <span>{q.emoji}</span> {q.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                Deixe um comentário (opcional)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="O que você achou? O que poderia melhorar?"
                rows={4}
                style={{
                  width: '100%', padding: '13px 16px', borderRadius: 10,
                  background: '#F5F7FA',
                  border: '1.5px solid #CBD5E1',
                  color: '#0F172A', fontSize: 18, outline: 'none',
                  resize: 'vertical', boxSizing: 'border-box',
                  fontFamily: 'inherit', transition: 'border-color 0.2s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = '#DB2777' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#CBD5E1' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%', padding: '15px 0', borderRadius: 12,
                background: 'linear-gradient(135deg, #DB2777, #BE185D)',
                color: '#fff', fontWeight: 700, fontSize: 19, border: 'none', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(219,39,119,0.35)',
                transition: 'opacity 0.2s',
                minHeight: 48,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {submitting ? 'Enviando…' : 'Enviar avaliação'}
            </button>
            {error && <p role="alert" style={{ color: '#B91C1C', fontSize: 17, margin: '12px 0 0', fontWeight: 600 }}>{error}</p>}
          </form>
        )}
      </div>
    </section>
  )
}

// O rodapé retoma o azul institucional da barra do topo (GovernmentBar),
// criando uma "moldura" que lembra o visitante, ao final da jornada, que
// está em um serviço oficial da Prefeitura — mesmo com todo o conteúdo do
// meio sendo leve, colorido e acolhedor.
function Footer() {
  const courses = useCourses()
  return (
    <footer style={{
      background: '#071B2E',
      borderTop: '4px solid #FF6B57',
      padding: '48px 24px 32px',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, justifyContent: 'space-between', marginBottom: 32 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: '#fff' }}>Qualifica</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 24, fontWeight: 600, color: '#FFA694' }}>Vix</span>
            </div>
            <p style={{ fontSize: 16, color: '#B7C4CE', lineHeight: 1.6, margin: 0 }}>
              Programa de qualificação profissional gratuita da Prefeitura de Vitória — ES. Investindo nas pessoas que fazem a nossa cidade.
            </p>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8FE0E8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
              Cursos
            </div>
            {courses.slice(0, 4).map(c => (
              <div key={c.id} style={{ fontSize: 16, color: '#C5D2DB', marginBottom: 8 }}>{c.name}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8FE0E8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
              Links Úteis
            </div>
            {[{l:'Como se inscrever',h:'#como-funciona'},{l:'Histórias de alunos',h:'#historias'},{l:'Pesquisa de interesse',h:'#pesquisa'},{l:'Avaliação',h:'#pesquisa'}].map(item => (
              <a key={item.l} href={item.h} style={{ display: 'block', fontSize: 16, color: '#C5D2DB', marginBottom: 8, textDecoration: 'none' }}>{item.l}</a>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#8FE0E8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 14 }}>
              Contato
            </div>
            <div style={{ fontSize: 16, color: '#C5D2DB', lineHeight: 1.8 }}>
              <div>📍 Av. Marechal Mascarenhas de Moraes, 1927</div>
              <div>Bento Ferreira, Vitória — ES · CEP 29.050-945</div>
              <div style={{ marginTop: 8 }}><a href="https://www.vitoria.es.gov.br/contato" target="_blank" rel="noreferrer" style={{ color: '#8FE0E8' }}>Fale com a Prefeitura ↗</a></div>
              <div><a href="https://vixcursos.vitoria.es.gov.br" target="_blank" rel="noreferrer" style={{ color: '#8FE0E8' }}>Portal oficial do programa ↗</a></div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.15)',
          paddingTop: 20, display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 15, color: '#8FA3B3' }}>
            © 2026 Prefeitura Municipal de Vitória — Todos os direitos reservados
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="https://www.vitoria.es.gov.br/cidadao/acessibilidade" target="_blank" rel="noreferrer" style={{ fontSize: 15, color: '#B7C4CE' }}>Acessibilidade</a>
            <a href="https://transparencia.vitoria.es.gov.br/" target="_blank" rel="noreferrer" style={{ fontSize: 15, color: '#B7C4CE' }}>Transparência</a>
            <a href="/admin" style={{ fontSize: 15, color: '#B7C4CE' }}>Área administrativa</a>
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
    <CoursesContext.Provider value={courses}><div style={{ minHeight: '100vh', background: '#F5F7FA' }}>
      {enrollmentOpen && <EnrollmentModal course={enrollmentOpen} student={student} profile={enrollmentProfile} token={studentToken} onClose={() => setEnrollmentOpen(null)} />}
      {noticeOpen && <AvailabilityNoticeModal course={noticeOpen} profile={enrollmentProfile} token={studentToken} onClose={() => setNoticeOpen(null)} />}
      <a className="skip-link" href="#conteudo">Ir para o conteúdo principal</a>
      <GovernmentBar />
      <Navbar activeSection={activeSection} />
      <Hero />
      <StoriesBar />
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
