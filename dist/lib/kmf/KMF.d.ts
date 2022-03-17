import Rest from "../rest/Rest";
import KeyRing from "./KeyRing";
import { PrismaClient } from "@prisma/client";
export declare class KMF {
    private readonly _restClient;
    private readonly _db;
    private _ring;
    constructor(RestClient: Rest, DB: PrismaClient);
    set ring(keyRing: KeyRing);
    get ring(): KeyRing;
    destroy(): Promise<import("axios").AxiosResponse<any, any>>;
}
