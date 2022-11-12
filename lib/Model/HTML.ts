const S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};
const UUID = () => {
    return "p" + (S4() + S4() + "-" + S4());
};

export class HTML {
    element: HTMLElement;
    constructor(public strings: string[], public values: any[]) {}
}

export const html = (strings: string[], ...values: any[]) => {
    return new HTML(strings, values).element;
};
