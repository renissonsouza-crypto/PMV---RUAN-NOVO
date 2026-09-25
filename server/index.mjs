import express from 'express'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { mkdirSync } from 'node:fs'
import { unlink } from 'node:fs/promises'
import { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT || 3001)
const secret = process.env.JWT_SECRET || 'chave-apenas-para-desenvolvimento-local'
const dist = path.resolve('dist')
const privateUploads = path.resolve(process.env.UPLOAD_DIR || 'uploads/private/rg')
mkdirSync(privateUploads, { recursive: true })
const upload = multer({
  storage: multer.diskStorage({ destination: privateUploads, filename: (_req, file, callback) => callback(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
})

app.disable('x-powered-by')
app.use(express.json({ limit: '50kb' }))
const route = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
const parse = (schema, value) => {
  const result = schema.safeParse(value)
  if (result.success) return result.data
  const error = new Error(result.error.issues[0]?.message || 'Dados inválidos.')
  error.status = 400
  throw error
}
const auth = (req, res, next) => {
  try {
    req.auth = jwt.verify(req.headers.authorization?.replace(/^Bearer\s+/i, '') || '', secret)
    next()
  } catch { res.status(401).json({ message: 'Sessão inválida ou expirada.' }) }
}
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return next()
  try { req.auth = jwt.verify(token, secret); next() }
  catch { res.status(401).json({ message: 'Sessão inválida ou expirada. Entre novamente.' }) }
}
const admin = (req, res, next) => auth(req, res, () => req.auth.role === 'ADMIN' ? next() : res.status(403).json({ message: 'Acesso restrito.' }))
const userView = ({ id, name, email, role, active }) => ({ id, name, email, role, active })
const periods = { MORNING: 'Diurno', AFTERNOON: 'Vespertino', EVENING: 'Noturno' }
const statuses = { OPEN: 'abertas', LAST_SPOTS: 'ultimas-vagas', COMING_SOON: 'breve', CLOSED: 'breve' }
const validCpf = value => {
  const cpf = String(value).replace(/\D/g, '')
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  const digit = length => { const sum = cpf.slice(0, length).split('').reduce((total, number, index) => total + Number(number) * (length + 1 - index), 0); const remainder = (sum * 10) % 11; return remainder === 10 ? 0 : remainder }
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}
const courseView = course => {
  const activeClass = course.classes?.find(item => ['OPEN', 'DRAFT'].includes(item.status))
  return { id: course.slug, databaseId: course.id, name: course.name, area: course.area, areaKey: course.areaKey, image: course.image, videoId: course.videoId || '', synopse: course.synopsis, status: statuses[course.status], duracao: course.duration, periodo: periods[activeClass?.period] || 'Diurno', cargaHoraria: course.workload, inscritos: course.classes?.reduce((sum, item) => sum + (item._count?.enrollments || 0), 0) || 0, vagas: activeClass?.capacity || 0, indicadoPara: course.indicatedFor, mediaSalarial: course.salaryRange || 'A consultar', chatColor: course.accentColor, classes: course.classes || [] }
}

const credentials = z.object({ email: z.string().trim().email().max(160), password: z.string().min(8).max(100) })
const courseInput = z.object({ slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/), name: z.string().trim().min(2).max(160), area: z.string().trim().min(2).max(100), areaKey: z.string().trim().min(2).max(80), image: z.string().url(), videoId: z.string().max(40).nullable().optional(), synopsis: z.string().min(10).max(2000), status: z.enum(['OPEN', 'LAST_SPOTS', 'COMING_SOON', 'CLOSED']), duration: z.string().min(2).max(60), workload: z.coerce.number().int().positive(), salaryRange: z.string().max(100).nullable().optional(), indicatedFor: z.array(z.string()).default([]), accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#3b82f6'), published: z.boolean().default(true) })
const classInput = z.object({ courseId: z.string().uuid(), name: z.string().min(2).max(120), period: z.enum(['MORNING', 'AFTERNOON', 'EVENING']), capacity: z.coerce.number().int().positive(), startDate: z.coerce.date().nullable().optional(), endDate: z.coerce.date().nullable().optional(), location: z.string().max(180).nullable().optional(), status: z.enum(['DRAFT', 'OPEN', 'IN_PROGRESS', 'FINISHED', 'CANCELLED']) })

app.get('/api/health', route(async (_req, res) => { await prisma.$queryRaw`SELECT 1`; res.json({ status: 'ok', database: 'connected' }) }))
app.post('/api/auth/register', route(async (req, res) => {
  const data = parse(credentials.extend({ name: z.string().trim().min(2).max(120) }), req.body)
  const email = data.email.toLowerCase()
  const user = await prisma.user.create({ data: { name: data.name, email, passwordHash: await bcrypt.hash(data.password, 12) } })
  await prisma.enrollment.updateMany({ where: { email: { equals: email, mode: 'insensitive' }, userId: null }, data: { userId: user.id } })
  res.status(201).json({ token: jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' }), user: userView(user) })
}))
app.post('/api/auth/login', route(async (req, res) => {
  const data = parse(credentials, req.body)
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (!user?.active || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ message: 'E-mail ou senha inválidos.' })
  res.json({ token: jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' }), user: userView(user) })
}))
app.get('/api/auth/me', auth, route(async (req, res) => res.json({ user: userView(await prisma.user.findUniqueOrThrow({ where: { id: req.auth.sub } })) })))

// This endpoint is deliberately scoped to the signed-in student. It lets the
// enrollment and notification flows reuse data that the student has already
// provided, without exposing another student's enrollment information.
app.get('/api/student/enrollment-profile', auth, route(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.sub },
    select: {
      name: true,
      email: true,
      enrollments: {
        where: { status: { not: 'CANCELLED' } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          phone: true, cpf: true, eligibilityType: true, cep: true, cnpj: true,
          race: true, birthDate: true, gender: true, education: true,
          disability: true, accessibilityNeeds: true, companionNeeds: true,
          rgDocumentPath: true,
        },
      },
    },
  })
  const previous = user.enrollments[0]
  res.json({
    profile: {
      name: user.name,
      email: user.email,
      phone: previous?.phone || '',
      cpf: previous?.cpf || '',
      eligibilityType: previous?.eligibilityType || '',
      cep: previous?.cep || '',
      cnpj: previous?.cnpj || '',
      race: previous?.race || '',
      birthDate: previous?.birthDate ? previous.birthDate.toISOString().slice(0, 10) : '',
      gender: previous?.gender || '',
      education: previous?.education || '',
      disability: previous?.disability || '',
      accessibilityNeeds: previous?.accessibilityNeeds || '',
      companionNeeds: previous?.companionNeeds || '',
      hasRgDocument: Boolean(previous?.rgDocumentPath),
    },
  })
}))

const courseInclude = { classes: { include: { _count: { select: { enrollments: true } } }, orderBy: { createdAt: 'desc' } } }
app.get('/api/courses', route(async (_req, res) => res.json({ courses: (await prisma.course.findMany({ where: { published: true }, include: courseInclude, orderBy: { name: 'asc' } })).map(courseView) })))
app.get('/api/courses/:slug', route(async (req, res) => {
  const course = await prisma.course.findFirst({ where: { slug: req.params.slug, published: true }, include: courseInclude })
  course ? res.json({ course: courseView(course) }) : res.status(404).json({ message: 'Curso não encontrado.' })
}))
app.get('/api/address/cep/:cep', route(async (req, res) => {
  const cep = String(req.params.cep || '').replace(/\D/g, '')
  if (cep.length !== 8) return res.status(400).json({ message: 'Informe os 8 dígitos do CEP.' })
  const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`).catch(() => null)
  if (!response?.ok) return res.status(503).json({ message: 'O serviço de CEP está indisponível. Tente novamente.' })
  const result = await response.json()
  if (result.erro) return res.status(404).json({ message: 'CEP não encontrado.' })
  const city = String(result.localidade || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
  const eligible = result.uf === 'ES' && city === 'VITORIA'
  res.json({
    address: { cep: result.cep, street: result.logradouro || '', complement: result.complemento || '', neighborhood: result.bairro || '', city: result.localidade || '', state: result.uf || '', stateName: result.estado || '', region: result.regiao || '', ibge: result.ibge || '', ddd: result.ddd || '' },
    eligible,
    message: eligible ? 'CEP válido para matrícula.' : 'Este CEP não pertence ao município de Vitória/ES.',
  })
}))
app.post('/api/enrollments', optionalAuth, upload.single('rgDocument'), route(async (req, res) => {
  const schema = z.object({ classId: z.string().uuid(), name: z.string().trim().min(2).max(120), email: z.string().email().max(160), cpf: z.string().transform(v => v.replace(/\D/g, '')).refine(validCpf, 'CPF inválido.'), phone: z.string().min(8).max(30), eligibilityType: z.enum(['RESIDENT', 'WORKER']), cep: z.string().optional().default(''), cnpj: z.string().optional().default(''), race: z.enum(['PARDO', 'AMARELO', 'BRANCO', 'PRETO']), birthDate: z.coerce.date(), gender: z.enum(['FEMININO', 'MASCULINO', 'NAO_BINARIO', 'NAO_INFORMAR', 'OUTRO']), education: z.enum(['FUNDAMENTAL_INCOMPLETO', 'FUNDAMENTAL_COMPLETO', 'MEDIO_INCOMPLETO', 'MEDIO_COMPLETO', 'SUPERIOR_INCOMPLETO', 'SUPERIOR_COMPLETO', 'POS_GRADUACAO']), disability: z.string().max(1000).optional().default(''), accessibilityNeeds: z.string().max(1000).optional().default(''), companionNeeds: z.string().max(1000).optional().default(''), lgpdAccepted: z.literal('true'), commitmentAccepted: z.literal('true') })
  const result = schema.safeParse(req.body)
  const reject = async message => { if (req.file) await unlink(req.file.path).catch(() => {}); return res.status(400).json({ message }) }
  if (!result.success) return reject(result.error.issues[0]?.message || 'Revise os dados da matrícula.')
  const data = result.data
  const authenticatedUser = req.auth ? await prisma.user.findUnique({ where: { id: req.auth.sub } }) : null
  if (req.auth && (!authenticatedUser?.active || authenticatedUser.role !== 'STUDENT')) return reject('Use uma conta ativa de estudante para realizar a matrícula.')
  const previousEnrollment = authenticatedUser
    ? await prisma.enrollment.findFirst({ where: { userId: authenticatedUser.id, status: { not: 'CANCELLED' }, rgDocumentPath: { not: null } }, orderBy: { createdAt: 'desc' }, select: { rgDocumentPath: true } })
    : null
  if (!req.file && !previousEnrollment?.rgDocumentPath) return reject('Envie uma foto legível do RG em JPG, PNG ou WebP.')
  if (authenticatedUser) { data.name = authenticatedUser.name; data.email = authenticatedUser.email }
  let verifiedAddress = null
  if (data.eligibilityType === 'RESIDENT') {
    const cep = data.cep.replace(/\D/g, '')
    if (cep.length !== 8) return reject('Informe um CEP válido.')
    const address = await fetch(`https://viacep.com.br/ws/${cep}/json/`).then(response => response.ok ? response.json() : null).catch(() => null)
    if (!address || address.erro || address.uf !== 'ES' || address.localidade?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() !== 'VITORIA') return reject('A matrícula exige endereço residencial válido em Vitória/ES.')
    data.cep = cep
    verifiedAddress = { district: address.bairro || null, street: address.logradouro || null, addressComplement: address.complemento || null, municipality: address.localidade || null, state: address.uf || null, region: address.regiao || null, ibgeCode: address.ibge || null, ddd: address.ddd || null }
  } else {
    const cnpj = data.cnpj.replace(/\D/g, '')
    if (cnpj.length !== 14) return reject('Informe o CNPJ da empresa em que trabalha.')
    const company = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`).then(response => response.ok ? response.json() : null).catch(() => null)
    if (!company || company.uf !== 'ES' || company.municipio?.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase() !== 'VITORIA' || company.descricao_situacao_cadastral !== 'ATIVA') return reject('O CNPJ deve estar ativo e possuir endereço em Vitória/ES.')
    data.cnpj = cnpj
    data.cep = String(company.cep || '').replace(/\D/g, '')
    verifiedAddress = { district: company.bairro || null, street: company.logradouro || null, addressComplement: company.complemento || null, municipality: company.municipio || null, state: company.uf || null, region: null, ibgeCode: company.codigo_municipio?.toString() || null, ddd: company.ddd_telefone_1?.replace(/\D/g, '').slice(0, 2) || null }
  }
  const target = await prisma.classOffering.findUnique({ where: { id: data.classId }, include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'APPROVED'] } } } } } } })
  if (!target || target.status !== 'OPEN') return reject('Turma indisponível para inscrição.')
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1))
  const yearlyEnrollments = await prisma.enrollment.count({ where: { cpf: data.cpf, createdAt: { gte: yearStart }, status: { not: 'CANCELLED' } } })
  if (yearlyEnrollments >= 3) return reject('Limite anual atingido: são permitidas até 3 inscrições por CPF por ano.')
  const status = target._count.enrollments >= target.capacity ? 'WAITLIST' : 'PENDING'
  const user = authenticatedUser
  const saved = await prisma.enrollment.create({ data: { classId: data.classId, userId: user?.id, name: data.name, email: data.email.toLowerCase(), cpf: data.cpf, phone: data.phone, eligibilityType: data.eligibilityType, cep: data.cep, ...verifiedAddress, cnpj: data.cnpj || null, race: data.race, birthDate: data.birthDate, gender: data.gender, education: data.education, disability: data.disability || null, accessibilityNeeds: data.accessibilityNeeds || null, companionNeeds: data.companionNeeds || null, rgDocumentPath: req.file?.filename || previousEnrollment?.rgDocumentPath || null, lgpdAcceptedAt: new Date(), commitmentAcceptedAt: new Date(), termsVersion: '2026.1', status } })
  res.status(201).json({ id: saved.id, status, message: status === 'WAITLIST' ? 'Você entrou na lista de espera.' : 'Inscrição realizada.' })
}))
app.post('/api/course-availability-notices', optionalAuth, route(async (req, res) => {
  const data = parse(z.object({ courseId: z.string().uuid(), phone: z.string().trim().min(8).max(30).optional() }), req.body)
  const user = req.auth ? await prisma.user.findUnique({ where: { id: req.auth.sub }, select: { id: true, enrollments: { where: { status: { not: 'CANCELLED' } }, orderBy: { createdAt: 'desc' }, take: 1, select: { phone: true } } } }) : null
  const phone = data.phone || user?.enrollments[0]?.phone || ''
  if (!phone) return res.status(400).json({ message: 'Informe um telefone para receber o aviso.' })
  const course = await prisma.course.findUnique({ where: { id: data.courseId }, select: { id: true, name: true } })
  if (!course) return res.status(404).json({ message: 'Curso não encontrado.' })
  await prisma.courseAvailabilityNotice.upsert({
    where: { courseId_phone: { courseId: course.id, phone } },
    update: { userId: user?.id || null },
    create: { courseId: course.id, userId: user?.id || null, phone },
  })
  res.status(201).json({ message: `Pronto! Avisaremos você quando ${course.name} estiver disponível.` })
}))
app.post('/api/interests', route(async (req, res) => {
  const d = parse(z.object({ nome: z.string().min(2).max(120), bairro: z.string().min(2).max(120), curso: z.string().min(2).max(160), contato: z.string().max(160).optional().default('') }), req.body)
  const saved = await prisma.suggestion.create({ data: { name: d.nome, district: d.bairro, course: d.curso, contact: d.contato || null } })
  res.status(201).json({ id: saved.id, message: 'Sugestão registrada.' })
}))
app.post('/api/satisfaction', route(async (req, res) => {
  const d = parse(z.object({ rating: z.coerce.number().int().min(1).max(5), recommend: z.enum(['sim', 'regular', 'nao']), comment: z.string().max(1000).optional().default('') }), req.body)
  const saved = await prisma.evaluation.create({ data: { ...d, comment: d.comment || null } })
  res.status(201).json({ id: saved.id, message: 'Avaliação registrada.' })
}))

app.get('/api/student/dashboard', auth, route(async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.auth.sub },
    select: {
      id: true, name: true, email: true,
      enrollments: {
        include: {
          certificate: true,
          class: {
            include: {
              sessions: { orderBy: { startsAt: 'asc' } },
              course: { include: { curriculum: { orderBy: { position: 'asc' } } } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  res.json({ student: user })
}))

app.use('/api/admin', admin)
app.get('/api/admin/dashboard', route(async (_req, res) => {
  const [users, courses, classes, enrollments, suggestions, evaluations, avg] = await Promise.all([prisma.user.count(), prisma.course.count(), prisma.classOffering.count(), prisma.enrollment.count(), prisma.suggestion.count(), prisma.evaluation.count(), prisma.evaluation.aggregate({ _avg: { rating: true } })])
  res.json({ users, courses, classes, enrollments, suggestions, evaluations, averageRating: avg._avg.rating || 0 })
}))
app.get('/api/admin/users', route(async (_req, res) => res.json({ users: await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, active: true, createdAt: true }, orderBy: { createdAt: 'desc' } }) })))
app.patch('/api/admin/users/:id', route(async (req, res) => res.json({ user: await prisma.user.update({ where: { id: req.params.id }, data: parse(z.object({ role: z.enum(['ADMIN', 'STUDENT']).optional(), active: z.boolean().optional() }), req.body), select: { id: true, name: true, email: true, role: true, active: true } }) })))
app.get('/api/admin/courses', route(async (_req, res) => res.json({ courses: await prisma.course.findMany({ include: { classes: true }, orderBy: { name: 'asc' } }) })))
app.post('/api/admin/courses', route(async (req, res) => res.status(201).json({ course: await prisma.course.create({ data: parse(courseInput, req.body) }) })))
app.put('/api/admin/courses/:id', route(async (req, res) => res.json({ course: await prisma.course.update({ where: { id: req.params.id }, data: parse(courseInput, req.body) }) })))
app.delete('/api/admin/courses/:id', route(async (req, res) => { await prisma.course.delete({ where: { id: req.params.id } }); res.status(204).end() }))
app.get('/api/admin/classes', route(async (_req, res) => res.json({ classes: await prisma.classOffering.findMany({ include: { course: { select: { name: true } }, _count: { select: { enrollments: true } } }, orderBy: { createdAt: 'desc' } }) })))
app.post('/api/admin/classes', route(async (req, res) => res.status(201).json({ class: await prisma.classOffering.create({ data: parse(classInput, req.body) }) })))
app.put('/api/admin/classes/:id', route(async (req, res) => res.json({ class: await prisma.classOffering.update({ where: { id: req.params.id }, data: parse(classInput, req.body) }) })))
app.get('/api/admin/enrollments', route(async (_req, res) => res.json({ enrollments: await prisma.enrollment.findMany({ include: { class: { include: { course: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } }) })))
app.get('/api/admin/enrollments/:id/rg', route(async (req, res) => {
  const enrollment = await prisma.enrollment.findUniqueOrThrow({ where: { id: req.params.id }, select: { rgDocumentPath: true } })
  if (!enrollment.rgDocumentPath) return res.status(404).json({ message: 'Documento não encontrado.' })
  res.sendFile(path.join(privateUploads, path.basename(enrollment.rgDocumentPath)))
}))
app.patch('/api/admin/enrollments/:id', route(async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['PENDING', 'APPROVED', 'WAITLIST', 'CANCELLED', 'COMPLETED']) }), req.body)
  const enrollment = await prisma.enrollment.update({ where: { id: req.params.id }, data: { status } })
  if (status === 'COMPLETED') {
    await prisma.certificate.upsert({ where: { enrollmentId: enrollment.id }, update: {}, create: { enrollmentId: enrollment.id, code: `QV-${new Date().getUTCFullYear()}-${enrollment.id.slice(0, 8).toUpperCase()}` } })
  }
  res.json({ enrollment })
}))
app.get('/api/admin/suggestions', route(async (_req, res) => res.json({ suggestions: await prisma.suggestion.findMany({ orderBy: { createdAt: 'desc' } }) })))
app.patch('/api/admin/suggestions/:id', route(async (req, res) => res.json({ suggestion: await prisma.suggestion.update({ where: { id: req.params.id }, data: parse(z.object({ reviewed: z.boolean() }), req.body) }) })))
app.get('/api/admin/evaluations', route(async (_req, res) => res.json({ evaluations: await prisma.evaluation.findMany({ orderBy: { createdAt: 'desc' } }) })))

app.use(express.static(dist))
app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
app.use((error, _req, res, _next) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'A imagem do RG deve ter no máximo 5 MB.'
      : 'Não foi possível receber a imagem do RG.'
    return res.status(400).json({ message })
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ message: 'Este registro já existe.' })
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ message: 'Registro não encontrado.' })
  console.error(error)
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível processar a solicitação.' })
})

const server = app.listen(port, '0.0.0.0', () => console.log(`QualificaVix disponível em http://localhost:${port}`))
const stop = async () => { await prisma.$disconnect(); server.close(() => process.exit(0)) }
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
