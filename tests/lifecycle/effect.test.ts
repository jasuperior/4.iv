import { expect } from "chai";

describe("#effect", () => {
    it("activates on the first run of an enclosing function", () => {
        let x = 29;
        expect(false).to.be.eq(true);
    });
});
