import {Storage} from "./Storage";
import {User} from "../struct/User";

export class UserStorage extends Storage<User> {
    getDataDir(): string {
        return "./data/users/";
    }

    getBinDir(): string {
        return "./bin/users/";
    }
}
