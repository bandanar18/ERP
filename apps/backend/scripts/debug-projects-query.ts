import dotenv from 'dotenv'

async function main() {
  dotenv.config({ path: '../../.env' })
  const { prisma } = await import('../src/prisma/prisma')
  try {
    const projects = await prisma.pmProject.findMany({
      include: {
        pm_users: { select: { id: true, email: true, firstName: true, lastName: true } },
        pm_companies: { select: { id: true, name: true } },
        pm_financial_valuations: true,
        pm_physical_progress: { orderBy: { date: 'desc' }, take: 1 },
        pm_obligations: { include: { payments: true } },
        pm_expenses: true,
        pm_collections: true,
      },
      orderBy: [{ pm_companies: { name: 'asc' } }, { code: 'asc' }],
      take: 2,
    })
    console.log('OK sample', projects.length)
    const started = Date.now()
    const all = await prisma.pmProject.findMany({
      include: {
        pm_users: { select: { id: true, email: true, firstName: true, lastName: true } },
        pm_companies: { select: { id: true, name: true } },
        pm_financial_valuations: true,
        pm_physical_progress: { orderBy: { date: 'desc' }, take: 1 },
        pm_obligations: { include: { payments: true } },
        pm_expenses: true,
        pm_collections: true,
      },
      orderBy: [{ pm_companies: { name: 'asc' } }, { code: 'asc' }],
    })
    console.log('OK all', all.length, 'ms', Date.now() - started)
    const { ProjectsService } = await import('../src/features/projects/services/projects.service.ts')
    const service = new ProjectsService()
    const mappedStarted = Date.now()
    const result = await service.getAllProjectsDetailed()
    console.log('OK mapped', result.projects.length, 'ms', Date.now() - mappedStarted)
    try {
      const json = JSON.stringify(result)
      console.log('OK json bytes', json.length)
    } catch (stringifyError: unknown) {
      const err = stringifyError as { message?: string }
      console.error('STRINGIFY_FAIL', err.message)
    }

    const users = await prisma.pmModuleUser.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        status: true,
        pm_user_roles: { select: { pm_roles: { select: { code: true } } } },
      },
    })
    console.log(
      'USERS',
      users.map((u) => ({
        email: u.email,
        username: u.username,
        status: u.status,
        roles: u.pm_user_roles.map((r) => r.pm_roles.code),
      }))
    )

    const jwt = await import('jsonwebtoken')
    for (const user of users) {
      const token = jwt.default.sign(
        { sub: user.id, email: user.email },
        process.env.PM_JWT_SECRET || '',
        { expiresIn: '5m' }
      )
      const response = await fetch('http://127.0.0.1:3000/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const body = await response.text()
      console.log('HTTP', user.email, response.status, body.slice(0, 300))
    }
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; meta?: unknown }
    console.error('QUERY_FAIL')
    console.error('code:', err.code)
    console.error('message:', err.message)
    if (err.meta) console.error('meta:', JSON.stringify(err.meta))
  } finally {
    await prisma.$disconnect()
  }
}

main()
