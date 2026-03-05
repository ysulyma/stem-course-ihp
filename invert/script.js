import { dragHelper, screenToSVG } from "./drag-utils-2d.js";
import { $, $svg } from "/lib/utils.js";
/* ------------------------- configuration ------------------------- */
const a = -5, b = 5;
/** function we want to plot */
const f = (t) => [t, -(t ** 5 / 120 + Math.exp(t / 2))];
/** how many iterations in the animation */
const numIterations = 10;
/** time between iteration steps, measured in milliseconds */
const iterationTime = 1000;
/** app state */
const state = {
    iteration: 0,
    paused: false,
    showX: false,
    timeout: null,
    x: 0,
    y: 0,
};
/* ------------------------- get references to elements ------------------------- */
/** root SVG element of our scene */
const svg = $("svg");
/** animation-controlled X point */
const pointX = $(".point-x");
/** draggable Y point */
const pointY = $(".point-y");
/**
 * Invisible additional point with a fatter radius, only rendered on mobile.
 * Without this, mobile users will have a hard time precisely hitting the
 * drag target with their fingers.
 */
const fatFingers = $(".fat-fingers");
/** vertical dashed line indicating the current guess for the x value */
const xLine = $(".line-x");
/** horizontal dashed line indicating the y-value we want to invert */
const yLine = $(".line-y");
/** region of possible x values we have narrowed down to */
const testRegion = $("#test-region");
/** button to start the animation */
const findInverseButton = $("#find-inverse");
/** button to pause or resume the animation */
const pauseResumeButton = $("#pause-resume");
/** KaTeX element indicating current lower bound for x */
const xValue = $("#x-approx");
/** KaTeX element indicating current value of y */
const yValue = $("#y-value");
/* ------------------------- draw the base graph ------------------------- */
// draw cartesian grid over test region
const grid = drawCartesianGrid({ xMax: b, xMin: a, yMax: 5, yMin: -5 });
testRegion.after(grid);
// plot function over cartesian grid
grid.after(graph(f, a, b));
/* ------------------------- update elements from state ------------------------- */
function update() {
    const uncertainty = (b - a) * 2 ** -state.iteration;
    const lowerBound = state.x.toFixed(4);
    const upperBound = (state.x + uncertainty).toFixed(4);
    // whether to show the x guess or not
    document.body.classList.toggle("show-x", state.showX);
    // test region
    testRegion.setAttribute("width", String(uncertainty));
    // pause/resume text
    pauseResumeButton.textContent = state.paused ? "Resume" : "Pause";
    /* ---------- update KaTeX ---------- */
    katex.render(String.raw `${lowerBound} \le x \le ${upperBound}`, xValue);
    katex.render(`y = ${state.y.toFixed(4)}`, yValue);
    /* ---------- update x attributes ---------- */
    const xAttr = String(state.x);
    testRegion.setAttribute("x", xAttr);
    pointX.setAttribute("cx", xAttr);
    xLine.setAttribute("x1", xAttr);
    xLine.setAttribute("x2", xAttr);
    /* ---------- update y attributes ---------- */
    const yAttr = String(-state.y);
    // points
    pointY.setAttribute("cy", yAttr);
    fatFingers.setAttribute("cy", yAttr);
    // lines
    yLine.setAttribute("y1", yAttr);
    yLine.setAttribute("y2", yAttr);
}
/* ------------------------- set up event listeners ------------------------- */
// dragging
const dragEvents = {
    down: () => {
        // add dragging cursor
        document.body.classList.add("dragging");
    },
    move: (_e, hit) => {
        // convert to SVG coordinates
        const [, svgY] = screenToSVG(svg, hit.x, hit.y);
        // update
        Object.assign(state, {
            showX: false,
            y: -svgY,
        });
        update();
    },
    up: () => {
        // remove dragging cursor
        document.body.classList.remove("dragging");
    },
};
dragHelper(pointY, dragEvents);
dragHelper(fatFingers, dragEvents);
// animation
findInverseButton.addEventListener("click", () => {
    // start the animation
    const timeout = setTimeout(animate, iterationTime);
    // update
    Object.assign(state, {
        iteration: 0,
        paused: false,
        showX: true,
        timeout,
        x: a,
    });
    update();
});
// pause/resume
pauseResumeButton.addEventListener("click", () => {
    if (state.paused) {
        Object.assign(state, {
            paused: false,
            timeout: setTimeout(animate, iterationTime),
        });
    }
    else {
        // cancel the next iteration step
        clearTimeout(state.timeout);
        Object.assign(state, { paused: true });
    }
    update();
});
/* ------------------------- animation code ------------------------- */
function animate() {
    // schedule next animation step
    let timeout = null;
    if (state.iteration < numIterations) {
        timeout = setTimeout(animate, iterationTime);
    }
    // sample f at the next midpoint
    const nextWidth = (b - a) * 2 ** -(state.iteration + 1);
    const testY = -f(state.x + nextWidth)[1];
    const dx = testY <= state.y ? nextWidth : 0;
    // update
    Object.assign(state, {
        iteration: state.iteration + 1,
        timeout,
        x: state.x + dx,
    });
    update();
}
/* ------------------------- helper functions ------------------------- */
/** draw a cartesian grid */
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
/** Graph a parametric function over an interval */
function graph(f, a = 0, b = 1, sampling = 100) {
    const instructions = range(sampling + 1).map((n) => {
        const [x, y] = f(a + (n / sampling) * (b - a));
        return n === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    });
    return $svg("path", { class: "plot", d: instructions.join(" ") });
}
/** return the array [0, 1, …, n-1] */
function range(n) {
    return Array.from({ length: n }).map((_, index) => index);
}
/* ------------------------- prevent accidental zooming on mobile (I think) ------------------------- */
document.addEventListener("touchmove", (e) => e.preventDefault(), {
    passive: false,
});
document.addEventListener("touchforcechange", (e) => e.preventDefault(), {
    passive: false,
});
//# sourceMappingURL=script.js.map