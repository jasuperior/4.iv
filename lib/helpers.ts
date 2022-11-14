const preps = {
    args: [],
    is(arg) {
        //each functino needs to define its own is i think
        //because it will apply differently with perhaps different args
        return this(...[arg].concat(this.args));
    },
    of(...args) {
        let fn = resolveCopyFn(this);
        const newFn = Object.assign(fn, this, { args: this.args.concat(args) });
        return newFn;
    },
};

const resolveCopyFn = (fn) => {
    if (fn[Symbol.for("copy")]) {
        return fn;
    }
    let copy = Object.assign(
        (...args) => {
            return fn(...args);
        },
        {
            [Symbol.for("copy")]: true,
        }
    );

    return copy;
};

const makePrep = (fn) => {
    return Object.assign(fn, preps);
};
