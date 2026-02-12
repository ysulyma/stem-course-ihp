import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ParametricGeometry } from "three/addons/geometries/ParametricGeometry.js";
import { lerp, makeScene, truncate } from "/lib/three-utils.js";
import { $, $e } from "/lib/utils.js";
const container = document.getElementById("container");
if (!container) {
    throw new Error("could not find element with id 'container'");
}
// create scene
const { scene } = makeScene({
    camera: {
        position: [5.92, -2.05, 5.06],
        up: [0, 0, 1], // math convention
    },
    container,
    controls: OrbitControls,
});
// add lights
const ambientLight = new THREE.AmbientLight(undefined, 0.1);
scene.add(ambientLight);
const pointLights = [
    { decay: 0, intensity: Math.PI, position: [0, 5, 5] },
    { intensity: Math.PI, position: [0, 0, -2] },
];
for (const config of pointLights) {
    const pointLight = new THREE.PointLight(config.color, config.intensity, config.distance, config.decay);
    pointLight.position.set(...[0, 5, 5]);
    scene.add(pointLight);
}
// axes helper
scene.add(new THREE.AxesHelper(5));
const fn = (x, y) => Math.cos(2 * x) * Math.sin(y) + 1;
let minZ, maxZ;
// parametric surface
{
    const geometry = new ParametricGeometry((u, v, target) => {
        const x = lerp(-5, 5, u);
        const y = lerp(-5, 5, v);
        const z = fn(x, y);
        if (minZ === undefined) {
            minZ = z;
        }
        else {
            minZ = Math.min(z, minZ);
        }
        if (maxZ === undefined) {
            maxZ = z;
        }
        else {
            maxZ = Math.max(z, maxZ);
        }
        target.set(x, y, z);
    }, 64, 64);
    const material = new THREE.MeshPhongMaterial({
        color: 0x00ff00,
        opacity: 0.5,
        side: THREE.DoubleSide,
        transparent: true,
    });
    const surface = new THREE.Mesh(geometry, material);
    scene.add(surface);
}
/**
 * input (x, y, 0) point
 */
let input;
{
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0xff0000,
        side: THREE.DoubleSide,
    });
    input = new THREE.Mesh(geometry, material);
    scene.add(input);
}
/**
 * output (x, y, z) point
 */
let output;
{
    const geometry = new THREE.SphereGeometry(0.1, 32, 32);
    const material = new THREE.MeshPhongMaterial({
        color: 0xff00ff,
        side: THREE.DoubleSide,
    });
    output = new THREE.Mesh(geometry, material);
    setOutputPosition();
    scene.add(output);
}
output;
/** amount to move the point by */
const step = 0.1;
function setOutputPosition() {
    const { x, y } = input.position;
    output.position.set(x, y, fn(x, y));
}
// keyboard interaction
document.body.addEventListener("keydown", (e) => {
    console.log(e);
    switch (e.key) {
        case "ArrowLeft":
            input.position.setX(input.position.x - step);
            break;
        case "ArrowRight":
            input.position.setX(input.position.x + step);
            break;
        case "ArrowUp":
            input.position.setY(input.position.y + step);
            break;
        case "ArrowDown":
            input.position.setY(input.position.y - step);
            break;
        case "?":
            document.getElementById("controls").classList.toggle("hidden");
            break;
        case " ":
            playPitch(output.position.z);
            break;
        case ";": {
            let { x, y, z } = output.position;
            [x, y, z] = [x, y, z].map((t) => truncate(t));
            speak(`x: ${x}, y: ${y}, z: ${z}`);
            break;
        }
    }
    setOutputPosition();
});
// MDN voice example
const synth = window.speechSynthesis;
const voiceSelect = $("select");
let voices = [];
function populateVoiceList() {
    voices = synth
        .getVoices()
        .filter((voice) => voice.lang.startsWith("en-"))
        .sort((a, b) => {
        const aname = a.name.toUpperCase();
        const bname = b.name.toUpperCase();
        if (aname < bname) {
            return -1;
        }
        else if (aname === bname) {
            return 0;
        }
        else {
            return +1;
        }
    });
    const selectedIndex = voiceSelect.selectedIndex < 0 ? 0 : voiceSelect.selectedIndex;
    voiceSelect.innerHTML = "";
    for (const voice of voices) {
        const option = $e("option");
        option.textContent = `${voice.name} (${voice.lang})`;
        if (voice.default) {
            option.textContent += " -- DEFAULT";
        }
        option.setAttribute("data-lang", voice.lang);
        option.setAttribute("data-name", voice.name);
        voiceSelect.appendChild(option);
    }
    voiceSelect.selectedIndex = selectedIndex;
}
populateVoiceList();
if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoiceList;
}
function speak(text) {
    if (synth.speaking) {
        console.error("speechSynthesis.speaking");
        return;
    }
    if (text === "")
        return;
    const utterThis = new SpeechSynthesisUtterance(text);
    utterThis.onend = () => {
        console.log("SpeechSynthesisUtterance.onend");
    };
    utterThis.onerror = () => {
        console.error("SpeechSynthesisUtterance.onerror");
    };
    const selectedOption = voiceSelect.selectedOptions[0].getAttribute("data-name");
    utterThis.voice = voices.find((voice) => voice.name === selectedOption);
    // utterThis.pitch = pitch.value;
    // utterThis.rate = rate.value;
    synth.speak(utterThis);
}
// pitches
// https://github.com/ysulyma/stem-course/blob/main/content/framework/app/audio-graph-3d/client.tsx
const audioCtx = new // biome-ignore lint/suspicious/noExplicitAny: safari compatibility
 (window.AudioContext || window.webkitAudioContext)();
function playPitch(z) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const duration = 0.5;
    // remap pitch to [0, 1]
    const pitch = (z - minZ) / (maxZ - minZ);
    // Frequency range: C4 to A5
    const minFreq = 261.63;
    const maxFreq = 880;
    const frequency = lerp(minFreq, maxFreq, pitch);
    oscillator.type = "sine"; // try "square", "sawtooth", etc.
    oscillator.frequency.value = frequency;
    gainNode.gain.value = 0.2; // keep it gentle
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}
//# sourceMappingURL=scene.js.map