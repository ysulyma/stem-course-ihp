export function $(selector, target = document) {
    return target.querySelector(selector);
}
export function $$(selector, target = document) {
    return Array.from(target.querySelectorAll(selector));
}
export function $e(tagName, attrs = {}, children = []) {
    const elt = document.createElement(tagName);
    for (const [key, value] of Object.entries(attrs)) {
        // TODO: handle class, dataset, style
        elt.setAttribute(key, value);
    }
    if (!Array.isArray(children)) {
        children = [children];
    }
    for (const child of children) {
        if (typeof child === "number") {
            elt.append(child.toString());
        }
        else if (child !== false) {
            elt.append(child);
        }
    }
    return elt;
}
//# sourceMappingURL=utils.js.map