const TWOPI = 2 * Math.PI;

type Callback = () => void;

type Rect = {
  height: number;
  left: number;
  top: number;
  width: number;
};

interface DummyCanvasAPI {
  /** the `<canvas>` element that was created */
  canvas: HTMLCanvasElement;

  /** drawing context for the canvas */
  ctx: CanvasRenderingContext2D;

  /** remove the dummy canvas */
  destroy: () => void;

  /**
   * subscribe to Desmos viewport changes
   * @returns a function to unsubscribe
   */
  subscribe: (cb: Callback) => () => void;
}

/**
 * Use an auxiliary canvas synced with the Desmos viewport.
 */
export function getDummyCanvas(calc: Desmos.Calculator): DummyCanvasAPI {
  // subscriptions
  const subscriptions: Callback[] = [];

  // initialize canvas
  const canvas = document.createElement("canvas");
  canvas.classList.add("desmos-dummy");

  const ctx = canvas.getContext("2d")!;

  const subscribe = (callback: Callback) => {
    subscriptions.push(callback);

    return () => {
      const index = subscriptions.indexOf(callback);
      if (index !== -1) {
        subscriptions.splice(index, 1);
      }
    };
  };

  // attach canvas
  const domElement = (calc as any).domChangeDetector.elt;
  domElement.parentElement.insertBefore(canvas, domElement);

  /** measure canvas dimensions */
  function measure() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    transform();
  }
  window.addEventListener("resize", measure);

  /* sync with Desmos viewport */
  let prev: Rect;
  function transform() {
    // clear rect if exist
    if (prev) {
      ctx.clearRect(
        prev.left,
        prev.top - prev.height - 1,
        prev.width + 1,
        prev.height + 1,
      );
    }

    // match canvas dims to Desmos canvas
    const {
      width: pixelWidth,
      height: pixelHeight,
      left: pixelLeft,
      top: pixelTop,
    } = calc.graphpaperBounds.pixelCoordinates;

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
    canvas.style.width = `${pixelWidth}px`;
    canvas.style.height = `${pixelHeight}px`;
    canvas.style.left = `${pixelLeft}px`;
    canvas.style.top = `${pixelTop}px`;

    // set transform
    const { width, height, left, top } = calc.graphpaperBounds.mathCoordinates;

    const aspect = canvas.width / width;
    ctx.setTransform(
      canvas.width / width,
      0,
      0,
      -canvas.height / height,
      -left * aspect,
      (top * canvas.height) / height,
    );
    ctx.lineWidth = 1 / aspect;
    prev = { height, left, top, width };

    // repaint callbacks
    for (const callback of subscriptions) {
      callback();
    }
  }
  calc.observe("graphpaperBounds.transform", transform);

  measure();

  function destroy() {
    window.removeEventListener("resize", measure);
    calc.unobserve("graphpaperBounds.transform");
    canvas.remove();
  }

  return { canvas, ctx, destroy, subscribe };
}

/** Draw a rotor on the canvas. */
export function Rotor({
  calculator,
  color = "#000",
  length = 0.25,
  rotor,
}: {
  /** calculator to attach to */
  calculator: Desmos.Calculator;

  /** Color for the expression. */
  color?: string;

  /** Length of rotor arms. */
  length?: number;

  /** angular velocity */
  rotor: (x: number, y: number) => number;
}): {
  /** destroy the rotor */
  destroy(): void;

  /** set the X coordinate of the rotor */
  setX: (x: number) => void;

  /** set the Y coordinate of the rotor */
  setY: (y: number) => void;
} {
  // get dummy canvas
  const { ctx, destroy } = getDummyCanvas(calculator);

  /** current angle */
  let theta = 0;

  /** time of previous paint */
  let prev = performance.now();
  let x = 0,
    y = 0;

  /** for cancelling the animation */
  let cancellationId: number;

  // draw callback
  function draw(t: number) {
    // update theta
    theta += (rotor(x, y) * (t - prev)) / 1000 / 2;
    theta %= TWOPI;

    // update prev
    prev = t;

    // clear old drawing
    const { width, height, left, top } =
      calculator.graphpaperBounds.mathCoordinates;
    ctx.clearRect(left, top - height - 1, width + 1, height + 1);

    // set color
    ctx.strokeStyle = color;

    // get angle of rotor
    const dx = length * Math.cos(theta);
    const dy = length * Math.sin(theta);

    // draw rotor
    ctx.beginPath();
    ctx.moveTo(x - dx, y - dy);
    ctx.lineTo(x + dx, y + dy);
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    ctx.moveTo(x + dy, y - dx);
    ctx.lineTo(x - dy, y + dx);
    ctx.stroke();
    ctx.closePath();

    // schedule next update
    cancellationId = requestAnimationFrame(draw);
  }

  cancellationId = requestAnimationFrame(draw);

  return {
    destroy: () => {
      // cancel animation
      cancelAnimationFrame(cancellationId);

      // destroy dummy canvas
      destroy();
    },
    setX(xValue: number) {
      x = xValue;
    },
    setY(yValue: number) {
      y = yValue;
    },
  };
}

/** Draw a vector field on the dummy canvas. */
export function VectorField({
  calculator,
  color = "#000",
  headLength = 0.4,
  headWidth = 0.2 * headLength,
  implicitDomain,
  scale = 1,
  vectorField,
}: {
  /** calculator to attach to */
  calculator: Desmos.Calculator;

  /** Color for the expression. */
  color?: string;

  /** Domain for vector field. */
  implicitDomain?: {
    min: [number, number];
    max: [number, number];
    step: number; //[number, number];
  };

  /** The length of the head of the arrow. */
  headLength?: number;

  /** The width of the head of the arrow. */
  headWidth?: number;

  /** Scaling factor to apply. */
  scale?: number;

  vectorField: (x: number, y: number) => [number, number];
}): {
  /** destroy the rotor */
  destroy(): void;
} {
  const { canvas, ctx, destroy, subscribe } = getDummyCanvas(calculator);

  /* draw vector field */
  function draw() {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;

    const step = implicitDomain?.step ?? 1;
    const { top, left, bottom, right, width } =
      calculator.graphpaperBounds.mathCoordinates;

    const bounds = {
      max: implicitDomain?.max ?? [
        step * Math.ceil(right / step),
        step * Math.ceil(top / step),
      ],
      min: implicitDomain?.min ?? [
        step * Math.floor(left / step),
        step * Math.floor(bottom / step),
      ],
      step: [step, step],
    };

    const mx = Math.min(
      40,
      Math.floor((bounds.max[0] - bounds.min[0]) / bounds.step[0]),
    );
    const my = Math.min(
      30,
      Math.floor((bounds.max[1] - bounds.min[1]) / bounds.step[1]),
    );

    for (let i = 0; i <= mx; ++i) {
      const x = lerp(bounds.min[0], bounds.max[0], i / mx);
      for (let j = 0; j <= my; ++j) {
        const y = lerp(bounds.min[1], bounds.max[1], j / my);

        let [dx, dy] = vectorField(x, y);
        const norm = Math.hypot(dx, dy);
        if (norm < 1e-3) {
          continue;
        }
        dx *= scale;
        dy *= scale;

        // draw tail
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
        ctx.closePath();

        // draw head
        const px = x + dx;
        const py = y + dy;

        const ux = dx / norm;
        const uy = dy / norm;
        // const aspect = canvas.width / width / 25;
        const aspect = canvas.width / width / 20;

        const rx = px - (ux * headLength) / aspect;
        const ry = py - (uy * headLength) / aspect;

        ctx.beginPath();
        ctx.lineTo(
          rx - (uy * headWidth) / aspect / 2,
          ry + (ux * headWidth) / aspect / 2,
        );
        ctx.lineTo(px, py);
        ctx.lineTo(
          rx + (uy * headWidth) / aspect / 2,
          ry - (ux * headWidth) / aspect / 2,
        );
        ctx.fill();
      }
    }
  }

  subscribe(draw);
  draw();

  return {
    destroy,
  };
}

/**
 * Linear interpolation from a to b.
 */
export function lerp(a: number, b: number, t: number) {
  return a + t * (b - a);
}
