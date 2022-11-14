import { Callback, Effect, State } from "./Model/model";
import { Action } from "./Model/Action";

export function state<T>(value?: Promise<T> | T, setter?: Callback<T>) {
    let s = new Action(value || null);
    let p = new Proxy(s.next, {
        get(_, prop) {
            if (prop == Symbol.toPrimitive) {
                return s[prop].bind(s);
            }
            if (Reflect.has(s, prop)) {
                let val = Reflect.get(s, prop);
                if (typeof val == "function") {
                    return val.bind(s);
                }
                return val;
            }
            if (Reflect.has(s.props, prop)) {
                return Reflect.get(s.props, prop);
            }
        },
        set(target, prop, value) {
            return Reflect.set(s.props, prop, value);
        },
        has(target, prop) {
            return Reflect.has(s, prop) || Reflect.has(s.props, prop);
        },
        apply(_, thisArg, args): T {
            let value = setter ? setter(...args) : args[0];
            let t = typeof value;

            switch (t) {
                case "function":
                    s.then(value);
                    break;
                default:
                    s.next(value);
                    break;
            }

            return value as T;
        },
        getPrototypeOf() {
            return Object.getPrototypeOf(value);
        },
    });

    return p as State<T>;
}

export function product<T>(
    p: (value?: T, lastValue?: T) => T,
    deps: State<T>[] = []
) {
    let value = state(p());
    update((_, lastValue) => {
        value(p(value.valueOf() as T));
    }, deps);

    return value;
}

export function byproduct<T>(
    p: (value?: T, lastValue?: T) => T,
    q: (value?: T, lastValue?: T) => void,
    deps: State<T>[] = []
) {
    let isDep = false;
    let setIsDep = () => {
        isDep = true;
    };
    update(setIsDep, deps);

    let value = product(p, deps);
    update(
        (value, lastValue) => {
            if (!isDep) {
                q(value as T, lastValue as T);
            }
            isDep = false;
        },
        [value]
    );

    return value;
}
export function event<T>(cb: Callback<T>) {
    //a state variable that tracks when a function is called
    let args = state(null);
    let result = state(null);
    let calls = state<number>(0);
    let payload = state([args.valueOf(), result.valueOf()]);

    let fn = ((...a) => {
        args(a);
        let r = cb(...a);
        result(r);
        calls(calls + 1);
        return r;
    }) as Callback<T>;

    update(
        () => {
            payload([args.valueOf(), result.valueOf()]);
        },
        [calls],
        true
    );

    return [fn, payload] as [Callback<T>, State<any>];
}
export function effect<T = any>(
    e: Effect<Action<T>[]>,
    deps: State<T>[] = [],
    all: boolean = false
) {
    e(deps, []);
    update(e, deps, all);
}

export function update<T = any>(
    e: Effect<Action<T>[]>,
    deps: State<T>[] = [],
    all: boolean = false
) {
    if (all) {
        Action.all(deps, e);
    } else {
        Action.any(deps, e);
    }
}

effect.defer = update;
