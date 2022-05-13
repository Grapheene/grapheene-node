import path from 'path';
import {constants as fsConstants, promises as fs, existsSync} from 'fs';
import {execSync as exec, spawnSync as spawn} from "child_process";
import {prismaClient, prismaExec, prismaStorage} from './shared/Paths'

const {prefix, postfix} = require('../../prisma/schemas/sqlite.prisma');
const dbUri = process.env.DATABASE_URL;

export const DatabaseGenerator = async (options: any) => {
        const setupDb = async (options: any) => {
            const prismaSchema = path.join(prismaStorage, 'schema.prisma');

            // Only remove the prisma schema if it exists
            if (options.resetDb) {
                console.log('Reseting DB\n')
                await fs.access(prismaSchema, fsConstants.F_OK);
                await fs.unlink(prismaSchema)
            }
            try {
                if (options.dbProvider === 'sqlite' && (!existsSync(path.join(options.dir, 'grapheene.db')) || !existsSync(path.join(prismaClient, 'schema.prisma')))) {
                    process.stdout.write('\rSetting up the database...\n');
                    const dbPath = path.join(options.dir, 'grapheene.db');
                    const sqlitePrisma = `${prefix}
  url      = "file:${dbPath}"
${postfix}`

                    await fs.writeFile(path.join(prismaStorage, 'schema.prisma'), sqlitePrisma);
                    await run(`${prismaExec} generate --schema "${prismaSchema}"`);
                    await run(`${prismaExec} migrate deploy --schema "${prismaSchema}"`);
                    process.stdout.write('done!\n');
                }
                if (dbUri) {
                    if (dbUri.match(/^mongodb/)) {
                        process.stdout.write('\rSetting up the database...\n');
                        await fs.copyFile(path.join(prismaStorage, 'schemas', 'mongo.prisma'), prismaSchema);
                        await run(`${prismaExec} generate --schema "${prismaSchema}"`);
                        process.stdout.write('done!\n');

                    } else if (dbUri.match(/^post/)) {
                        process.stdout.write('\rSetting up the database...\n')
                        await fs.copyFile(path.join(prismaStorage, 'schemas', 'postgres.prisma'), prismaSchema);
                        await run(`${prismaExec} generate --schema "${prismaSchema}"`);

                        try {
                            await fs.access(path.join(prismaStorage, 'migrations'), fsConstants.F_OK);
                        } catch (e) {
                            // Migrations don't exist, run them
                            if (options.db.migrate) {
                                await run(`${prismaExec} migrate deploy --schema "${prismaSchema}"`);
                            }
                        }
                        process.stdout.write('done!\n');
                    }
                }

                let dbReady = false;
                while (!dbReady) {
                    await fs.access(path.join(prismaClient, 'schema.prisma'))
                    dbReady = true;
                }

                // NOTE: this require has to be here to prevent using the cached unusable Prisma client
                const {PrismaClient} = require('@prisma/client');

                return new PrismaClient();
            } catch
                (e) {
                console.log(e.message)
            }
        }

        const run = async (command: string, interactive?: boolean) => {
            let buff;
            if (!interactive) {
                buff = exec(command);
            } else {
                buff = spawn(command);
            }


            const result = buff.toString();
            const retObj: any = {
                error: null,
                result: null
            }
            if (result.match(/^error/i)) {
                retObj.error = result;
                console.error(`Unable to run ${command}:`, retObj.error);
                return retObj
            } else {
                retObj.result = result;
                return retObj
            }
        }

        let db: any;
        if (dbUri) {
            console.log('Custom DATABASE_URL provided')
            db = await setupDb(options);
        } else {
            console.log('No custom DATABASE_URL provided, using a default SQLite local db')
            console.log('    Set DATABASE_URL env if you want to use your own PostgreSQL db')
            db = await setupDb({...options, dbProvider: 'sqlite'})
        }
        return db;
    }
;
