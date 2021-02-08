import {User} from "../struct/User";
import {UserStorage} from "../storage/UserStorage";
import {DataCache} from "./DataCache";

export class UserCache extends DataCache<User, UserStorage>{}
