import * as fs from "fs";

export abstract class Storage<T> {
    private names: string[] = [];

    constructor() {
        fs.mkdir(this.getDataDir(), { recursive: true }, (err) => {
            if (err) throw err;
        });
        fs.mkdir(this.getBinDir(), { recursive: true }, (err) => {
            if (err) throw err;
        });
        fs.readdir(this.getDataDir(), (err, files) => {
            if (!err && files != undefined) {
                for (const file of files) {
                    this.names.push(file);
                }
            }
        });
    }

    abstract getDataDir(): string;
    abstract getBinDir(): string;

    public load(name: string, callback: any) {
        fs.readFile(this.getDataDir() + name, (err, data) => {
            if (!err) {
                callback(JSON.parse(data.toString()));
            } else {
                callback(undefined);
            }
        });
    }

    public save(name: string, data: T, callback: any) {
        fs.writeFile(this.getDataDir() + name, JSON.stringify(data), {
            flag: "wx"
        }, (err) => {
            if(!err) {
                this.names.push(name);
            }
            callback(!err);
        });
    }

    public delete(name: string, callback: any) {
        fs.rename(this.getDataDir() + name, this.getBinDir() + name, (err) => {
            if(!err) {
                const index = this.names.indexOf(name);
                if (index > -1) {
                    this.names.splice(index, 1);
                }
            }
            callback(!err);
        });
    }

    public list(): string[] {
        return this.names.slice(0, this.names.length);
    }
}
