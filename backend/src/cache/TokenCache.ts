import crypto from "crypto";
import NodeCache from "./NodeCache";

export class TokenCache {
    private data = new NodeCache({
        stdTTL: 60 * 60 * 24 * 3,
        checkperiod: 60 * 60
    });

    public isValidToken(id: string | undefined, token: string | undefined): boolean {
        if(id == undefined || token == undefined) return false;
        const tkn = this.data.get(id);
        return tkn != undefined && tkn === token;
    }

    public generateToken(id: string): string {
        const tkn = crypto.randomBytes(20).toString('hex');
        this.data.set(id, tkn);
        return tkn;
    }

    public destroyToken(id: string) {
        this.data.del(id);
    }
}
