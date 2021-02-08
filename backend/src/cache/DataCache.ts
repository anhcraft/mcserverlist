import {Storage} from "../storage/Storage";
import NodeCache from "./NodeCache";

export abstract class DataCache<T, S extends Storage<T>> {
    private data = new NodeCache({
        stdTTL: 60 * 60,
        checkperiod: 60 * 15
    });
    private storage: S;

    constructor(storage: S) {
        this.storage = storage;
        this.data.on("del", function(this: DataCache<T, S>, key: string, value: T){
            this.storage.save(key, value, function (this: DataCache<T, S>, res: boolean) {
                if(!res) {
                    this.set(key, value);
                }
            }.bind(this));
        }.bind(this));
    }

    public get(id: string): T | undefined {
        return this.data.get(id);
    }

    public set(id: string, data: T) {
        this.data.set(id, data);
    }

    public del(id: string) {
        this.data.del(id);
    }

    public request(id: string, ifAbsent: any | null, callback: any) {
        const data = this.get(id);
        if(data == undefined) {
            this.storage.load(id, function (this: DataCache<T, S>, res: T) {
                if(res == undefined) {
                    if(ifAbsent == null){
                        callback(res);
                        return;
                    }
                    res = ifAbsent(id);
                }
                this.set(id, res);
                callback(res);
            }.bind(this));
        } else {
            callback(data);
        }
    }

    public saveAll(){
        for(const k of this.data.keys()){
            const v = this.get(k);
            if(v == undefined) continue;
            this.storage.save(k, v, () => {});
        }
    }
}
