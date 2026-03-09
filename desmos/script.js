import { Rotor, VectorField } from "./desmos-extensions.js";
const elt = document.getElementById("calculator");
const calculator = Desmos.GraphingCalculator(elt, {
    expressionsCollapsed: true,
    projectorMode: true,
});
window.calculator = calculator;
calculator.setMathBounds({
    bottom: -0.7973141530854024,
    left: -1.8302562099415733,
    right: 3.129546539934864,
    top: 2.055297545454642,
});
calculator.setExpressions([
    {
        color: Desmos.Colors.GREEN,
        id: "tb",
        latex: String.raw `\left|y-.5\right|=.5\ \left\{0\le x\le1\right\}`,
    },
    {
        color: Desmos.Colors.GREEN,
        id: "lr",
        latex: "\\left|x-.5\\right|=.5\\left\\{0\\le y\\le1\\right\\}",
    },
    {
        color: Desmos.Colors.RED,
        id: "pt",
        latex: "(u,v)",
    },
    {
        color: Desmos.Colors.RED,
        id: "u",
        latex: "u=.5",
    },
    {
        color: Desmos.Colors.RED,
        id: "v",
        latex: "v=.5",
    },
]);
VectorField({
    calculator,
    color: Desmos.Colors.BLUE,
    headLength: 1,
    headWidth: 1,
    implicitDomain: {
        max: [1, 1],
        min: [-1, -1],
        step: 0.1,
    },
    scale: 0.3,
    vectorField: (x, y) => [2 * x * y, -y],
});
const rotor = Rotor({
    calculator,
    color: Desmos.Colors.RED,
    length: 0.15,
    rotor: (x, _y) => -2 * x,
});
const u = calculator.HelperExpression({ latex: "u" });
u.observe("numericValue", () => {
    rotor.setX(u.numericValue);
});
const v = calculator.HelperExpression({ latex: "v" });
v.observe("numericValue", () => {
    rotor.setY(v.numericValue);
});
//# sourceMappingURL=script.js.map