import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";

import { marchingCubes, marchingSquares } from "/lib/graphics.js";
import { makeScene } from "/lib/three-utils.js";

const container = document.getElementById("moduli");

if (!container) {
  throw new Error("could not find element with id 'moduli'");
}

// create scene
const { scene } = makeScene({
  camera: {
    position: [4.3, -9.5, 6],
    up: [0, 0, 1], // math convention
  },
  container,
  controls: OrbitControls,
});

// add lights
const ambientLight = new THREE.AmbientLight(undefined, 0.1);
scene.add(ambientLight);

const pointLights = [
  { decay: 0, intensity: Math.PI, position: [10, 10, 10] },
  { decay: 0, intensity: Math.PI, position: [-10, 10, 10] },
  { decay: 0, intensity: Math.PI, position: [10, -10, 10] },
];

for (const config of pointLights) {
  const pointLight = new THREE.PointLight(
    config.color,
    config.intensity,
    config.distance,
    config.decay,
  );
  pointLight.position.set(...config.position);
  scene.add(pointLight);
}

const state = {
  a: document.getElementById("range-a").valueAsNumber,
  b: document.getElementById("range-b").valueAsNumber,
};

/**
 * Generate the moduli of elliptic curves
 */
function generateModuli() {
  const existing = scene.getObjectByName("moduli");

  const resolution = 64;

  const moduliGeometry = marchingCubes(
    (x, y, z) => y ** 2 - x ** 3 - z * x - state.b,
    -5,
    5,
    resolution,
  );

  if (existing) {
    existing.geometry = moduliGeometry;
  } else {
    const material = new THREE.MeshPhongMaterial({
      color: 0x1bbb68,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(moduliGeometry, material);
    mesh.name = "moduli";

    scene.add(mesh);
  }
}

/**
 * Generate the cross-section lines mesh
 */
function generateCrossSection() {
  const existing = scene.getObjectByName("section");
  const resolution = 64;

  const edges = marchingSquares(
    -5,
    5,
    -5,
    5,
    (x, y) => y ** 2 - x ** 3 - state.a * x - state.b + state.a,
    state.a,
    resolution,
  );

  const lineGeometry = new LineSegmentsGeometry().setPositions(
    edges.reduce((a, b) => a.concat(b)),
  );

  if (existing) {
    existing.geometry = lineGeometry;
  } else {
    const rect = container.getBoundingClientRect();
    const lineMaterial = new LineMaterial({ color: 0xff0070, linewidth: 6 });
    lineMaterial.resolution.set(rect.width, rect.height);

    const linePavement = new LineSegments2(lineGeometry, lineMaterial);
    linePavement.name = "section";

    scene.add(linePavement);
  }
}

const curve = document.getElementById("svg-curve");

function update2D() {
  const edges = marchingSquares(
    -5,
    5,
    -5,
    5,
    (x, y) => y ** 2 - x ** 3 - state.a * x - state.b,
    0,
    128,
  );

  const path = [];
  for (let i = 0; i < edges.length; i += 2) {
    path.push(`M ${edges[i][0]} ${edges[i][1]}`);
    path.push(`L ${edges[i + 1][0]} ${edges[i + 1][1]}`);
  }
  const pathString = path.join(" ");

  curve.setAttribute("d", pathString);
}

function updateScene() {
  generateModuli();
  generateCrossSection();
  update2D();
}

// initialization
updateScene();

// wire up inputs
const rangeA = document.getElementById("range-a");
const numericA = document.getElementById("numeric-a");
const rangeB = document.getElementById("range-b");
const numericB = document.getElementById("numeric-b");

rangeA.addEventListener("input", () => {
  // sync inputs
  numericA.value = rangeA.value;

  // update state
  state.a = rangeA.valueAsNumber;

  // re-render
  updateScene();
});

numericA.addEventListener("input", () => {
  // sync inputs
  rangeA.value = numericA.value;

  // update state
  state.a = numericA.valueAsNumber;

  // re-render
  updateScene();
});

rangeB.addEventListener("input", () => {
  // sync inputs
  numericB.value = rangeB.value;

  // update state
  state.b = rangeB.valueAsNumber;

  // re-render
  updateScene();
});

numericB.addEventListener("input", () => {
  // sync inputs
  rangeB.value = numericB.value;

  // update state
  state.b = numericB.valueAsNumber;

  // re-render
  updateScene();
});
