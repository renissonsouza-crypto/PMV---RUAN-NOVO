import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const courses = [
  ['prog-web', 'Programação Web', 'Tecnologia', 'tecnologia', 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=480&fit=crop&auto=format', 'UB1O30fR-EE', 'HTML, CSS, JavaScript e React do zero. Projetos práticos e portfólio ao final do curso.', 'OPEN', '4 meses', 160, 'R$ 3.200 – R$ 6.500', ['primeiro-emprego', 'mudanca-profissao'], '#3b82f6', 'EVENING', 40],
  ['design-grafico', 'Design Gráfico', 'Criatividade', 'criatividade', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=480&fit=crop&auto=format', '_9mTJ84uL1Q', 'Canva, Photoshop e Illustrator para criar identidades visuais e peças para redes sociais.', 'LAST_SPOTS', '3 meses', 120, 'R$ 2.400 – R$ 5.000', ['primeiro-emprego', 'empreender', 'mudanca-profissao'], '#8b5cf6', 'AFTERNOON', 40],
  ['gestao-empresarial', 'Gestão Empresarial', 'Negócios', 'negocios', 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&h=480&fit=crop&auto=format', 'NU_1StN5Tkk', 'Planejamento estratégico, finanças e liderança para quem quer abrir ou crescer no próprio negócio.', 'OPEN', '5 meses', 200, 'R$ 4.000 – R$ 9.000', ['empreender', 'atualizacao'], '#f97316', 'MORNING', 35],
  ['gastronomia', 'Gastronomia e Culinária', 'Gastronomia', 'gastronomia', 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=480&fit=crop&auto=format', 'pCZSZZTNuc4', 'Da técnica básica à alta culinária com chefs experientes.', 'COMING_SOON', '3 meses', 120, 'R$ 2.000 – R$ 4.500', ['primeiro-emprego', 'empreender'], '#f59e0b', 'MORNING', 30],
  ['eletricista', 'Eletricista Predial', 'Construção Civil', 'construcao', 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=480&fit=crop&auto=format', 'NeQY0lrXMH8', 'Instalações elétricas conforme ABNT, segurança e práticas em laboratório.', 'OPEN', '2 meses', 80, 'R$ 2.800 – R$ 5.500', ['primeiro-emprego', 'mudanca-profissao'], '#f59e0b', 'EVENING', 25],
  ['marketing-digital', 'Marketing Digital', 'Marketing', 'marketing', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=480&fit=crop&auto=format', 'nU-IIXBWlS4', 'Google Ads, SEO, redes sociais e métricas para negócios digitais.', 'LAST_SPOTS', '3 meses', 120, 'R$ 2.800 – R$ 6.000', ['empreender', 'atualizacao', 'mudanca-profissao'], '#06b6d4', 'AFTERNOON', 40],
  ['assistente-adm', 'Assistente Administrativo', 'Administração', 'negocios', 'https://images.unsplash.com/photo-1555725305-e823b44548de?w=800&h=480&fit=crop&auto=format', 'OvKCESe3VlM', 'Excel avançado, rotinas administrativas, documentos e comunicação corporativa.', 'OPEN', '2 meses', 80, 'R$ 1.800 – R$ 3.200', ['primeiro-emprego', 'atualizacao'], '#3b82f6', 'MORNING', 50],
  ['costura-moda', 'Costura e Moda', 'Moda', 'moda', 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=480&fit=crop&auto=format', 'xq_sYLHMGHY', 'Modelagem, montagem de peças e criação de coleções.', 'COMING_SOON', '4 meses', 160, 'R$ 1.800 – R$ 3.800', ['primeiro-emprego', 'empreender', 'mudanca-profissao'], '#f43f5e', 'AFTERNOON', 20],
]

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@qualificavix.local').toLowerCase()
  const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123456', 12)

  await prisma.user.upsert({
    where: { email },
    update: { name: 'Administrador', passwordHash, role: 'ADMIN', active: true },
    create: { name: 'Administrador', email, passwordHash, role: 'ADMIN' },
  })

  for (const [slug, name, area, areaKey, image, videoId, synopsis, status, duration, workload, salaryRange, indicatedFor, accentColor, period, capacity] of courses) {
    const course = await prisma.course.upsert({
      where: { slug },
      update: { name, area, areaKey, image, videoId, synopsis, status, duration, workload, salaryRange, indicatedFor, accentColor },
      create: { slug, name, area, areaKey, image, videoId, synopsis, status, duration, workload, salaryRange, indicatedFor, accentColor },
    })
    let courseClass = await prisma.classOffering.findFirst({ where: { courseId: course.id } })
    if (!courseClass) {
      courseClass = await prisma.classOffering.create({
        data: { courseId: course.id, name: `Turma 2026 - ${name}`, period, capacity, status: status === 'COMING_SOON' ? 'DRAFT' : 'OPEN', location: 'Vitória - ES' },
      })
    }

    const moduleWorkload = Math.floor(Number(workload) / 4)
    const modules = [
      ['Fundamentos e introdução', `Conceitos essenciais e panorama profissional de ${name}.`],
      ['Ferramentas e técnicas', `Uso orientado das principais ferramentas e técnicas de ${name}.`],
      ['Prática profissional', 'Atividades práticas, resolução de problemas e trabalho em equipe.'],
      ['Projeto de conclusão', 'Desenvolvimento e apresentação de um projeto aplicado.'],
    ]
    for (const [index, [title, description]] of modules.entries()) {
      await prisma.curriculumModule.upsert({
        where: { courseId_position: { courseId: course.id, position: index + 1 } },
        update: { title, description, workload: moduleWorkload },
        create: { courseId: course.id, title, description, workload: moduleWorkload, position: index + 1 },
      })
    }

    if (await prisma.classSession.count({ where: { classId: courseClass.id } }) === 0) {
      const hour = period === 'EVENING' ? 18 : period === 'AFTERNOON' ? 13 : 8
      for (let index = 0; index < 8; index++) {
        const startsAt = new Date(Date.UTC(2026, 8, 1 + index * 7, hour, 0))
        const endsAt = new Date(startsAt.getTime() + 3 * 60 * 60 * 1000)
        await prisma.classSession.create({ data: { classId: courseClass.id, title: `Aula ${index + 1} — ${modules[index % modules.length][0]}`, startsAt, endsAt, location: courseClass.location } })
      }
    }
  }
}

main()
  .then(() => console.log('Banco inicializado com cursos e administrador.'))
  .finally(() => prisma.$disconnect())
