import {
    state,
    event,
    effect,
    defer,
    product,
    time,
    group,
    map,
} from "../lib/api";
import { State } from "../lib/Model/model";
import { Action } from "../lib/Model/Action";

let example = () => {
    let [ev, payload] = event((e: number) => {
        console.log(e);
        return e + 19;
    });
    defer(
        (value, oldValue) => {
            console.log(value, oldValue);
        },
        [payload]
    );
    return ev;
};

let sum = (_a = 0, _b = 0) => {
    let a = state(_a);
    let b = state(_b);
    let c = product(() => a + b, [a, b]);

    defer(
        (d, D) => {
            if (a + b != c) {
                console.log(`${a} + ${b} != ${c}`);
                b(c - a);
            }
            console.log(`${d} <-| ${D}`);
        },
        [c]
    );
    return { a, b, c };
};

let arr = (...values: any[]) => {
    let current = state<any>(3);
    let set = product(
        (last = values) => {
            if (current.value) {
                last.push(current);
            }
            return last;
        },
        [current]
    );
    return [current, set];
};

let m = map<Record<any, any>>({ a: 1 });
m(() => console.log(m.value));
m.a = 23; //?
m.a; //?
m({ b: 23 });
console.log(m.a);
// let [isGreater, [igArgs, numberIsGreater]] = event.toggle(
//     (a: number, b: number) => a + b > 10
// );
// let [isLower, [ilArgs, numberIsLower]] = event.toggle(
//     (a: number, b: number) => a + b < 2
// );
// // console.log(payload.value);
// effect.when([numberIsGreater, numberIsLower]).then((args) => {
//     console.log("triggered: ", numberIsGreater, numberIsLower);
// });

// // Reflect.has({}, Symbol.iterator) //?
// isGreater(10, 2);
// isLower(1, -3);
// isLower(-100, 34);
// isLower(100, 7);

// let a = state([{ a: 3 }, 6]);
// a.forEach(console.log);
// a.c = state("", (a = "ja", b = "mel") => a + b);
// a.c(undefined, "huburt"); //?
// a.a = 43;
// a[0]; //?
// a.toJson(); //?

// let t = time(8000);
// let seconds = state(0);
// let centiSeconds = state(0);
// console.log(centiSeconds.value);
// // t.progress(console.log);
// t.progress((v: number) => seconds(Math.floor(v / 1000)));
// t.progress((v) => centiSeconds(Math.floor((v || 1) / 100)));
// seconds(console.log);
// seconds(() => seconds > 6 && t.stop());
// t.progress(5990);
// // // t.reverse();
// t.start();
// setTimeout(()=> t.isActive(false), 1000)

let array = [20, 4, "hsting", [1, 2, 3]];
let t = group(array);
// t[0](() => console.log("something", t[0].value));
// t[1](() => console.log("something else", t[0].value));
// t[0] = 3;
// t[0](() => console.log("something", t[0].value));
// t[10] = 5;
// let g = t[3][1];
// t(() => {
//     console.log("new t");
// });
// g(() => {
//     console.log("new t");
// });
// t[3].value; //?
// t[3].value; //?
// t.forEach((element) => {
//     console.log(element);
// });
