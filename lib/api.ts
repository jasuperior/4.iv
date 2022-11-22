import { Callback, Effect, State } from "./Model/model";
import { Action } from "./Model/Action";

export function state<T>(value?: Promise<T> | T, setter?: Callback<T>) {
    let s = new Action(value);
    let p = new Proxy(s.next, {
        get(_, prop) {
            if (
                prop == Symbol.iterator &&
                Reflect.has(s.value || {}, Symbol.iterator)
            ) {
                return Reflect.get(s.value as any, Symbol.iterator).bind(
                    s.value
                );
            }
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
            if (
                Array.isArray(s.value) &&
                Reflect.has(s.value as object, prop)
            ) {
                let val = Reflect.get(s.value, prop);
                if (typeof val == "function") {
                    return val.bind(s.value);
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
    defer((_, lastValue) => {
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
    defer(setIsDep, deps);

    let value = product(p, deps);
    defer(
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
    let payload = state([args, result]);

    let fn = ((...a) => {
        args(a);
        let r = cb(...a);
        result(r);
        calls(calls + 1);
        return r;
    }) as Callback<T>;

    defer(
        () => {
            payload([args, result]);
        },
        [calls],
        true
    );

    return [fn, payload] as [Callback<T>, State<any>];
}
export function toggle<T>(cb: Callback<T>) {
    //a state variable that tracks when a function is called
    let [fn, payload] = event(cb);
    defer(
        (next) => {
            if (next) {
                payload[1](false);
            }
        },
        [payload[1]]
    );
    return [fn, payload] as [Callback<T>, State<any>];
}

export function effect<T = any>(
    e: Effect<State<T>[]>,
    deps: State<T>[] = [],
    all: boolean = false
) {
    let cleanup = e(deps, []);
    defer(e, deps, all);
    return () => {
        deps.forEach((dep) => {
            dep.stop(e as Effect<T>);
        });
        cleanup?.();
    };
}

export function defer<T = any>(
    e: Effect<State<T>[]>,
    deps: State<T>[] = [],
    all: boolean = false
) {
    if (all) {
        Action.all(deps, e);
    } else {
        Action.any(deps, e);
    }
}

export function filter<T extends boolean>(
    e: Effect<State<T>[]>,
    truthyDeps: State<T>[] = []
) {
    defer((next, last) => {
        if (next) e(next, last);
    }, truthyDeps);
}

export function fromEventListener(source: any, event: string) {
    let s = state(null);
    let listener = source.addEventListener || source.on;
    listener = listener.bind(source);

    listener(event, (value) => {
        s(value);
    });

    return s;
}

export function time(duration: number = Infinity) {
    let progress = state(0);
    let isActive = state(false);
    let isReversed = state(false);
    let [start] = event(() => isActive(true));
    let [stop] = event(() => isActive(false));
    let [reverse] = event(() => {
        stop();
        isReversed(true);
    });
    let [forward] = event(() => {
        stop();
        isReversed(false);
    });
    effect.defer(() => {
        if (isActive == true) {
            let action;
            let startTime;
            let offset = progress.value || 0;
            requestAnimationFrame(
                (action = (timestamp) => {
                    startTime = startTime || timestamp;
                    let elapsed = timestamp - startTime;
                    let end = offset || duration;
                    if (isReversed.value) {
                        elapsed = end - elapsed;
                        progress(Math.max(elapsed, 0));
                        if (isActive == true && elapsed >= 0) {
                            return requestAnimationFrame(action);
                        }
                    } else {
                        elapsed += offset;
                        progress(Math.min(elapsed, duration));
                        if (isActive == true && elapsed <= duration) {
                            return requestAnimationFrame(action);
                        }
                    }
                    stop();
                })
            );
        }
    }, [isActive]);

    return {
        start,
        stop,
        reverse,
        forward,
        progress,
        duration,
        isActive,
    };
}

state.of = (source: any | string, event?: string) => {
    if (typeof source == "string") {
        return fromEventListener(document, source);
    }
    return fromEventListener(source, event);
};
effect.defer = defer;
effect.filter = filter;
effect.when = (truthyDeps: State<boolean>[] = []) => {
    return {
        then(e: Effect<State<boolean>[]>) {
            return effect.filter(e, truthyDeps);
        },
    };
};
event.toggle = toggle;
