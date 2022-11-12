import { Callback, Effect } from "./Model/model";
import { State } from "./Model/State";

export function state<T>(value?: Promise<T> | T) {
    let s = new State(value || null);

    let p = new Proxy(s.next, {
        get(_, prop) {
            if (Reflect.has(s, prop)) {
                let val = Reflect.get(s, prop);
                if (typeof val == "function") {
                    return val.bind(s);
                }
                return val;
            }
        },
        apply(_, thisArg, args) {
            let t = typeof args[0];
            switch (t) {
                case "function":
                    s.then(args[0]);
                    break;
                default:
                    s.next(args[0]);
                    break;
            }

            return p;
        },
        getPrototypeOf() {
            return Object.getPrototypeOf(value);
        },
    });

    return p;
}

export function product<T>(p: () => T, deps: State<T>[] = []) {
    let value = state(p());
    update(() => {
        value(p());
    }, deps);

    return value;
}
export function event<T>(cb: Callback<T>) {
    //a state variable that tracks when a function is called
    let args = state(null);
    let result = state(null);
    let calls = state(0);
    let payload = state([args, result]);

    let fn = ((...a) => {
        args(a);
        let r = cb(...a);
        result(r);
        calls(calls + 1);
        return r;
    }) as Callback<T>;

    update(
        () => {
            payload([args, result]);
        },
        [calls],
        true
    );

    return [fn, payload];
}

export function effect<T = any>(
    e: Effect<State<T>[]>,
    deps: State<T>[] = [],
    all: boolean = false
) {
    e(deps, []);
    update(e, deps, all);
}

export function update<T = any>(
    e: Effect<State<T>[]>,
    deps: State<T>[] = [],
    all: boolean = false
) {
    if (all) {
        State.all(deps, e);
    } else {
        State.any(deps, e);
    }
}
