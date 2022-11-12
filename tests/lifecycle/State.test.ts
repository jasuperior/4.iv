import { expect } from "chai";
import { State } from "../../lib/Model/State";
describe("State", () => {
    let value;
    beforeEach(() => {
        value = new State(1);
    });
    describe("#next", () => {
        it("changes the state's value property", () => {
            expect(value.value).to.eq(1);
            value.next(2);
            expect(value.value).to.eq(2);
        });
        it("triggers all listeners", () => {});
    });

    describe("#then", () => {
        beforeEach(() => {
            value.then((oldValue, newValue) => {});
        });
        it("adds function to set of listeners", () => {});
        it("throws an error when argument provided is non functional", () => {});
    });
});

describe("state", () => {
    it("is both a primitive and a function", () => {});
});
