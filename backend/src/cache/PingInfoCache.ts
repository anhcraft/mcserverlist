import {cyrb53} from "../utils/Hash";
import NodeCache from "./NodeCache";
import axios from "axios";

export class PingInfoCache {
    private data = new NodeCache({
        stdTTL: 60 * 5,
        checkperiod: 60
    });

    public request(ip: string, port: number, callback: any) {
        const hash = cyrb53(ip, port);
        const info = this.data.get(hash);
        if(info == undefined) {
            axios.get(`https://api.mcsrvstat.us/2/${ip}:${port}`).then((res) => {
                callback(res.data);
                this.data.set(hash, res.data);
            }).catch((err) => {
                callback(undefined);
                console.error(err);
            });
        } else {
            callback(info);
        }
    }
}
