import { Action } from "./Action";

export type TypeOf<T> = T extends number
    ? number
    : T extends string
    ? string
    : T;
export type KeysFrom<T> = Partial<{ [key in keyof T]: T[key] }>;
export type Setter<T> = (value: T | Effect<T>) => void;
export type StateProps = Record<string, any>;
export type Effect<T = any> = (
    value: T,
    oldValue?: T,
    props?: StateProps
) => any;
export type Value<T> = T & Setter<T>;
export type Callback<T = any> = (...args: T[]) => any;
export type EventMethod<T = any, U = any> = (...args: T[]) => U;
export type State<T, U = any> = Action<T> &
    ((value: T | Promise<T> | Effect<T>) => T) &
    TypeOf<T> &
    KeysFrom<U>;
export interface ComponentConfig {
    tag: string;
    attr?: string[];
}
export type StatefulEvent = "start" | "active" | "stop";
export interface Stateful {
    on(event: StatefulEvent, cb: Callback): void;
}
