/**
 * Helper for implementing drag functionality.
 * Abstracts over differences between mouse and touch events.
 */
export function dragHelper(target, { up, down, move }) {
    /* ------------------------- mouse dragging ------------------------- */
    // the typecast is to avoid some TypeScript weirdness overloading
    target.addEventListener("mousedown", (e) => {
        if (e.button !== 0)
            return;
        let lastX = e.clientX, lastY = e.clientY;
        /** handle mouseup event (dragging finished) */
        const upHandler = (e) => {
            // unbind event listeners
            document.body.removeEventListener("mousemove", moveHandler);
            window.removeEventListener("mouseup", upHandler);
            // user callback
            return up?.(e);
        };
        /** handle move events once dragging has begun */
        const moveHandler = (e) => {
            // compute difference from last position
            const dx = e.clientX - lastX, dy = e.clientY - lastY;
            lastX = e.clientX;
            lastY = e.clientY;
            // user callback
            return move?.(e, { dx, dy, x: e.clientX, y: e.clientY });
        };
        // bind event listeners
        document.body.addEventListener("mousemove", moveHandler, false);
        window.addEventListener("mouseup", upHandler, false);
        // user callback
        down?.(e, { x: e.clientX, y: e.clientY });
    });
    /* ------------------------- touch dragging ------------------------- */
    // the typecast is to avoid some TypeScript weirdness overloading
    target.addEventListener("touchstart", (e) => {
        e.preventDefault();
        const touches = e.changedTouches;
        const touchId = touches[0].identifier;
        let lastX = touches[0].clientX, lastY = touches[0].clientY;
        /** handle touchup event (dragging finished) */
        const upHandler = (e) => {
            e.preventDefault();
            // unbind event listeners
            window.removeEventListener("touchend", moveHandler);
            window.removeEventListener("touchcancel", upHandler);
            window.removeEventListener("touchmove", moveHandler);
            // user callback
            return up?.(e);
        };
        /** handle move events once drag has begun */
        const moveHandler = (e) => {
            e.preventDefault();
            for (const touch of Array.from(e.changedTouches)) {
                if (touch.identifier !== touchId)
                    continue;
                // compute difference from last position
                const dx = touch.clientX - lastX, dy = touch.clientY - lastY;
                lastX = touch.clientX;
                lastY = touch.clientY;
                // user callback
                return move?.(e, { dx, dy, x: touch.clientX, y: touch.clientY });
            }
        };
        // bind event listeners
        window.addEventListener("touchend", upHandler, false);
        window.addEventListener("touchcancel", upHandler, false);
        window.addEventListener("touchmove", moveHandler, false);
        // user callback
        down?.(e, { x: lastX, y: lastY });
    });
}
/** convert absolute screen coordinates to SVG coordinates */
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
/** convert relative screen coordinates to SVG coordinates */
export function screenToSVGVector(svg, dx, dy) {
    const rect = svg.getBoundingClientRect(), viewBox = svg.viewBox.baseVal, aspectX = rect.width / viewBox.width, aspectY = rect.height / viewBox.height, svgDx = dx / aspectX, svgDy = dy / aspectY;
    return [svgDx, svgDy];
}
//# sourceMappingURL=drag-utils-2d.js.map