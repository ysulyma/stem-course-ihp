const elt = document.getElementById("calculator");
const calculator = Desmos.GraphingCalculator(elt, {
  expressionsCollapsed: true,
  projectorMode: true,
});

calculator.setMathBounds({
  bottom: -1.804313694576221,
  left: -5.303138063665024,
  right: 4.892296506647469,
  top: 4.5678329118690915,
});

calculator.setExpressions([
  {
    text: "This shows the tangent lines to a quadratic",
    type: "text",
  },
  {
    color: Desmos.Colors.BLUE,
    latex: "y=x^2",
  },
  {
    latex: "a=1",
    sliderBounds: {
      max: "5",
      min: "-5",
    },
  },
  {
    latex: "(a, a^2)",
  },
  {
    latex: "(a, a^2) + t(1, 2a)",
    parametricDomain: {
      max: 0.5,
      min: -0.5,
    },
  },
]);
