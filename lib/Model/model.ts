export type Setter<T> = (value: T | Effect<T>) => void;
export type Effect<T = any> = (value?: T, oldValue?: T) => void;
export type Value<T> = T & Setter<T>;
export type Callback<T> = (...args: T[]) => any;
export type EventMethod<T = any, U = any> = (...args: T[]) => U;
export interface ComponentConfig {
    tag: string;
    attr?: string[];
}
