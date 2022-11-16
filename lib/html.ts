import { effect, defer } from "./api";

const S4 = () => {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
};
const UUID = () => {
    return "p" + (S4() + S4() + "-" + S4());
};

//create a component registry to replace elements in string with predefined ones in registry

export function html(strings: TemplateStringsArray, ...values: any[]) {
    let fragment = document.createElement("div");
    let html = ``;
    let attrs: any[] = [];
    let children: any[] = [];
    for (let idx in strings) {
        let section = strings[idx];
        let value = values[idx];
        let isAttr = false;
        section = section.replace(/\b([a-zA-Z\-]+)=$/, (_, prop) => {
            let uuid = UUID();
            let attr = `data-${uuid}=""`;
            attrs.push([attr, prop, value]);
            isAttr = true;
            return attr;
        });
        html += section;

        if (!isAttr && parseInt(idx) !== strings.length - 1) {
            let uuid = UUID();
            let child = `<span id="${uuid}"></span>`;
            let idx = children.length;
            children.push([uuid, value]);
            if (value instanceof HTMLElement == false) {
                child = `<slot id="${uuid}">${value}</slot>`;
                children[idx][2] = true;
            }
            html += child;
        }
    }
    fragment.innerHTML = html;

    attrs.forEach(([placeholder, attr, value]) => {
        let el = fragment.querySelector(`[${placeholder}]`);
        el.removeAttribute(placeholder);
        el.setAttribute(attr, value); //might have to coerce into px or whatever
        if (value?.then) {
            defer(() => {
                el.setAttribute(attr, value);
            }, [value]);
        }
    });

    children.forEach(([id, child, isReactive]) => {
        let placeholder = fragment.querySelector(`#${id}`);
        let parent = placeholder.parentNode;
        if (isReactive) {
            if (child?.then) {
                defer(
                    (value) => {
                        placeholder.innerHTML = value as unknown as string;
                    },
                    [child]
                );
            }
        } else {
            parent.replaceChild(child, placeholder);
        }
    });

    return fragment.childNodes;
}
