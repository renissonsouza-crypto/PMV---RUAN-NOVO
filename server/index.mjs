import express from 'express'
import path from 'node:path'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient, Prisma } from '@prisma/client'
import { z } from 'zod'

const app = express()
const prisma = new PrismaClient()
const port = Number(process.env.PORT || 3001)
const secret = process.env.JWT_SECRET || 'chave-apenas-para-desenvolvimento-local'
const dist = path.resolve('dist')

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
const admin = (req, res, next) => auth(req, res, () => req.auth.role === 'ADMIN' ? next() : res.status(403).json({ message: 'Acesso restrito.' }))
const userView = ({ id, name, email, role, active }) => ({ id, name, email, role, active })
const periods = { MORNING: 'Diurno', AFTERNOON: 'Vespertino', EVENING: 'Noturno' }
const statuses = { OPEN: 'abertas', LAST_SPOTS: 'ultimas-vagas', COMING_SOON: 'breve', CLOSED: 'breve' }
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
  const user = await prisma.user.create({ data: { name: data.name, email: data.email.toLowerCase(), passwordHash: await bcrypt.hash(data.password, 12) } })
  res.status(201).json({ token: jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' }), user: userView(user) })
}))
app.post('/api/auth/login', route(async (req, res) => {
  const data = parse(credentials, req.body)
  const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } })
  if (!user?.active || !(await bcrypt.compare(data.password, user.passwordHash))) return res.status(401).json({ message: 'E-mail ou senha inválidos.' })
  res.json({ token: jwt.sign({ sub: user.id, role: user.role }, secret, { expiresIn: '8h' }), user: userView(user) })
}))
app.get('/api/auth/me', auth, route(async (req, res) => res.json({ user: userView(await prisma.user.findUniqueOrThrow({ where: { id: req.auth.sub } })) })))

const courseInclude = { classes: { include: { _count: { select: { enrollments: true } } }, orderBy: { createdAt: 'desc' } } }
app.get('/api/courses', route(async (_req, res) => res.json({ courses: (await prisma.course.findMany({ where: { published: true }, include: courseInclude, orderBy: { name: 'asc' } })).map(courseView) })))
app.get('/api/courses/:slug', route(async (req, res) => {
  const course = await prisma.course.findFirst({ where: { slug: req.params.slug, published: true }, include: courseInclude })
  course ? res.json({ course: courseView(course) }) : res.status(404).json({ message: 'Curso não encontrado.' })
}))
app.post('/api/enrollments', route(async (req, res) => {
  const data = parse(z.object({ classId: z.string().uuid(), name: z.string().trim().min(2).max(120), email: z.string().email().max(160), cpf: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 11, 'CPF inválido.'), phone: z.string().min(8).max(30), district: z.string().min(2).max(120) }), req.body)
  const target = await prisma.classOffering.findUnique({ where: { id: data.classId }, include: { _count: { select: { enrollments: { where: { status: { in: ['PENDING', 'APPROVED'] } } } } } } })
  if (!target || target.status !== 'OPEN') return res.status(400).json({ message: 'Turma indisponível para inscrição.' })
  const status = target._count.enrollments >= target.capacity ? 'WAITLIST' : 'PENDING'
  const saved = await prisma.enrollment.create({ data: { ...data, status } })
  res.status(201).json({ id: saved.id, status, message: status === 'WAITLIST' ? 'Você entrou na lista de espera.' : 'Inscrição realizada.' })
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
app.patch('/api/admin/enrollments/:id', route(async (req, res) => res.json({ enrollment: await prisma.enrollment.update({ where: { id: req.params.id }, data: parse(z.object({ status: z.enum(['PENDING', 'APPROVED', 'WAITLIST', 'CANCELLED', 'COMPLETED']) }), req.body) }) })))
app.get('/api/admin/suggestions', route(async (_req, res) => res.json({ suggestions: await prisma.suggestion.findMany({ orderBy: { createdAt: 'desc' } }) })))
app.patch('/api/admin/suggestions/:id', route(async (req, res) => res.json({ suggestion: await prisma.suggestion.update({ where: { id: req.params.id }, data: parse(z.object({ reviewed: z.boolean() }), req.body) }) })))
app.get('/api/admin/evaluations', route(async (_req, res) => res.json({ evaluations: await prisma.evaluation.findMany({ orderBy: { createdAt: 'desc' } }) })))

app.use(express.static(dist))
app.get('/{*path}', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
app.use((error, _req, res, _next) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ message: 'Este registro já existe.' })
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ message: 'Registro não encontrado.' })
  console.error(error)
  res.status(error.status || 500).json({ message: error.status ? error.message : 'Não foi possível processar a solicitação.' })
})

const server = app.listen(port, '0.0.0.0', () => console.log(`QualificaVix disponível em http://localhost:${port}`))
const stop = async () => { await prisma.$disconnect(); server.close(() => process.exit(0)) }
process.on('SIGTERM', stop)
process.on('SIGINT', stop)
