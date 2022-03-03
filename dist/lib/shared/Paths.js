"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaStorage = exports.prismaExec = exports.prismaClient = void 0;
const path_1 = __importDefault(require("path"));
const isDev = process.env.MODULE_DEV === 'true';
const node_modules = isDev ? path_1.default.join(__dirname, '..', '..', '..', 'node_modules') : path_1.default.join(process.cwd(), 'node_modules');
const prismaExec = path_1.default.join(node_modules, 'prisma', 'build', 'index.js');
exports.prismaExec = prismaExec;
const prismaStorage = path_1.default.dirname(__dirname).replace(/(dist.*)/, 'prisma');
exports.prismaStorage = prismaStorage;
const prismaClient = path_1.default.join(node_modules, '.prisma', 'client');
exports.prismaClient = prismaClient;
//# sourceMappingURL=Paths.js.map