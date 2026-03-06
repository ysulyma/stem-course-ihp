import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { makeMeshDraggable, screenToScene } from "./drag-utils-3d.js";
import { makeScene } from "/lib/three-utils.js";
const mobiusRadius = 2;
const { cos, sin, PI } = Math, TWOPI = 2 * PI;
const objects = {};
const container = document.getElementById("container");
const { camera, controls, renderer, scene } = makeScene({
    camera: {
        position: [3, 0.83, 2.15],
        up: [0, 0, 1],
    },
    container,
    controls: OrbitControls,
});
{
    const ambientLight = new THREE.AmbientLight(undefined, 0.1);
    scene.add(ambientLight);
    const pointLights = [
        { decay: 0, intensity: Math.PI, position: [0, 200, 0] },
        { decay: 0, intensity: Math.PI, position: [100, 200, 100] },
        { decay: 0, intensity: Math.PI, position: [-100, -200, -100] },
    ];
    for (const config of pointLights) {
        const pointLight = new THREE.PointLight(config.color, config.intensity, config.distance, config.decay);
        pointLight.position.set(...config.position);
        scene.add(pointLight);
    }
}
const elevation = 1.5;
const fiberColor = 0x1bbb68;
const baseColor = 0x1a69b5;
const totalColor = 0xffff00;
const sectionColor = 0xff7000;
scene.add(new THREE.AxesHelper(5));
{
    class CustomCurve extends THREE.Curve {
        constructor() {
            super();
        }
        getPoint(t, target = new THREE.Vector3()) {
            return target.set(...mobius(t * TWOPI, 0.5));
        }
    }
    const geometry = new THREE.TubeGeometry(new CustomCurve(), 50, 0.02, 50, true);
    const material = new THREE.MeshBasicMaterial({ color: baseColor });
    const line = new THREE.Mesh(geometry, material);
    scene.add(line);
}
{
    class CustomCurve extends THREE.Curve {
        constructor() {
            super();
        }
        getPoint(t, target = new THREE.Vector3()) {
            return target.set(...mobius(t * TWOPI, 0.5));
        }
    }
    const geometry = new THREE.TubeGeometry(new CustomCurve(), 50, 0.02, 50, true);
    const material = new THREE.MeshBasicMaterial({
        color: baseColor,
        opacity: 0.5,
        transparent: true,
    });
    const line = new THREE.Mesh(geometry, material);
    line.position.z = elevation;
    scene.add(line);
}
{
    const geometry = new THREE.SphereGeometry(0.05, 20, 20);
    const material = new THREE.MeshBasicMaterial({ color: baseColor });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(mobiusRadius, 0, 0);
    scene.add(mesh);
    objects.ball = mesh;
}
{
    const geometry = new ParametricGeometry((theta, t, target) => {
        target.set(...mobius(theta * TWOPI, t));
    }, 50, 50);
    const material = new THREE.MeshPhongMaterial({
        color: totalColor,
        side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    mesh.position.z = elevation;
    objects.mobius = mesh;
}
{
    const geometry = new THREE.CylinderGeometry(0.02, 0.02, 1);
    const material = new THREE.MeshBasicMaterial({ color: fiberColor });
    const line = new THREE.Mesh(geometry, material);
    line.rotateX(TWOPI / 4);
    line.position.set(mobiusRadius, 0, elevation);
    scene.add(line);
    objects.fiber = line;
}
{
    class CustomCurve extends THREE.Curve {
        constructor() {
            super();
        }
        getPoint(t, target = new THREE.Vector3()) {
            return target.set(...mobius(t * TWOPI, 0.5 - Math.sin(t * Math.PI) / 2.5));
        }
    }
    const geometry = new THREE.TubeGeometry(new CustomCurve(), 50, 0.02, 50, true);
    const material = new THREE.MeshBasicMaterial({ color: sectionColor });
    const line = new THREE.Mesh(geometry, material);
    line.position.z = elevation;
    scene.add(line);
}
makeMeshDraggable(objects.ball, {
    move: ({ x, y }) => {
        const pos = screenToScene(x, y, new THREE.Plane(new THREE.Vector3(0, 0, 1)), renderer, camera);
        const theta = (Math.atan2(pos.y, pos.x) + TWOPI) % TWOPI;
        objects.ball.position.set(mobiusRadius * cos(theta), mobiusRadius * sin(theta), 0);
        const [rotation, position] = arrowOrient(new THREE.Vector3(...mobius(theta, 0)), new THREE.Vector3(...mobius(theta, 1)));
        position.z = 1.5;
        objects.fiber.setRotationFromMatrix(rotation);
        objects.fiber.position.copy(position);
    },
}, {
    camera,
    container,
    controls,
    renderer,
});
function mobius(theta, t) {
    const R = mobiusRadius, r = 0.5, n = 1;
    t = -r + 2 * r * t;
    return [
        cos(theta) * (R - t * sin((theta * n) / 2)),
        sin(theta) * (R - t * sin((theta * n) / 2)),
        t * cos((theta * n) / 2),
    ];
}
function arrowOrient(pointX, pointY) {
    const orientation = new THREE.Matrix4();
    orientation.lookAt(pointX, pointY, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().set(1, 0, 0, 0, 0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 1));
    const position = new THREE.Vector3((pointY.x + pointX.x) / 2, (pointY.y + pointX.y) / 2, (pointY.z + pointX.z) / 2);
    return [orientation, position];
}
//# sourceMappingURL=script.js.map