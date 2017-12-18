import THREE = require("three");
import bgBackUrl = require("../static/bg_back.png");
import bgBotUrl = require("../static/bg_bot.png");
import bgFrontUrl = require("../static/bg_front.png");
import bgLeftUrl = require("../static/bg_left.png");
import bgRightUrl = require("../static/bg_right.png");
import bgTopUrl = require("../static/bg_top.png");
import imageUrl = require("../static/hank.png");
import { Animation, runAnimations } from "./animationEngine";
import { FlatteningBall } from "./flatteningBall";
import "./index.scss";

const FIELD_OF_VIEW = 75;

function main(): void {
    const scene = new THREE.Scene();
    const aspectRatio = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(
        FIELD_OF_VIEW,
        aspectRatio,
        0.1,
        1000,
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    handleResizes(camera, renderer);
    addCanvas(renderer);
    addSkybox(scene);

    const texture = new THREE.TextureLoader().load(imageUrl);
    const startBall = FlatteningBall.create({
        texture,
        radius: 1,
        center: new THREE.Vector3(0, 0, 0),
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    startBall.setFlatness(1);
    scene.add(startBall.mesh);
    camera.position.x = startBall.flatCameraPosition.x;
    camera.position.y = startBall.flatCameraPosition.y;
    camera.position.z = startBall.flatCameraPosition.z;

    const endBall = FlatteningBall.create({
        texture,
        radius: 1,
        center: new THREE.Vector3(6, 0, 0),
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    endBall.setFlatness(0);
    scene.add(endBall.mesh);

    const animations: Animation[] = [
        {
            startTime: 2000,
            duration: 1000,
            effect: t => startBall.setFlatness(1 - t),
        },
        {
            startTime: 2000,
            duration: 4000,
            effect: t => {
                camera.position.x = 6 * t;
                camera.position.z =
                    startBall.flatCameraPosition.z + 4 * 2 * t * (1 - t);
            },
        },
        {
            startTime: 3000,
            duration: 3000,
            effect: t => (camera.rotation.y = -4 * Math.PI / 8 * t * (1 - t)),
        },
        {
            startTime: 5000,
            duration: 1000,
            effect: t => endBall.setFlatness(t),
        },
    ];
    runAnimations(animations, () => renderer.render(scene, camera));
}

function addSkybox(scene: THREE.Scene): void {
    scene.background = new THREE.CubeTextureLoader().load([
        bgLeftUrl,
        bgRightUrl,
        bgTopUrl,
        bgBotUrl,
        bgBackUrl,
        bgFrontUrl,
    ]);
}

function handleResizes(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.Renderer,
): void {
    // Throttle resizes, as suggested by MDN.
    window.addEventListener("resize", () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

function addCanvas(renderer: THREE.Renderer): void {
    const canvas = renderer.domElement;
    canvas.style.position = "absolute";
    document.body.appendChild(canvas);
}

main();
