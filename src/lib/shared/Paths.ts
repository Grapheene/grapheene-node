import path from 'path'
import fs from 'fs'

// from https://github.com/lexoyo/node_modules-path
const pwd = __dirname.split(path.sep);
const getPath = (moduleName?: string, folder: string[] = pwd) => {
    if (folder.length < 1) {
        logError(moduleName, folder);
        return null;
    }
    const nodeModulesPath = folder.concat(["node_modules"]).join(path.sep);
    const p = moduleName
        ? path.join(nodeModulesPath, moduleName)
        : nodeModulesPath;
    if (fs.existsSync(p)) {
        return nodeModulesPath;
    }
    const res:string = getPath(moduleName, folder.slice(0, -1));
    if (!res) {
        logError(moduleName, folder);
    }
    return res;
};
const logError = (moduleName: string, folder: string[] | null) => {
    console.error(
        `Could not find the node_modules folder ${
            moduleName ? "which contains " + moduleName : ""
        } in ${folder.join(path.sep)}`
    );
}

const node_modules = getPath()

const prismaExec = path.join(node_modules, 'prisma', 'build', 'index.js')
const prismaStorage = path.dirname(__dirname).replace(/(dist.*)/, 'prisma')
const prismaClient = path.join(node_modules, '.prisma', 'client')

export {
    prismaClient,
    prismaExec,
    prismaStorage,
}
