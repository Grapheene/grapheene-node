"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaStorage = exports.prismaExec = exports.prismaClient = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// from https://github.com/lexoyo/node_modules-path
const pwd = __dirname.split(path_1.default.sep);
const getPath = (moduleName, folder = pwd) => {
    if (folder.length < 1) {
        logError(moduleName, folder);
        return null;
    }
    const nodeModulesPath = folder.concat(["node_modules"]).join(path_1.default.sep);
    const p = moduleName
        ? path_1.default.join(nodeModulesPath, moduleName)
        : nodeModulesPath;
    if (fs_1.default.existsSync(p)) {
        return nodeModulesPath;
    }
    const res = getPath(moduleName, folder.slice(0, -1));
    if (!res) {
        logError(moduleName, folder);
    }
    return res;
};
const logError = (moduleName, folder) => {
    console.error(`Could not find the node_modules folder ${moduleName ? "which contains " + moduleName : ""} in ${folder.join(path_1.default.sep)}`);
};
const node_modules = getPath();
const prismaExec = path_1.default.join(node_modules, 'prisma', 'build', 'index.js');
exports.prismaExec = prismaExec;
const prismaStorage = path_1.default.dirname(__dirname).replace(/(dist.*)/, 'prisma');
exports.prismaStorage = prismaStorage;
const prismaClient = path_1.default.join(node_modules, '.prisma', 'client');
exports.prismaClient = prismaClient;
//# sourceMappingURL=Paths.js.map