import HTML from "html-template-string";
import { ComponentConfig } from "./model";
export const html = (str, ...values) => {
    return HTML(str, ...values.map((v) => v?.html || v.valueOf()));
};
export const render = (parent, ...children) => {
    let element = parent?.html || parent;
    children.forEach((child) => {
        parent.appendChild(child?.html || child);
    });

    return element;
};

export const component = (markup, config: string | ComponentConfig) => {
    //! EXPERIMENTAL: this api needs some work. Not sure I like it.
    let name = typeof config == "string" ? config : config?.tag;
    let attrs = typeof config == "object" ? config.attr || [] : [];
    let attrMap = attrs.reduce((obj, prop, i) => {
        obj[prop] = i;
        return obj;
    }, {});
    class CustomElement extends HTMLElement {
        private current: any;
        #attr: any[] = [];
        #isConnected: boolean = false;

        static get observedAttributes() {
            return attrs;
        }
        constructor(...args) {
            super();
            this.attachShadow({ mode: "open" });
        }
        attributeChangedCallback(attr, oldVal, newVal) {
            if (this.#isConnected) {
                this.current?.[attr]?.(newVal);
            } else {
                this.#attr[attrMap[attr]] = newVal;
            }
        }
        connectedCallback() {
            this.#isConnected = true;
            this.current = markup(...this.#attr);
            this.shadowRoot?.appendChild(this.current?.html);
        }
    }

    customElements.define(name, CustomElement);
    return markup;
};
