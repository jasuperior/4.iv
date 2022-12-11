# 4IV

**4IV** <pronounced "four four"> is a library for reactive programming, inspired by react, to ease the stress of composing data which changes over time. It takes the design decisions around react's state and effects, and applies it to general functions, decoupling the state from the view completely.

Its designed to be flexible and interoperable to allow for a progressive integration into your current apis.

### Features

-   🔬 Tiny (35k unzipped)
-   ⛓ Interoperable
-   🧩 Composable
-   🙌 Minimalistic and unopinionated
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
    tick(): this;
    then(effect: (next: T, prev: T) => void): this;
    stop(effect: (next: T, prev: T) => void): this;
    catch(effect: (error: Error | any, next: T, prev: T) => any): this;
}
```

Every call to the `then` method adds a new _effect_ to the `Action`. When the `next` method is subsequently called with a new value, the `Action`'s _effects_ are signaled that a change has occurred, supplying the effects with the current and previous value of the action.

Example:

```typescript
let action: Action<number> = new Action(5);
let effect = (next, prev) => {
    console.log(prev, next);
};
action.then(effect).catch((e) => console.log("Error: " + e.message));
action.next(6); //logs: 5, 6
action.stop(effect);
action.next(7); // noop
action.next(new Promise((res, rej) => rej(new Error("Some Error")))); //logs: "Error: Some Error"
```

It's not very different from an Observable. In fact, it essentially is an observable with a slightly modified interface. What **4iv** does different is abstract over this interface in order to provide easier, more coherent compositions of these observables. These abstractions allow **4iv** to remain small, without losing the ablity to construct complex compositions of the `Action`s.

All methods of the Action return the Action instance, which provides an action with a chainable api.

```typescript
action
    .then((value) => someMEthod(value + 1))
    .next(9)
    .next(10);
```

> NOTE: Actions may only contain a single error handler (supplied via `.catch()` method). Subsequent calls to `catch` will override the previous handler. The error handler is called whenever a promise is rejected or if an effect throws an error.

### Primitives

### 😀 State

State is a value that has a functional interface for changing it over time.

`State` is a functional interface over an `Action`, which also simultaneously maintains the interface of the underlying value.

```typescript
type state<T> = (value: T, setter?: (...args: any[]) => any) => State<T>;
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

You may define a specialized setter for a state by supplying the state function with an optional setter as a second argument.

```typescript
let b = state(1, (a, b) => a + b);
b(1, 4);
assert(b == 5);
```

The result of the setter function will become the value supplied to the `next` method of the underlying `Action`.

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

#### Effect Nesting

Unlike react, There is no restriction to where you may place your state and effects. This means that you may define an effect within the body of an effect.

```
effect(()=>{
    let c = state("Higher Order State");
    let d = state("More State");
    effect(()=>{
        console.log("Higher Order Effects")
    }, [c,d])
},[a,b])
```

These "Instance Effects/State", if not used responsibly, can pollute your effect chains, and cause infinite loops and runtime slowness. Be careful not to needlessly nest these structures.

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

## API

### `Action`

### Instance

#### `Action.prototype.next<T>(value: T): this`

Used to change the value of the action; triggers effects if present.

#### `Action.prototype.then<T>(effect: Effect<T>): this`

Adds effect to effects set for Action.

#### `Action.prototype.stop<T>(effect: Effect<T>): this`

Removes effect from effects set of Action.

#### `Action.prototype.toJson(): string`

Returns a json string of action.

### Static

#### `Action.all<T>(state: State<T> | Action<T>, effect: Effect<T>): void`

Binds the supplied state variables to the supplied effect. (adds effect to each state variables' effect set). Will call effect if, and only if, all of the states have changed at least once.

#### `Action.any<T>(state: State<T> | Action<T>, effect: Effect<T>): void`

Binds the supplied state variables to the supplied effect. Will call effect if any of the state variables change.

#### `Action.once<T>(state: State<T> | Action<T>, effect: Effect<T>): void`

Binds the supplied state variables to the supplied effect. Will call effect only once when any of the state variables change, then removes effect from each state variable.

#### `Action.onceAll<T>(state: State<T> | Action<T>, effect: Effect<T>): void`

Binds the supplied state variables to the supplied effect. Will call effect if, and only if, all of the states have changed at least once, then removes effect from each state variable.

#### `Action.fromJson(json: string): State<T>`

Turns json data into an Action instance.

#### `Action.fromObject(obj: Record<string, any>): State<T>`

Turns an Action record (object which follows json config for Action) into a state variable.

---

### `state`

### Instance

(Inherits from [`Action.prototype`](#instance))

### Static

#### `state.of( emitter: any, event: string ) : state<any>`

#### `state.of( event: string ) : state<any>`

Creates a state variable from an event emitter (objects which possess an `.on` or `.addEventListener` method). If only the name of the event is provided, the emitter will default to `window.document`.

---

### `effect`

### Static

#### `effect.defer<T>(e: Effect<State<T>[]>, deps?: State<T>[], all?: boolean)`

#### `effect.filter<T>(e: Effect<State<T>[]>, deps?: State<T>[])`

---

## Guides

## Recipes
