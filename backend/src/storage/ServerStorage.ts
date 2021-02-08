import {Storage} from "./Storage";
import {Server} from "../struct/Server";

export class ServerStorage extends Storage<Server> {
    getDataDir(): string {
        return "./data/servers/";
    }

    getBinDir(): string {
        return "./bin/servers/";
    }
}
