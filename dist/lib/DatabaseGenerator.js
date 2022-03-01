"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseGenerator = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const { prefix, postfix } = require('../../prisma/schemas/sqlite.prisma');
const dbUri = process.env.DATABASE_URL;
const node_modules = `${__dirname}${path_1.default.sep}..${path_1.default.sep}..${path_1.default.sep}node_modules`;
const sep = path_1.default.sep;
const DatabaseGenerator = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const setupDb = (options) => __awaiter(void 0, void 0, void 0, function* () {
        const prismaDir = path_1.default.dirname(__dirname).replace(/(dist.*)/, 'prisma');
        const prismaSchema = `${prismaDir}/schema.prisma`;
        // Only remove the prisma schema if it exists
        try {
            yield fs_1.promises.access(prismaSchema, fs_1.constants.F_OK);
            yield fs_1.promises.unlink(`${prismaDir}/schema.prisma`);
        }
        catch (e) {
            // do nothing
        }
        process.stdout.write('\rSetting up the database...');
        if (options.dbProvider === 'sqlite') {
            const dbPath = `${options.dir}/grapheene.db`;
            const sqlitePrisma = `${prefix}
  url      = "file:${dbPath}"
${postfix}`;
            yield fs_1.promises.writeFile(`${prismaDir}/schema.prisma`, sqlitePrisma);
            yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js generate --schema "${prismaDir}/schema.prisma"`);
            // await run(`${__dirname}${sep}..${sep}..${sep}node_modules${sep}prisma${sep}build${sep}index.js generate --schema "${prismaDir}/schema.prisma"`);
            try {
                yield fs_1.promises.access(dbPath, fs_1.constants.F_OK);
                yield fs_1.promises.access(`${prismaDir}/migrations`, fs_1.constants.F_OK);
            }
            catch (e) {
                // DB or migrations don't exist, run them
                yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js  migrate dev --name init --schema "${prismaDir}/schema.prisma"`);
                yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js  migrate deploy --schema "${prismaDir}/schema.prisma"`);
            }
        }
        else if (dbUri.match(/^mongodb/)) {
            yield fs_1.promises.copyFile(`${prismaDir}/schemas/mongo.prisma`, `${prismaDir}/schema.prisma`);
            yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js generate --schema "${prismaDir}/schema.prisma"`);
        }
        else if (dbUri.match(/^post/)) {
            yield fs_1.promises.copyFile(`${prismaDir}/schemas/postgres.prisma`, `${prismaDir}/schema.prisma`);
            yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js generate --schema "${prismaDir}/schema.prisma"`);
            try {
                yield fs_1.promises.access(`${prismaDir}/migrations`, fs_1.constants.F_OK);
            }
            catch (e) {
                // Migrations don't exist, run them
                if (options.db.migrate) {
                    yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js  migrate dev --name init --schema "${prismaDir}/schema.prisma"`);
                    yield run(`${node_modules}${sep}prisma${sep}build${sep}index.js  migrate deploy --schema "${prismaDir}/schema.prisma"`);
                }
            }
        }
        let dbReady = false;
        while (!dbReady) {
            try {
                yield fs_1.promises.access(`${node_modules}${sep}.prisma${sep}client${sep}schema.prisma`);
                dbReady = true;
            }
            catch (e) {
                // do nothing
            }
        }
        process.stdout.write('done!\n');
        return new client_1.PrismaClient();
    });
    const run = (command, interactive) => __awaiter(void 0, void 0, void 0, function* () {
        let buff;
        if (!interactive) {
            buff = (0, child_process_1.execSync)(command);
        }
        else {
            buff = (0, child_process_1.spawnSync)(command);
        }
        const result = buff.toString();
        const retObj = {
            error: null,
            result: null
        };
        if (result.match(/^error/i)) {
            retObj.error = result;
            console.error(`Unable to run ${command}:`, retObj.error);
            return retObj;
        }
        else {
            retObj.result = result;
            return retObj;
        }
    });
    let db;
    if (dbUri) {
        console.log('Custom DB URI provided');
        db = yield setupDb(options);
    }
    else {
        console.log('No DB URI provided, using a default SQLite local db');
        db = yield setupDb(Object.assign(Object.assign({}, options), { dbProvider: 'sqlite' }));
    }
    return db;
});
exports.DatabaseGenerator = DatabaseGenerator;
//# sourceMappingURL=DatabaseGenerator.js.map