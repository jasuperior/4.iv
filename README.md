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

## Demos

//TBD

## Installation

##### yarn

`yarn add @oneii3/4iv`

##### npm

`npm i @oneii3/4iv --save`

## Basics

-   [Concepts](#Concepts)
-   [Primitives](#Primitives)
    -   [State](#-state)
    -   [Product](#-product)
    -   [Effect](#-effect)
    -   [Event](#-event)
-   [Comparisons](#comparisons)

### Concepts

On the surface, **4iv** is just another reactive programming library. Where it differs is that the abstractions over state in other libraries is too opinionated, and makes coordinating and composing state more difficult that it should be.

Under the hood, **4iv** uses a class called `Action` which implements a modified Observer pattern.

```typescript
interface Action<T> {
    value: T;
    constructor(initialValue: T, effects: ((next: T, prev: T) => void)[]);
    next(value: T): this;
    then(effect: (next: T, prev: T) => void): this;
    stop(effect: (next: T, prev: T) => void): this;
}
```

Every call to the `then` method adds a new _effect_ to the `Action`. When the `next` method is subsequently called with a new value, the `Action`'s _effects_ are signaled that a change has occurred, supplying the effects with the current and previous value of the action.

Example:

```typescript
let action: Action<number> = new Action(5);
let effect = (next, prev) => {
    console.log(prev, next);
};
action.then(effect);
action.next(6); //logs: 5, 6
action.stop(effect);
action.next(7); // noop
```

It's not very different from an Observable. In fact, it essentially is an observable. What **4iv** does different is abstract over this interface in order to provide easier, more coherent compositions of these observables. These abstractions allow **4iv** to remain small, without losing the ablity to construct complex compositions of the `Action`s.

### Primitives

### 😀 State

State is a value that has a functional interface for changing it over time.

`State` is a functional interface over an `Action`, which also simultaneously maintains the interface of the underlying value.

```typescript
type state<T> = (value: T) => State<T>;
type State<T> = T & ((T) => T) & Action<T>;
```

You create one using the state function.

```typescript
import { state } from "@oneii3/4iv";

let a: State<number> = state(1);
```

Since a state variable shares the same interface as the value that constructed it. This means, the state of a `number`, will still work just like any other `number` in your code. It just additionally acts as a setter for the `next` or `then` method of the underlying Action when it is called like as function, with either a new value or an effect respectively.

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

When a state variable is called with a promise, it will internally await the value returned from the promise.

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
type product<T, U> = (
    value: (last: T) => T,
    dependencies: State<U>[]
) => Product<T>;

type Product<T> = State<T>;
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

```typescript
type byproduct<T> = (
    product: (value?: T, lastValue?: T) => T,
    quotient: (value?: T, lastValue?: T) => void,
    deps: State<T>[] = []
) => Byproduct<T>;
type Byproduct<T> = State<T>;
```

A `Byproduct` is a bidirectional `Product`. What this means is that changing either its dependencies or the result of a byproduct, will cause either the `product` effect or `quotient` effect respectively in response to the change.

This is especially useful when data needs to be derived back to the input dependencies.

```typescript
let x = state(1);
let y = state(2);
let z = byproduct(
    (next, last) => x + y,
    (next, last) => x(z - y),
    [x, y]
);
assert(z == 3);
assert(x == 1);
z(5);
assert(z == 5);
assert(x == 3);
```

In the above example, the byproduct is able to maintain the constraints of all of its values, no matter which state gets changed. This becomes extremely valuable when components can be editted from two different sources, which dictate either the pieces or the derived value of a stateful value.

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

// TBD

---

## Guides

## Recipes
