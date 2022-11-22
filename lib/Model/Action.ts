import { state } from "../api";
import { Callback, Effect, State } from "./model";

export class Action<T> {
    value: T;
    lastValue?: T;
    props: Record<string, any> = {};
    readonly effects: Set<Effect<T>> = new Set(); //set of effects
    errorHandler: Callback;
    constructor(value: Promise<T> | T = null, effects?: Effect<T>[]) {
        if (effects) this.effects = new Set(effects);
        this.next(value);
    }
    tick() {
        this.effects.forEach((effect) => {
            try {
                effect(this.value, this.lastValue as T, this.props);
            } catch (e) {
                this.errorHandler?.(e, this.value, this.lastValue, this.props);
            }
        });
    }
    next(value: Promise<T> | T): this {
        let lastValue = this.value;
        //!Note: Hacky, refactor soon
        if (!Array.isArray(value) && typeof value == "object") {
            Object.assign(this.props, value);
        } else if (value instanceof Promise) {
            value.then(this.next.bind(this)).catch(this.errorHandler);
        } else if (value !== lastValue) {
            this.value = value;
            this.lastValue = lastValue;
            this.tick();
        }
        return this;
    }
    then(effect: Effect<T>): this {
        if (typeof effect !== "function") {
            throw new Error(
                "NonFunctionalEffectException: the effect provided has no callable interface. Try providing a function."
            );
        }
        this.effects.add(effect);
        return this;
    }
    catch(effect: Callback): this {
        this.errorHandler = effect;
        return this;
    }
    stop(effect?: Effect<T>): this {
        if (effect) {
            this.effects.delete(effect);
        } else {
            this.effects.clear();
        }

        return this;
    }
    toJson() {
        let json = `{"value":${JSON.stringify(this.value)}, "props": {`;
        let isFirst = true;
        for (let [prop, value] of Object.entries(this.props)) {
            // console.log(value.toJson());
            let comma = isFirst ? "" : ",";
            if (typeof value !== "function") {
                isFirst = false;
                json += `${comma}"${prop}":${JSON.stringify(value)}`;
            } else if (value.toJson) {
                isFirst = false;
                json += `${comma}"${prop}":${value.toJson()}`;
            }
        }
        json += `},"isState": true}`;
        return json;
    }
    valueOf() {
        return this.value;
    }
    toString() {
        return this.valueOf()?.toString();
    }
    [Symbol.toPrimitive](hint) {
        if (hint == "string") return this.toString();
        return this.valueOf();
    }

    static any(state: Action<any>[], effect: Effect<Action<any>[]>) {
        state.forEach((s) => s.then(effect));
    }
    static all(state: Action<any>[], effect: Effect<Action<any>[]>) {
        let resolved = [0];
        let oldState = state.map((s) => s.valueOf());

        state.forEach((s, i) => {
            s.then((value) => {
                resolved[i] = 1;
                //can probably do this with a state array, because
                //it will not trigger change if we keep setting it to 1
                let isResolved = resolved.reduce((a, b) => a + b);
                if (isResolved == state.length) {
                    resolved = [0];
                    effect(state, oldState);
                    //some sort of cleanup?
                }
            });
        });
    }
    static once(state: Action<any>, effect: Effect<Action<any>>) {
        let listener;
        state.then(
            (listener = (value, oldValue) => {
                effect(value, oldValue);
                state.stop(listener);
            })
        );
    }
    static onceAll(state: Action<any>[], effect: Effect<Action<any>[]>) {
        let listener = (value, oldValue) => {
            effect(value, oldValue);
            state.forEach((s) => s.stop(listener));
        };
        state.forEach((s) => {
            s.then(listener);
        });
    }
    static fromJson(json): State<any> {
        let obj: Record<string, any> = JSON.parse(json);
        return Action.fromObject(obj);
    }
    static fromObject(obj: any): State<any> {
        let state = obj.isState ? Action.state(obj.value) : obj;
        let props = obj.isState ? obj.props : obj;
        if (props) {
            for (let [prop, value] of Object.entries(
                props as Record<string, any>
            )) {
                if (value?.isState) {
                    state[prop] = Action.fromObject(value);
                } else if (prop !== "isState") {
                    state[prop] = value;
                }
            }
        }

        return state;
    }
    static fetch(url: string) {
        return fetch(url)
            .then((res) => {
                return res.json();
            })
            .then((json) => {
                //!TODO
            });
    }
    static state(value): State<any> {
        return state(value);
    }
}
