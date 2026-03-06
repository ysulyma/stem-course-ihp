import { dragHelper, screenToSVG } from "./drag-utils-2d.js";
import { $, $svg } from "/lib/utils.js";
const a = -5, b = 5;
const f = (t) => [t, -(t ** 5 / 120 + Math.exp(t / 2))];
const numIterations = 10;
const iterationTime = 1000;
const state = {
    iteration: 0,
    paused: false,
    showX: false,
    timeout: null,
    x: 0,
    y: 0,
};
const svg = $("svg");
const pointX = $(".point-x");
const pointY = $(".point-y");
const fatFingers = $(".fat-fingers");
const xLine = $(".line-x");
const yLine = $(".line-y");
const testRegion = $("#test-region");
const findInverseButton = $("#find-inverse");
const pauseResumeButton = $("#pause-resume");
const xValue = $("#x-approx");
const yValue = $("#y-value");
const grid = drawCartesianGrid({ xMax: b, xMin: a, yMax: 5, yMin: -5 });
testRegion.after(grid);
grid.after(graph(f, a, b));
function update() {
    const uncertainty = (b - a) * 2 ** -state.iteration;
    const lowerBound = state.x.toFixed(4);
    const upperBound = (state.x + uncertainty).toFixed(4);
    document.body.classList.toggle("show-x", state.showX);
    testRegion.setAttribute("width", String(uncertainty));
    pauseResumeButton.textContent = state.paused ? "Resume" : "Pause";
    katex.render(String.raw `${lowerBound} \le x \le ${upperBound}`, xValue);
    katex.render(`y = ${state.y.toFixed(4)}`, yValue);
    const xAttr = String(state.x);
    testRegion.setAttribute("x", xAttr);
    pointX.setAttribute("cx", xAttr);
    xLine.setAttribute("x1", xAttr);
    xLine.setAttribute("x2", xAttr);
    const yAttr = String(-state.y);
    pointY.setAttribute("cy", yAttr);
    fatFingers.setAttribute("cy", yAttr);
    yLine.setAttribute("y1", yAttr);
    yLine.setAttribute("y2", yAttr);
}
const dragEvents = {
    down: () => {
        document.body.classList.add("dragging");
    },
    move: (_e, hit) => {
        const [, svgY] = screenToSVG(svg, hit.x, hit.y);
        Object.assign(state, {
            showX: false,
            y: -svgY,
        });
        update();
    },
    up: () => {
        document.body.classList.remove("dragging");
    },
};
dragHelper(pointY, dragEvents);
dragHelper(fatFingers, dragEvents);
findInverseButton.addEventListener("click", () => {
    const timeout = setTimeout(animate, iterationTime);
    Object.assign(state, {
        iteration: 0,
        paused: false,
        showX: true,
        timeout,
        x: a,
    });
    update();
});
pauseResumeButton.addEventListener("click", () => {
    if (state.paused) {
        Object.assign(state, {
            paused: false,
            timeout: setTimeout(animate, iterationTime),
        });
    }
    else {
        clearTimeout(state.timeout);
        Object.assign(state, { paused: true });
    }
    update();
});
function animate() {
    let timeout = null;
    if (state.iteration < numIterations) {
        timeout = setTimeout(animate, iterationTime);
    }
    const nextWidth = (b - a) * 2 ** -(state.iteration + 1);
    const testY = -f(state.x + nextWidth)[1];
    const dx = testY <= state.y ? nextWidth : 0;
    Object.assign(state, {
        iteration: state.iteration + 1,
        timeout,
        x: state.x + dx,
    });
    update();
}
function drawCartesianGrid({ xMin, xMax, yMin, yMax, tickSize = 0.15, }) {
    return $svg("g", {}, [
        ...range(27).map((n) => n !== 5 &&
            $svg("g", {}, [
                $svg("line", {
                    class: "gridline",
                    x1: n - 5,
                    x2: n - 5,
                    y1: yMin,
                    y2: yMax,
                }),
                $svg("line", {
                    class: "axis-tick",
                    x1: n - 5,
                    x2: n - 5,
                    y1: -tickSize,
                    y2: tickSize,
                }),
                $svg("text", { class: "axis-label", dx: tickSize, dy: 0.5, x: n - xMax, y: 0 }, n - 5),
            ])),
        $svg("text", { class: "axis-label", dx: 0.25, dy: 0.4, x: 0, y: 0 }, "0"),
        ...range(10).map((n) => n !== 5 &&
            $svg("g", {}, [
                $svg("line", {
                    class: "gridline",
                    x1: xMin,
                    x2: xMax,
                    y1: 5 - n,
                    y2: 5 - n,
                }),
                $svg("line", {
                    class: "axis-tick",
                    x1: -tickSize,
                    x2: tickSize,
                    y1: 5 - n,
                    y2: 5 - n,
                }),
                $svg("text", { class: "axis-label", dx: 0.4, x: 0, y: 5 - n }, n - 5),
            ])),
        $svg("line", {
            class: "major-axis",
            x1: xMin,
            x2: xMax,
            y1: 0,
            y2: 0,
        }),
        $svg("line", {
            class: "major-axis",
            x1: 0,
            x2: 0,
            y1: yMin,
            y2: yMax,
        }),
    ]);
}
function graph(f, a = 0, b = 1, sampling = 100) {
    const instructions = range(sampling + 1).map((n) => {
        const [x, y] = f(a + (n / sampling) * (b - a));
        return n === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });
    return $svg("path", { class: "plot", d: instructions.join(" ") });
}
function range(n) {
    return Array.from({ length: n }).map((_, index) => index);
}
document.addEventListener("touchmove", (e) => e.preventDefault(), {
    passive: false,
});
document.addEventListener("touchforcechange", (e) => e.preventDefault(), {
    passive: false,
});
//# sourceMappingURL=script.js.map