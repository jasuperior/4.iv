export type Setter<T> = (value: T | Effect) => void;
export type Effect = () => void;
export type Value<T> = T & Setter<T>;
export interface ComponentConfig {
    tag: string;
    attr?: string[];
}
