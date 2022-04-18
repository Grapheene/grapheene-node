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
const path_1 = __importDefault(require("path"));
const fs_1 = require("fs");
const child_process_1 = require("child_process");
const Paths_1 = require("./shared/Paths");
const { prefix, postfix } = require('../../prisma/schemas/sqlite.prisma');
const dbUri = process.env.DATABASE_URL;
const DatabaseGenerator = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const setupDb = (options) => __awaiter(void 0, void 0, void 0, function* () {
        const prismaSchema = path_1.default.join(Paths_1.prismaStorage, 'schema.prisma');
        // Only remove the prisma schema if it exists
        try {
            yield fs_1.promises.access(prismaSchema, fs_1.constants.F_OK);
            yield fs_1.promises.unlink(prismaSchema);
        }
        catch (e) {
            // do nothing
        }
        process.stdout.write('\rSetting up the database...');
        try {
            if (options.dbProvider === 'sqlite') {
                const dbPath = path_1.default.join(options.dir, 'grapheene.db');
                const sqlitePrisma = `${prefix}
  url      = "file:${dbPath}"
${postfix}`;
                yield fs_1.promises.writeFile(path_1.default.join(Paths_1.prismaStorage, 'schema.prisma'), sqlitePrisma);
                yield run(`${Paths_1.prismaExec} generate --schema "${prismaSchema}"`);
                yield run(`${Paths_1.prismaExec} migrate deploy --schema "${prismaSchema}"`);
            }
            else if (dbUri.match(/^mongodb/)) {
                yield fs_1.promises.copyFile(path_1.default.join(Paths_1.prismaStorage, 'schemas', 'mongo.prisma'), prismaSchema);
                yield run(`${Paths_1.prismaExec} generate --schema "${prismaSchema}"`);
            }
            else if (dbUri.match(/^post/)) {
                yield fs_1.promises.copyFile(path_1.default.join(Paths_1.prismaStorage, 'schemas', 'postgres.prisma'), prismaSchema);
                yield run(`${Paths_1.prismaExec} generate --schema "${prismaSchema}"`);
                try {
                    yield fs_1.promises.access(path_1.default.join(Paths_1.prismaStorage, 'migrations'), fs_1.constants.F_OK);
                }
                catch (e) {
                    // Migrations don't exist, run them
                    if (options.db.migrate) {
                        yield run(`${Paths_1.prismaExec} migrate deploy --schema "${prismaSchema}"`);
                    }
                }
            }
            let dbReady = false;
            while (!dbReady) {
                try {
                    yield fs_1.promises.access(path_1.default.join(Paths_1.prismaClient, 'schema.prisma'));
                    dbReady = true;
                }
                catch (e) {
                    // do nothing
                }
            }
            // NOTE: this require has to be here to prevent using the cached unusable Prisma client
            const { PrismaClient } = require('@prisma/client');
            process.stdout.write('done!\n');
            return new PrismaClient();
        }
        catch (e) {
            console.log(e.message);
        }
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
        console.log('Custom DATABASE_URL provided');
        db = yield setupDb(options);
    }
    else {
        console.log('No custom DATABASE_URL provided, using a default SQLite local db');
        console.log('    Set DATABASE_URL env if you want to use your own PostgreSQL db');
        db = yield setupDb(Object.assign(Object.assign({}, options), { dbProvider: 'sqlite' }));
    }
    return db;
});
exports.DatabaseGenerator = DatabaseGenerator;
//# sourceMappingURL=DatabaseGenerator.js.map