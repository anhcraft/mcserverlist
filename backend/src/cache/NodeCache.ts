import {EventEmitter} from "events";
import {setTimeout, clearTimeout} from "timers";

var clone = (function() {
    'use strict';

    function _instanceof(obj, type) {
        return type != null && obj instanceof type;
    }

    var nativeMap;
    try {
        nativeMap = Map;
    } catch(_) {
        // maybe a reference error because no `Map`. Give it a dummy value that no
        // value will ever be an instanceof.
        nativeMap = function() {};
    }

    var nativeSet;
    try {
        nativeSet = Set;
    } catch(_) {
        nativeSet = function() {};
    }

    var nativePromise;
    try {
        nativePromise = Promise;
    } catch(_) {
        nativePromise = function() {};
    }

    /**
     * Clones (copies) an Object using deep copying.
     *
     * This function supports circular references by default, but if you are certain
     * there are no circular references in your object, you can save some CPU time
     * by calling clone(obj, false).
     *
     * Caution: if `circular` is false and `parent` contains circular references,
     * your program may enter an infinite loop and crash.
     *
     * @param `parent` - the object to be cloned
     * @param `circular` - set to true if the object to be cloned may contain
     *    circular references. (optional - true by default)
     * @param `depth` - set to a number if the object is only to be cloned to
     *    a particular depth. (optional - defaults to Infinity)
     * @param `prototype` - sets the prototype to be used when cloning an object.
     *    (optional - defaults to parent prototype).
     * @param `includeNonEnumerable` - set to true if the non-enumerable properties
     *    should be cloned as well. Non-enumerable properties on the prototype
     *    chain will be ignored. (optional - false by default)
     */
    function clone(parent, circular, depth, prototype, includeNonEnumerable) {
        if (typeof circular === 'object') {
            depth = circular.depth;
            prototype = circular.prototype;
            includeNonEnumerable = circular.includeNonEnumerable;
            circular = circular.circular;
        }
        // maintain two arrays for circular references, where corresponding parents
        // and children have the same index
        var allParents: any[] = [];
        var allChildren: any[] = [];

        var useBuffer = typeof Buffer != 'undefined';

        if (typeof circular == 'undefined')
            circular = true;

        if (typeof depth == 'undefined')
            depth = Infinity;

        // recurse this function so we don't reset allParents and allChildren
        function _clone(parent: any, depth: number) {
            // cloning null always returns null
            if (parent === null)
                return null;

            if (depth === 0)
                return parent;

            var child;
            var proto;
            if (typeof parent != 'object') {
                return parent;
            }

            if (_instanceof(parent, nativeMap)) {
                child = new nativeMap();
            } else if (_instanceof(parent, nativeSet)) {
                child = new nativeSet();
            } else if (_instanceof(parent, nativePromise)) {
                child = new nativePromise(function (resolve, reject) {
                    parent.then(function(value) {
                        resolve(_clone(value, depth - 1));
                    }, function(err) {
                        reject(_clone(err, depth - 1));
                    });
                });
            } else if (clone.__isArray(parent)) {
                child = [];
            } else if (clone.__isRegExp(parent)) {
                child = new RegExp(parent.source, __getRegExpFlags(parent));
                if (parent.lastIndex) child.lastIndex = parent.lastIndex;
            } else if (clone.__isDate(parent)) {
                child = new Date(parent.getTime());
            } else if (useBuffer && Buffer.isBuffer(parent)) {
                if (Buffer.from) {
                    // Node.js >= 5.10.0
                    child = Buffer.from(parent);
                } else {
                    // Older Node.js versions
                    child = new Buffer(parent.length);
                    parent.copy(child);
                }
                return child;
            } else if (_instanceof(parent, Error)) {
                child = Object.create(parent);
            } else {
                if (typeof prototype == 'undefined') {
                    proto = Object.getPrototypeOf(parent);
                    child = Object.create(proto);
                }
                else {
                    child = Object.create(prototype);
                    proto = prototype;
                }
            }

            if (circular) {
                var index = allParents.indexOf(parent);

                if (index != -1) {
                    return allChildren[index];
                }
                allParents.push(parent);
                allChildren.push(child);
            }

            if (_instanceof(parent, nativeMap)) {
                parent.forEach(function(value, key) {
                    var keyChild = _clone(key, depth - 1);
                    var valueChild = _clone(value, depth - 1);
                    child.set(keyChild, valueChild);
                });
            }
            if (_instanceof(parent, nativeSet)) {
                parent.forEach(function(value) {
                    var entryChild = _clone(value, depth - 1);
                    child.add(entryChild);
                });
            }

            for (var i in parent) {
                var attrs = Object.getOwnPropertyDescriptor(parent, i);
                if (attrs) {
                    child[i] = _clone(parent[i], depth - 1);
                }

                try {
                    var objProperty = Object.getOwnPropertyDescriptor(parent, i);
                    if (objProperty == undefined) {
                        // no setter defined. Skip cloning this property
                        continue;
                    }
                    child[i] = _clone(parent[i], depth - 1);
                } catch(e){
                    if (e instanceof TypeError) {
                        // when in strict mode, TypeError will be thrown if child[i] property only has a getter
                        // we can't do anything about this, other than inform the user that this property cannot be set.
                        continue
                    } else if (e instanceof ReferenceError) {
                        //this may happen in non strict mode
                        continue
                    }
                }

            }

            if (Object.getOwnPropertySymbols) {
                var symbols: symbol[] = Object.getOwnPropertySymbols(parent);
                for (var i1 = 0; i1 < symbols.length; i1++) {
                    // Don't need to worry about cloning a symbol because it is a primitive,
                    // like a number or string.
                    var symbol = symbols[i1];
                    var descriptor = Object.getOwnPropertyDescriptor(parent, symbol);
                    if (descriptor && !descriptor.enumerable && !includeNonEnumerable) {
                        continue;
                    }
                    child[symbol] = _clone(parent[symbol], depth - 1);
                    if(descriptor !== undefined) {
                        Object.defineProperty(child, symbol, descriptor);
                    }
                }
            }

            if (includeNonEnumerable) {
                var allPropertyNames = Object.getOwnPropertyNames(parent);
                for (var i2 = 0; i2 < allPropertyNames.length; i2++) {
                    var propertyName = allPropertyNames[i2];
                    var descriptor = Object.getOwnPropertyDescriptor(parent, propertyName);
                    if (descriptor && descriptor.enumerable) {
                        continue;
                    }
                    child[propertyName] = _clone(parent[propertyName], depth - 1);
                    if(descriptor !== undefined) {
                        Object.defineProperty(child, propertyName, descriptor);
                    }
                }
            }

            return child;
        }

        return _clone(parent, depth);
    }

    /**
     * Simple flat clone using prototype, accepts only objects, usefull for property
     * override on FLAT configuration object (no nested props).
     *
     * USE WITH CAUTION! This may not behave as you wish if you do not know how this
     * works.
     */
    clone.clonePrototype = function clonePrototype(parent) {
        if (parent === null)
            return null;

        var c = function () {};
        c.prototype = parent;
        return new c();
    };

// private utility functions

    function __objToStr(o) {
        return Object.prototype.toString.call(o);
    }
    clone.__objToStr = __objToStr;

    function __isDate(o) {
        return typeof o === 'object' && __objToStr(o) === '[object Date]';
    }
    clone.__isDate = __isDate;

    function __isArray(o) {
        return typeof o === 'object' && __objToStr(o) === '[object Array]';
    }
    clone.__isArray = __isArray;

    function __isRegExp(o) {
        return typeof o === 'object' && __objToStr(o) === '[object RegExp]';
    }
    clone.__isRegExp = __isRegExp;

    function __getRegExpFlags(re) {
        var flags = '';
        if (re.global) flags += 'g';
        if (re.ignoreCase) flags += 'i';
        if (re.multiline) flags += 'm';
        return flags;
    }
    clone.__getRegExpFlags = __getRegExpFlags;

    return clone;
})();

if (typeof module === 'object' && module.exports) {
    module.exports = clone;
}

interface Options {
    forceString: boolean;
    objectValueSize: number;
    promiseValueSize: number;
    arrayValueSize: number;
    stdTTL: number;
    checkperiod: number;
    useClones: boolean;
    deleteOnExpire: boolean;
    enableLegacyCallbacks: boolean;
    maxKeys: number;
}

type ConstructorOptions = Partial<Options>;
type Key = string | number;
interface Box<T> {
    t: number;
    v: T;
}
type ErrorType = keyof typeof Errors;

const ValidKeyTypes = ["string", "number"];

const Errors = {
    ECACHEFULL: () => "Cache max key size exceeded",
    EKEYTYPE: ({type}: {type: string}) =>
        `The key argument has to be of type \`string\` or \`number\`. Found: \`${type}\``,
    EKEYSTYPE: () => "The keys argument has to be an array.",
    ETTLTYPE: () => "The ttl argument has to be a number.",
};

export {NodeCache, ErrorType as NodeCacheErrorType, Key as NodeCacheKey, ConstructorOptions as Options};

export default class NodeCache extends EventEmitter {
    private options: Options;

    private data: {
        [key: string]: Box<any>;
    } = {};

    private stats = {
        hits: 0,
        misses: 0,
        keys: 0,
        ksize: 0,
        vsize: 0,
    };

    private checkTimeout?: NodeJS.Timer;

    constructor(options?: ConstructorOptions) {
        super();

        this.options = Object.assign(
            {
                forceString: false,
                objectValueSize: 80,
                promiseValueSize: 80,
                arrayValueSize: 40,
                stdTTL: 0,
                checkperiod: 600,
                useClones: true,
                deleteOnExpire: true,
                enableLegacyCallbacks: false,
                maxKeys: -1,
            },
            options,
        );

        this.checkData();
    }

    public get = <T = any>(key: Key): T | undefined => {
        this.validateKey(key);

        const wrapped = this.data[key];

        if (wrapped != null && this.check(key, this.data[key])) {
            this.stats.hits++;
            return this.unwrap(wrapped);
        } else {
            this.stats.misses++;
            return;
        }
    };

    public mget = <T extends Key[], U extends any[]>(keys: T): Record<T[number], U[number] | undefined> => {
        if (!Array.isArray(keys)) {
            throw this.createError("EKEYSTYPE");
        }

        const record: Record<Key, U[number] | undefined> = {};

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            this.validateKey(key);

            const wrapped = this.data[key];
            if (wrapped != null && this.check(key, wrapped)) {
                this.stats.hits++;
                record[key] = this.unwrap<U[number]>(wrapped);
            }
        }

        return record;
    };

    public set = <T = any>(key: Key, value: T, ttl?: number): boolean => {
        if (this.options.maxKeys > -1 && this.stats.keys >= this.options.maxKeys) {
            throw this.createError("ECACHEFULL");
        }

        if (this.options.forceString && typeof value !== "string") {
            (value as any) = JSON.stringify(value);
        }

        if (ttl == null) {
            ttl = this.options.stdTTL;
        }

        this.validateKey(key);

        let isExistingKey = false;

        const wrapped = this.data[key];

        if (wrapped) {
            isExistingKey = true;
            this.stats.vsize -= this.getValLength(this.unwrap(wrapped, false));
        }

        this.data[key] = this.wrap(value, ttl);
        this.stats.vsize += this.getValLength(value);

        if (!isExistingKey) {
            this.stats.ksize += this.getKeyLength(key);
            this.stats.keys++;
        }

        this.emit("set", key, value);
        return true;
    };

    public mset = (keyValueSet: {key: Key; val: any; ttl?: number}[]): true => {
        if (this.options.maxKeys > -1 && this.stats.keys + keyValueSet.length >= this.options.maxKeys) {
            throw this.createError("ECACHEFULL");
        }

        for (let i = 0; i < keyValueSet.length; i++) {
            const {key, ttl} = keyValueSet[i];

            if (ttl && typeof ttl !== "number") {
                throw this.createError("ETTLTYPE");
            }

            this.validateKey(key);
        }

        for (let i = 0; i < keyValueSet.length; i++) {
            const {key, val, ttl} = keyValueSet[i];
            this.set(key, val, ttl);
        }

        return true;
    };

    public del = (keys: Key | Key[]) => {
        if (!Array.isArray(keys)) {
            keys = [keys];
        }

        let counter = 0;
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            this.validateKey(key);

            const wrapped = this.data[key];
            if (wrapped != null) {
                this.stats.vsize -= this.getValLength(this.unwrap(wrapped, false));
                this.stats.ksize -= this.getKeyLength(key);
                this.stats.keys--;
                counter++;

                delete this.data[key];
                this.emit("del", key, wrapped.v);
            }
        }

        return counter;
    };

    public ttl = (key: Key, ttl?: number): boolean => {
        if (ttl == null) {
            ttl = this.options.stdTTL;
        }

        this.validateKey(key);

        const wrapped = this.data[key];
        if (wrapped != null && this.check(key, wrapped)) {
            if (ttl >= 0) {
                this.data[key] = this.wrap(wrapped.v, ttl, false);
            } else {
                this.del(key);
            }
            return true;
        } else {
            return false;
        }
    };

    public getTtl = (key: Key) => {
        this.validateKey(key);

        const wrapped = this.data[key];
        if (wrapped != null && this.check(key, wrapped)) {
            return wrapped.t;
        } else {
            return;
        }
    };

    public keys = () => Object.keys(this.data);

    public has = (key: Key) => {
        const wrapped = this.data[key];
        return wrapped != null && this.check(key, wrapped);
    };

    public getStats = () => this.stats;

    public flushAll = (startPeriod = true) => {
        this.data = {};
        this.stats = {
            hits: 0,
            misses: 0,
            keys: 0,
            ksize: 0,
            vsize: 0,
        };
        this.killCheckPeriod();
        this.checkData(startPeriod);
        this.emit("flush");
    };

    public close = () => {
        this.killCheckPeriod();
    };

    private wrap = <T = any>(value: T, ttl: number, asClone = true): Box<T> => {
        if (!this.options.useClones) {
            asClone = false;
        }

        const now = Date.now();
        let lifetime = 0;
        const ttlMultiplicator = 1000;
        if (ttl === 0) {
            lifetime = 0;
        } else if (ttl) {
            lifetime = now + ttl * ttlMultiplicator;
        } else if (this.options.stdTTL) {
            lifetime = this.options.stdTTL === 0 ? 0 : now + this.options.stdTTL * ttlMultiplicator;
        }

        return {
            t: lifetime,
            v: asClone ? clone(value, undefined, undefined, undefined, undefined) : value,
        };
    };

    private unwrap = <T = any>(wrapped: Box<T>, asClone = true): T | null => {
        if (!this.options.useClones) {
            asClone = false;
        }

        if (wrapped.v == null) {
            return null;
        }

        return asClone ? clone(wrapped.v, undefined, undefined, undefined, undefined) : wrapped.v;
    };

    private check = (key: Key, wrapped: Box<any>): boolean => {
        if (wrapped.t !== 0 && wrapped.t < Date.now()) {
            if (this.options.deleteOnExpire) {
                this.del(key);
            }
            this.emit("expired", key, this.unwrap(wrapped));
            return false;
        } else {
            return true;
        }
    };

    private checkData = (startPeriod = true) => {
        for (let key in this.data) {
            this.check(key, this.data[key]);
        }

        if (startPeriod && this.options.checkperiod > 0) {
            this.checkTimeout = (setTimeout(
                this.checkData,
                this.options.checkperiod * 1000,
            ) as unknown) as NodeJS.Timer;
            this.checkTimeout.unref();
        }
    };

    private killCheckPeriod = () => {
        if (this.checkTimeout != null) {
            clearTimeout(this.checkTimeout);
        }
    };

    private getKeyLength = (key: Key) => key.toString().length;
    private getValLength = (value: any) => {
        const type = typeof value;

        if (type === "string") {
            return value.length;
        } else if (this.options.forceString) {
            return JSON.stringify(value).length;
        } else if (Array.isArray(value)) {
            return this.options.arrayValueSize * value.length;
        } else if (value === "number") {
            return 8;
        } else if (value && typeof value.then === "function") {
            return this.options.promiseValueSize;
        } else if (type === "object") {
            return this.options.objectValueSize * Object.keys(value).length;
        } else if (type === "boolean") {
            return 8;
        } else {
            return 0;
        }
    };

    private validateKey = (key: Key) => {
        const type = typeof key;
        if (!ValidKeyTypes.includes(type)) {
            throw this.createError("EKEYTYPE", {
                type,
            });
        }
    };

    private createError = (type: ErrorType, data?: any) => {
        const error = new Error();
        error.name = type;
        (error as any).errorcode = type;
        error.message = (Errors as any)[type] != null ? (Errors as any)[type](data) : "-";
        (error as any).data = data;
        return error;
    };
}