const TWOPI = 2 * Math.PI;
export function getDummyCanvas(calc) {
    const subscriptions = [];
    const canvas = document.createElement("canvas");
    canvas.classList.add("desmos-dummy");
    const ctx = canvas.getContext("2d");
    const subscribe = (callback) => {
        subscriptions.push(callback);
        return () => {
            const index = subscriptions.indexOf(callback);
            if (index !== -1) {
                subscriptions.splice(index, 1);
            }
        };
    };
    const domElement = calc.domChangeDetector.elt;
    domElement.parentElement.insertBefore(canvas, domElement);
    function measure() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        transform();
    }
    window.addEventListener("resize", measure);
    let prev;
    function transform() {
        if (prev) {
            ctx.clearRect(prev.left, prev.top - prev.height - 1, prev.width + 1, prev.height + 1);
        }
        const { width: pixelWidth, height: pixelHeight, left: pixelLeft, top: pixelTop, } = calc.graphpaperBounds.pixelCoordinates;
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${pixelWidth}px`;
        canvas.style.height = `${pixelHeight}px`;
        canvas.style.left = `${pixelLeft}px`;
        canvas.style.top = `${pixelTop}px`;
        const { width, height, left, top } = calc.graphpaperBounds.mathCoordinates;
        const aspect = canvas.width / width;
        ctx.setTransform(canvas.width / width, 0, 0, -canvas.height / height, -left * aspect, (top * canvas.height) / height);
        ctx.lineWidth = 1 / aspect;
        prev = { height, left, top, width };
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
export function Rotor({ calculator, color = "#000", length = 0.25, rotor, }) {
    const { ctx, destroy } = getDummyCanvas(calculator);
    let theta = 0;
    let prev = performance.now();
    let x = 0, y = 0;
    let cancellationId;
    function draw(t) {
        theta += (rotor(x, y) * (t - prev)) / 1000 / 2;
        theta %= TWOPI;
        prev = t;
        const { width, height, left, top } = calculator.graphpaperBounds.mathCoordinates;
        ctx.clearRect(left, top - height - 1, width + 1, height + 1);
        ctx.strokeStyle = color;
        const dx = length * Math.cos(theta);
        const dy = length * Math.sin(theta);
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
        cancellationId = requestAnimationFrame(draw);
    }
    cancellationId = requestAnimationFrame(draw);
    return {
        destroy: () => {
            cancelAnimationFrame(cancellationId);
            destroy();
        },
        setX(xValue) {
            x = xValue;
        },
        setY(yValue) {
            y = yValue;
        },
    };
}
export function VectorField({ calculator, color = "#000", headLength = 0.4, headWidth = 0.2 * headLength, implicitDomain, scale = 1, vectorField, }) {
    const { canvas, ctx, destroy, subscribe } = getDummyCanvas(calculator);
    function draw() {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        const step = implicitDomain?.step ?? 1;
        const { top, left, bottom, right, width } = calculator.graphpaperBounds.mathCoordinates;
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
        const mx = Math.min(40, Math.floor((bounds.max[0] - bounds.min[0]) / bounds.step[0]));
        const my = Math.min(30, Math.floor((bounds.max[1] - bounds.min[1]) / bounds.step[1]));
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
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + dx, y + dy);
                ctx.stroke();
                ctx.closePath();
                const px = x + dx;
                const py = y + dy;
                const ux = dx / norm;
                const uy = dy / norm;
                const aspect = canvas.width / width / 20;
                const rx = px - (ux * headLength) / aspect;
                const ry = py - (uy * headLength) / aspect;
                ctx.beginPath();
                ctx.lineTo(rx - (uy * headWidth) / aspect / 2, ry + (ux * headWidth) / aspect / 2);
                ctx.lineTo(px, py);
                ctx.lineTo(rx + (uy * headWidth) / aspect / 2, ry - (ux * headWidth) / aspect / 2);
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
export function lerp(a, b, t) {
    return a + t * (b - a);
}
//# sourceMappingURL=desmos-extensions.js.map