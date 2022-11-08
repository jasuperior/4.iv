import { Effect, Value } from "./model";

export function effect<T>(src: Effect, deps: Value<T>[] = []): void {
    src();
    deps.forEach((d) => d(src));
    //should (probably) include some sort of cleanup
}

export function update<T>(src: Effect, deps: Value<T>[] = []): void {
    deps.forEach((d) => d(src));
}

export function state<T>(value: T): Value<T> {
    let listeners: Set<Effect> = new Set();
    let props = {};
    let val = new Proxy(() => {}, {
        get(_, prop) {
            let t = value[prop] || props[prop];
            if (typeof t == "function") {
                if (typeof value == "object") return t.bind(val);
                return t.bind(value);
            }
            return t;
        },
        set(_, prop, newValue) {
            if (prop == "value" && typeof value == "function") {
                //this probably wont work for callbacks.
                //if I want to call the function there is currently no way.
                //need to likely abstract into separate hook.
                if (typeof newValue !== "function")
                    throw new Error(
                        "NoFunctionValueError: Value supplied is not a <Function>"
                    );
                value = newValue;
            } else if (typeof value == "object") {
                let oldValue = Reflect.get(value as object, prop);
                if (oldValue !== newValue) {
                    Reflect.set(value as object, prop, newValue);
                    listeners.forEach((fn) => fn());
                }
            } else {
                let oldValue = Reflect.get(props as object, prop);
                if (oldValue !== newValue) {
                    Reflect.set(props as object, prop, newValue);
                    listeners.forEach((fn) => fn());
                }
            }

            return true;
        },
        apply(_, thisArg, args) {
            if (typeof args[0] == "function") listeners.add(args[0]);
            else if (value !== args[0]) {
                value = args[0];
                listeners.forEach((fn) => fn());
            }
        },
        getPrototypeOf() {
            // @ts-ignore
            return value?.__proto__;
        },
    });
    // dep.forEach(d=>{ d() })
    return val as Value<T>;
}
