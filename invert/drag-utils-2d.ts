export interface DragListener {
  move?: (
    e: MouseEvent | TouchEvent,
    hit: {
      /** x-coordinate of mouse or touch event */
      x: number;

      /** y-coordinate of mouse or touch event */
      y: number;

      /** x-movement since last event */
      dx: number;

      /** y-movement since last event */
      dy: number;
    },
  ) => void;
  down?: (
    e: MouseEvent | TouchEvent,
    hit: {
      /** x-coordinate of mouse or touch event */
      x: number;

      /** y-coordinate of mouse or touch event */
      y: number;
    },
  ) => void;
  up?: (e: MouseEvent | TouchEvent) => void;
}

/**
 * Helper for implementing drag functionality.
 * Abstracts over differences between mouse and touch events.
 */
export function dragHelper(
  target: HTMLElement | SVGElement,
  { up, down, move }: DragListener,
) {
  /* ------------------------- mouse dragging ------------------------- */
  // the typecast is to avoid some TypeScript weirdness overloading
  (target as HTMLElement).addEventListener("mousedown", (e: MouseEvent) => {
    if (e.button !== 0) return;
    let lastX = e.clientX,
      lastY = e.clientY;

    /** handle mouseup event (dragging finished) */
    const upHandler = (e: MouseEvent) => {
      // unbind event listeners
      document.body.removeEventListener("mousemove", moveHandler);
      window.removeEventListener("mouseup", upHandler);

      // user callback
      return up?.(e);
    };

    /** handle move events once dragging has begun */
    const moveHandler = (e: MouseEvent) => {
      // compute difference from last position
      const dx = e.clientX - lastX,
        dy = e.clientY - lastY;
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
  (target as HTMLElement).addEventListener("touchstart", (e: TouchEvent) => {
    e.preventDefault();

    const touches = e.changedTouches;
    const touchId = touches[0].identifier;
    let lastX = touches[0].clientX,
      lastY = touches[0].clientY;

    /** handle touchup event (dragging finished) */
    const upHandler = (e: TouchEvent) => {
      e.preventDefault();

      // unbind event listeners
      window.removeEventListener("touchend", moveHandler);
      window.removeEventListener("touchcancel", upHandler);
      window.removeEventListener("touchmove", moveHandler);

      // user callback
      return up?.(e);
    };

    /** handle move events once drag has begun */
    const moveHandler = (e: TouchEvent) => {
      e.preventDefault();

      for (const touch of Array.from(e.changedTouches)) {
        if (touch.identifier !== touchId) continue;

        // compute difference from last position
        const dx = touch.clientX - lastX,
          dy = touch.clientY - lastY;
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
export function screenToSVG(elt: SVGElement, x: number, y: number) {
  let graphicsElt = elt;
  while (!(graphicsElt instanceof SVGGraphicsElement))
    graphicsElt = graphicsElt.parentNode as SVGElement;
  const svgElt = elt instanceof SVGSVGElement ? elt : elt.ownerSVGElement!;
  const transform = graphicsElt.getScreenCTM()!.inverse();
  let pt = svgElt.createSVGPoint();
  pt.x = x;
  pt.y = y;
  pt = pt.matrixTransform(transform);
  return [pt.x, pt.y];
}

/** convert relative screen coordinates to SVG coordinates */
export function screenToSVGVector(svg: SVGSVGElement, dx: number, dy: number) {
  const rect = svg.getBoundingClientRect(),
    viewBox = svg.viewBox.baseVal,
    aspectX = rect.width / viewBox.width,
    aspectY = rect.height / viewBox.height,
    svgDx = dx / aspectX,
    svgDy = dy / aspectY;
  return [svgDx, svgDy];
}
