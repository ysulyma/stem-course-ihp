export function dragHelper(target, { up, down, move }) {
    target.addEventListener("mousedown", (e) => {
        if (e.button !== 0)
            return;
        let lastX = e.clientX, lastY = e.clientY;
        const upHandler = (e) => {
            document.body.removeEventListener("mousemove", moveHandler);
            window.removeEventListener("mouseup", upHandler);
            return up?.(e);
        };
        const moveHandler = (e) => {
            const dx = e.clientX - lastX, dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            return move?.(e, { dx, dy, x: e.clientX, y: e.clientY });
        };
        document.body.addEventListener("mousemove", moveHandler, false);
        window.addEventListener("mouseup", upHandler, false);
        down?.(e, { x: e.clientX, y: e.clientY });
    });
    target.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const touches = e.changedTouches;
        const touchId = touches[0].identifier;
        let lastX = touches[0].clientX, lastY = touches[0].clientY;
        const upHandler = (e) => {
            e.preventDefault();
            window.removeEventListener("touchend", moveHandler);
            window.removeEventListener("touchcancel", upHandler);
            window.removeEventListener("touchmove", moveHandler);
            return up?.(e);
        };
        const moveHandler = (e) => {
            e.preventDefault();
            for (const touch of Array.from(e.changedTouches)) {
                if (touch.identifier !== touchId)
                    continue;
                const dx = touch.clientX - lastX, dy = touch.clientY - lastY;
                lastX = touch.clientX;
                lastY = touch.clientY;
                return move?.(e, { dx, dy, x: touch.clientX, y: touch.clientY });
            }
        };
        window.addEventListener("touchend", upHandler, false);
        window.addEventListener("touchcancel", upHandler, false);
        window.addEventListener("touchmove", moveHandler, false);
        down?.(e, { x: lastX, y: lastY });
    });
}
export function screenToSVG(elt, x, y) {
    let graphicsElt = elt;
    while (!(graphicsElt instanceof SVGGraphicsElement))
        graphicsElt = graphicsElt.parentNode;
    const svgElt = elt instanceof SVGSVGElement ? elt : elt.ownerSVGElement;
    const transform = graphicsElt.getScreenCTM().inverse();
    let pt = svgElt.createSVGPoint();
    pt.x = x;
    pt.y = y;
    pt = pt.matrixTransform(transform);
    return [pt.x, pt.y];
}
export function screenToSVGVector(svg, dx, dy) {
    const rect = svg.getBoundingClientRect(), viewBox = svg.viewBox.baseVal, aspectX = rect.width / viewBox.width, aspectY = rect.height / viewBox.height, svgDx = dx / aspectX, svgDy = dy / aspectY;
    return [svgDx, svgDy];
}
//# sourceMappingURL=drag-utils-2d.js.map