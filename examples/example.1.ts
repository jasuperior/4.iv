import { state, event, effect, update, product } from "../lib/api";

let example = () => {
    let [ev, payload] = event((e: number) => {
        console.log(e);
        return e + 19;
    });
    update(
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

    update(
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

let a = state(1);
let b = state(2);
let c = a(4);
a == b; //?
a(b(9)); //?
b == +a; //?

/*
const useState = (init: any ) => {
    let _value = state(init);
    let [value, setValue] = React.useState(init);
    useEffect(()=>{
        _value((current)=>setValue(current))
    },[]);

    return _value //not sure if this will actually change the state. 
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
