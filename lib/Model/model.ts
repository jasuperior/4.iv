import { State } from "./State";

export type TypeOf<T> = T extends number
    ? number
    : T extends string
    ? string
    : T;

export type Setter<T> = (value: T | Effect<T>) => void;
export type Effect<T = any> = (value?: T, oldValue?: T) => void;
export type Value<T> = T & Setter<T>;
export type Callback<T> = (...args: T[]) => any;
export type EventMethod<T = any, U = any> = (...args: T[]) => U;
export type StateLike<T> = State<T> &
    ((value: T | Promise<T> | Effect<T>) => T) &
    TypeOf<T>;
export interface ComponentConfig {
    tag: string;
    attr?: string[];
}
