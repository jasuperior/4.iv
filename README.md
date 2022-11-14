# 4IV

**4IV** <pronounced "four four"> is a library for reactive programming, inspired by react, to ease the stress of composing data which changes over time. It takes the design decisions around react's state and effects, and applies it to general functions, decoupling the state from the view completely.

Its designed to be flexible and interoperable to allow for a progressive integration into your current apis.

### Features

-   🔬 Tiny runtime and package size
-   🧩 Interoperable state and effects
-   🙌 Minimalistic, unopinionated api
-   🔄 2 way binding
-   🤖 Typescript Support
-   🤷🏽‍♂️ It works!

## Installation

##### yarn

`yarn add @oneii3/4iv`

##### npm

`npm i @oneii3/4iv --save`

## Basics

-   [Concepts](#Concepts)
-   [Primitives](#Primitives)
    -   [State](#State)
    -   [Product](#Product)
    -   [Effect](#Effect)
    -   [Event](#Event)
-   [Comparisons](#Comparisons)

### Concepts

On the surface, **4iv** is just another reactive programming library. The current solutions to dealing with reactive data is to use strict observables, or event bus pub/subs.

<!-- But other libraries are too opinionated in their approach to dynamic data over time. Observables are great, but forces the programmer into this paradigm of utilizing the strict pub/sub interface to grab and manipulate values. -->

Its much nicer

### Primitives

### 😀 State

A state is a value that has a functional interface for changing it over time.

```typescript
state<T> = (value: T) => State<T>
State<T> = T & ( T ) => T
```

you create one using the state function.

```typescript
import { state } from "@oneii3/4iv";

let a: State<number> = state(1);
```

A state variable works shares the same interface as the value that constructed it. This means, a state of a `number`, will still work just like any other `number` in you code. It just additionally acts as a setter when it is called like a function.

```typescript
import { state } from "@oneii3/4iv";

let a = state(1);

assert(typeof a == "function");
assert(a instanceof Number);
assert(a == 1);
assert(a + 3 == 4);
a(2);
assert(a == 2);
assert(a(3) == 3);
```

when a state variable is called with a promise, it will internally await the value returned from the promise.

```typescript
a(
    new Promise((res) => {
        setTimeout(() => {
            res(10);
        }, 1000);
    })
); //a implicitly becomes 10 in 1 sec
```

Because the values supplied to a state variable may change at any time, to capture the values as they change, a function may also be supplied as an argument to the state setter. This adds the function to the state's effect queue. This `effect` is called whenever the state variable changes values (more on this [below](#Effect)).

```typescript
a((next, last) => console.log(next, last));
a(3); //logs: 3, 2
```

When using a state variable as a function, it returns the value supplied. So to bind one state to another, simply compose them.

```typescript
let b = state();
let c = a(b(1));
assert(a == 1);
assert(b == 1);
assert(c == 1);
```

Two state variables that are equal to the same value, are not equal to one another.

```typescript
assert(a != b);
```

### 😃 Product

```typescript
product<T, U> = (
    value: (last: T) => T ,
    dependencies: State<U>[]
    ) => Product<T>

Product<T> = State<T>
```

A product is a state variable that is derived from two or more other state variables. When any of the input variables change, it recomputes its value. The changes are tracked by the values supplied to the depencency array and not the values used in the value function.

```typescript
import { state, product } from "@oneii3/4iv";

let a = state(1);
let b = state(2);
let c = product(() => a + b, [a, b]);
assert(c == 3);
a(2);
assert(c == 4);
```

Since it is also a state variable itself, the value can also be changed directly. It will also still recompute once any of its inputs change.

```typescript
c(0);
assert(c == 0);
```

> _NOTE: setting the product in this way will not affect the input variables in any way._ `assert(a == 2); assert(b == 2);`

### 😅 Byproduct

// TBD

### 😄 Effect

Effects are simply the functions called in response to a state change. The `effect` function however is sugar for composing state variables with an effect callback and calling it immediately.

```typescript
import { state, effect } from "@oneii3/4iv";

let a = state(1);
let b = state(2);
effect(() => console.log({ a, b }), [a, b]); //logs: { a: 1, b: 2 }
//same as: a(b(() => console.log({ a, b }))).call()

a(2); //logs: { a: 2, b: 2 }
b(3); //logs: { a: 2, b: 3 }
a(2); //doesnt log
```

Since effects are called immediately, you can defer execution of the effect until the dependencies change for the first time, call `effect.defer()`

```typescript
effect.defer(() => console.log({ a, b }), [a, b]); //nothing
a(10); // logs: { a: 10, b: 3 }
```

If you supply a product as a dependency, the effect will be triggered when either the product is set directly or being recomputed.

```typescript
let c = product(() => `values: "${a} ${b}"`, [a, b]);
effect.defer(() => console.log(c), [c]);

a(b("hello"));
//logs: `values: "10 hello"`
//logs: `values: "hello hello"`

c("goodbye");
//logs: `goodbye`

b("world");
//logs: `values: "hello world"
```

### 😁 Event

```typescript
event<T extends EventCallback> = ( callback: T ) => [
    State<T>,
    State<[
        State<T[arguments]>,
        State<T[return]>
        ]>
]
EventCallback = (...args: any) => any;
```

An event is a state variable which triggers its effects when the supplied callback is used.

```typescript
import { event } from "@oneii3/4iv";

let [add, state] = event((a, b) => a + b);

effect(() => {
    let [args, result] = state;
    console.log(`${args} -> ${result}`);
}, [state]);

add(1, 2); //logs 1,2 -> 3
```

### Comparisons

-   Vanilla JS
-   RX
-   Recoil

// TBD

---

## Guides

## Recipes

## Demos
