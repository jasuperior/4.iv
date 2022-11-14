import { expect } from "chai";
import { state } from "../lib/api";

describe("state", () => {
    it("is an instance of the input value, and typed as a function", () => {
        let s = state(0);
        expect(s).to.be.a("function");
        expect(s).to.be.an.instanceof(Number);
    });
    describe("when a value is supplied to the state function", () => {
        describe("when the value is a function", () => {
            it("adds the callback to the state's list of listener", () => {
                let s = state(0);
                let cb = () => {};
                expect(s.listeners).to.not.contain(cb);
                s(cb);
                expect(s.listeners).to.contain(cb);
            });
        });
        describe("when the value is not a function", () => {
            it("changes the value of the state", () => {
                let s = state(0);
                expect(s.value).to.be.eq(0);
                s(10);
                expect(s.value).to.be.eq(10);
            });
            it("triggers listeners", () => {
                let s = state(0);
                let value = false;
                s(() => (value = true));
                expect(value).to.be.eq(false);
                s(1);
                expect(value).to.be.eq(true);
            });
        });
    });
});
