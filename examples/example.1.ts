import { state, event, effect, defer, product } from "../lib/api";
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

let [isGreater, [igArgs, numberIsGreater]] = event.toggle(
    (a: number, b: number) => a + b > 10
);
let [isLower, [ilArgs, numberIsLower]] = event.toggle(
    (a: number, b: number) => a + b < 2
);
// console.log(payload.value);
effect.when([numberIsGreater, numberIsLower]).then((args) => {
    console.log("triggered: ", numberIsGreater, numberIsLower);
});

// Reflect.has({}, Symbol.iterator) //?
isGreater(10, 2);
isLower(1, -3);
isLower(-100, 34);
isLower(100, 7);
/*
const useState = (init: any ) => {
    
    let [value, setValue] = React.useState(null);
    useEffect(()=>{
        let _value = state(init);
        
        _value((current)=>setValue(current))
    },[]);

    return value //not sure if this will actually change the state. 
}

*/
/*
let width = state(0), height = state(0)
window.addEventListener("resize", (e) => {
    width(window.clientWidth)
    height(window.clientHeight)
})

*/

// let e = sum(7, 12);

// e.c + ""; //?
// e.b(4);
// e.a(9);
// e.c(10);
// +e.b; //?
