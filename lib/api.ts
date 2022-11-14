import { Callback, Effect, StateLike } from "./Model/model";
import { State } from "./Model/State";

export function state<T>(value?: Promise<T> | T) {
    let s = new State(value || null);

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
        },
        apply(_, thisArg, args): T {
            let value = args[0];
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

    return p as StateLike<T>;
}

export function product<T>(p: (oldValue?: T) => T, deps: StateLike<T>[] = []) {
    let value = state(p());
    update((_, lastValue) => {
        value(p(value.valueOf() as T));
    }, deps);

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

    return [fn, payload] as [Callback<T>, StateLike<any>];
}
export function effect<T = any>(
    e: Effect<State<T>[]>,
    deps: StateLike<T>[] = [],
    all: boolean = false
) {
    e(deps, []);
    update(e, deps, all);
}

export function update<T = any>(
    e: Effect<State<T>[]>,
    deps: StateLike<T>[] = [],
    all: boolean = false
) {
    if (all) {
        State.all(deps, e);
    } else {
        State.any(deps, e);
    }
}

effect.defer = update;
