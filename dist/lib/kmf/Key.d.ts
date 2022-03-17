import { PrismaClient } from "@prisma/client";
import { KeyOptions } from "../../../index";
export default class Key {
    uuid: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    data?: any;
    private readonly _db;
    constructor(options: KeyOptions, DB: PrismaClient);
    private save;
    load(type: 'privateKey' | 'publicKey'): Promise<string>;
    destroy(): Promise<string>;
}
