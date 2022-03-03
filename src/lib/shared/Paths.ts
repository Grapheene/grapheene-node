import path from 'path'

const isDev = process.env.MODULE_DEV === 'true'
const node_modules = isDev ? path.join(__dirname, '..', '..', '..', 'node_modules') : path.join(process.cwd(), 'node_modules')

const prismaExec = path.join(node_modules, 'prisma', 'build', 'index.js')
const prismaStorage = path.dirname(__dirname).replace(/(dist.*)/, 'prisma')
const prismaClient = path.join(node_modules, '.prisma', 'client')

export {
    prismaClient,
    prismaExec,
    prismaStorage,
}
