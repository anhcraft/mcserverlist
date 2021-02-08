import {Server} from "../struct/Server";
import {ServerStorage} from "../storage/ServerStorage";
import {DataCache} from "./DataCache";

export class ServerCache extends DataCache<Server, ServerStorage>{}
