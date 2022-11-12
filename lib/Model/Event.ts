import { Effect, EventMethod } from "./model";
import { State } from "./State";

class Event<T, U> extends State<[T[], U]> {
    return: U;
    arguments: T[];
    constructor(e: EventMethod<T, U>, listeners?: Effect<T>[]) {
        //@ts-ignore
        super(e);
        //@ts-ignore
        if (listeners) this.listeners = listeners;
    }
    //@ts-ignore
    next(...args: T[]) {
        let { arguments: oldArguments, return: oldReturn } = this;
        this.arguments = args;
        //@ts-ignore
        this.return = this.value(...args);
        this.listeners.forEach((effect) => {
            effect([this.arguments, this.return], [oldArguments, oldReturn]);
        });
        return this;
    }
}
