import * as THREE from "three";
export function makeScene({ animate: animationFn, camera: cameraConfig = {}, container = document.body, controls: controlsConstructor, } = {}) {
    const scene = new THREE.Scene();
    const rect = container.getBoundingClientRect();
    const camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000);
    if (cameraConfig.up) {
        camera.up.set(...cameraConfig.up);
    }
    if (cameraConfig.position) {
        camera.position.set(...cameraConfig.position);
    }
    const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
    });
    renderer.setSize(rect.width, rect.height);
    container.appendChild(renderer.domElement);
    let controls;
    if (controlsConstructor) {
        controls = new controlsConstructor(camera, renderer.domElement);
    }
    window.addEventListener("resize", () => {
        const { height, width } = container.getBoundingClientRect();
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
    function animate() {
        animationFn?.();
        controls?.update();
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(animate);
    document.body.addEventListener("click", (e) => {
        if (e.shiftKey) {
            let { x, y, z } = camera.position;
            [x, y, z] = [x, y, z].map((t) => truncate(t));
            console.log(`camera position: [${x}, ${y}, ${z}]`);
            navigator.clipboard.writeText([x, y, z].join(", ")).then(() => {
                console.log("copied camera coords to clipboard!");
            });
        }
    });
    return { camera, controls, renderer, scene };
}
export function truncate(x, precision = 2) {
    return parseFloat(x.toFixed(precision));
}
export function lerp(a, b, t) {
    return a + t * (b - a);
}
//# sourceMappingURL=three-utils.js.map