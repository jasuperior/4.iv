import { state } from "../api";
import { Effect } from "./model";

export class Action<T> {
    value: T;
    listeners: Set<Effect<T>> = new Set(); //set of effects
    props: Record<string, any> = {};
    constructor(value: Promise<T> | T, listeners?: Effect<T>[]) {
        if (listeners) this.listeners = new Set(listeners);
        this.next(value);
    }
    next(value: Promise<T> | T): this {
        let oldValue = this.value;
        if (value instanceof Promise) {
            value.then(this.next.bind(this));
        } else if (value !== oldValue) {
            this.value = value;
            this.listeners.forEach((effect) => {
                effect(value, oldValue);
            });
        }
        return this;
    }
    then(effect: Effect<T>): this {
        if (typeof effect !== "function") {
            throw new Error(
                "NonFunctionalEffectException: the effect provided has no callable interface. Try providing a function."
            );
        }
        this.listeners.add(effect);
        return this;
    }
    stop(effect: Effect<T>): this {
        this.listeners.delete(effect);
        return this;
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
    static when() {}
    static until() {}
    toJson() {
        let json = `{"value":${this.value}, "props": {`;
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
    static fromJson(json) {
        let obj: Record<string, any> = JSON.parse(json);
        return Action.fromObject(obj);
    }
    static fromObject(obj: any) {
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
    static state(value) {
        return state(value);
    }
}
