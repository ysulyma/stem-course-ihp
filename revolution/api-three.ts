import { Duration } from "@liqvid/duration";
import bezierEasing from "bezier-easing";
import * as THREE from "three";
import {
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshPhongMaterial,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";

import { lerp, makeScene, type Pt3 } from "/lib/three-utils.js";

const { cos, sin, PI } = Math,
  TWOPI = 2 * PI;

/* variables */
const settings = {
  a: -2,
  b: 2,
  fn: (x: number) => Math.cos(x) + Math.sin(x) + 2,
  showGraph: true,
  slices: 10,
};

let disks;
let graph;

const { camera, scene } = makeScene({
  camera: {
    position: [0, -5, 10],
    up: [0, 0, 1],
  },
  container: document.getElementById("three-container")!,
  controls: OrbitControls,
});

// lights
type LightConfig = {
  color?: THREE.ColorRepresentation;
  decay?: number;
  distance?: number;
  intensity?: number;
  position: Pt3;
};

const light = new THREE.AmbientLight(0x404040, Math.PI);
scene.add(light);

const pointLights: LightConfig[] = [
  { decay: 0, intensity: Math.PI, position: [0, 200, 0] },
  { decay: 0, intensity: Math.PI, position: [100, 200, 100] },
  { decay: 0, intensity: Math.PI, position: [-100, -200, -100] },
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

populateScene();

// axes helper
scene.add(new THREE.AxesHelper(5));

// renderer.localClippingEnabled = true;

// position and point the camera to the center of the scene
camera.lookAt(new THREE.Vector3(0, -3, 5));

function populateScene() {
  const geometry = revolutionGeometry();
  const material = new MeshPhongMaterial({
    color: 0x00aeff,
  });
  material.side = DoubleSide;
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);
  graph = mesh;

  // disk/washer method
  disks = new Group();
  disks.visible = false; //!settings.showGraph;
  scene.add(disks);
}

function revolutionGeometry(maxAngle = TWOPI) {
  const surface = revolution(settings.fn, settings.a, settings.b, maxAngle);

  return new ParametricGeometry(
    (u, v, target) => {
      target.set(...surface(u, v));
    },
    120,
    120,
  );
}

function populateDisks() {
  const { a, b, slices, fn } = settings;

  const width = (b - a) / slices;

  // clean up
  while (disks.children.length) disks.remove(disks.children[0]);

  // populate disks
  for (let i = 0; i < slices; ++i) {
    const p = a + i * width;

    const geometry = new CylinderGeometry(fn(p), fn(p), width, 50);
    const material = new MeshPhongMaterial({
      color: 0x5cc26d,
    });
    const mesh = new Mesh(geometry, material);

    mesh.position.set(p + width / 2, 0, 0);
    mesh.rotation.z = Math.PI / 2;

    disks.add(mesh);
  }
}

function revolution(
  f: (x: number) => number,
  a: number,
  b: number,
  maxAngle: number,
) {
  return (s: number, t: number): Pt3 => {
    const x = lerp(a, b, s),
      angle = t * maxAngle;

    return [x, f(x) * cos(angle), f(x) * sin(angle)];
  };
}

window.api3 = {
  animate() {
    /** duration in milliseconds */
    const duration = new Duration({ seconds: 5 }).inMilliseconds();
    const start = performance.now();
    const easing = bezierEasing(0.37, 0, 0.63, 1);
    function loop(t: number) {
      const progress = easing(Math.min((t - start) / duration, 1));

      graph.geometry = revolutionGeometry(progress * TWOPI);

      if (progress < 1) requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  },
  update(o) {
    Object.assign(settings, o);

    if (o.a || o.b || o.fn) graph.geometry = revolutionGeometry();
    graph.visible = settings.showGraph;

    disks.visible = !settings.showGraph;
    if (disks.visible) populateDisks();
  },
};

window.graph = graph;
