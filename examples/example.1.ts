import { state, effect } from "../lib/lifecycle";

let example = (n) => {
    const age = state(n || 0);
    const ageStr = state(`Age : ${age}`);

    effect(() => {
        console.log("age is changing");
        ageStr(`Age : ${age}`);
        console.log("after age is changing");
    }, [age]);
    return { age, ageStr };
};

let example2 = (n) => {
    let { ageStr, age } = example(n);

    effect(() => {
        console.log("Age String Changed", ageStr);
    }, [age]);

    return { age };
};

example2(7).age(90);
