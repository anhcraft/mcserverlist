export class User {
    public id: string;
    public username: string;
    public lastLogin: number;

    constructor(id: string, data: any = undefined) {
        this.id = id;
        if (data !== undefined) {
            Object.assign(this, data);
        }
    }
}
