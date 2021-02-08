export class Server {
    public id: string;
    public name: string;
    public intro: string;
    public ip: string;
    public port: number;
    public website: string;
    public tags: string[];
    public creator: string;
    public createdDate: number;
    public diffPing: boolean;
    public pingIp: string;
    public pingPort: number;

    constructor(id: string, data: any = undefined) {
        this.id = id;
        if (data !== undefined) {
            Object.assign(this, data);
        }
    }
}
