/** querySelector() shortcut */
export function $<K extends keyof HTMLElementTagNameMap>(
  selector: K,
  target?: Document | Element,
): HTMLElementTagNameMap[K] | null;
export function $<E extends Element = Element>(
  selector: string,
  target?: Document | Element,
): E | null;
export function $(selector: string, target: Document | Element = document) {
  return target.querySelector(selector);
}

/** querySelectorAll() shortcut */
export function $$<K extends keyof HTMLElementTagNameMap>(
  selector: K,
  target?: Document | Element,
): HTMLElementTagNameMap[K][];
export function $$<E extends Element = Element>(
  selector: string,
  target?: Document | Element,
): E[];
export function $$(selector: string, target: Document | Element = document) {
  return Array.from(target.querySelectorAll(selector));
}

type Child = Node | false | number | string;

/** createElement shortcut */
export function $e<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  attrs?: Record<string, string>,
  children?: Child | Child[],
): HTMLElementTagNameMap[K];
export function $e<E extends Element = Element>(
  tagName: string,
  attrs?: Record<string, string>,
  children?: Child | Child[],
): E;
export function $e(
  tagName: string,
  attrs: Record<string, string> = {},
  children: Child | Child[] = [],
) {
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
    } else if (child !== false) {
      elt.append(child);
    }
  }

  return elt;
}
