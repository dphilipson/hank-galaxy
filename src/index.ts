import THREE = require("three");
import bgBackUrl = require("../static/bg_back.png");
import bgBotUrl = require("../static/bg_bot.png");
import bgFrontUrl = require("../static/bg_front.png");
import bgLeftUrl = require("../static/bg_left.png");
import bgRightUrl = require("../static/bg_right.png");
import bgTopUrl = require("../static/bg_top.png");
import imageUrl = require("../static/hank.png");
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
    const ball = FlatteningBall.create({
        texture,
        radius: 1,
        center: new THREE.Vector3(0, 0, 0),
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    scene.add(ball.mesh);
    camera.position.x = ball.flatCameraPosition.x;
    camera.position.y = ball.flatCameraPosition.y;
    camera.position.z = ball.flatCameraPosition.z;

    const animate = () => {
        requestAnimationFrame(animate);
        ball.setFlatness((Math.sin(Date.now() / (100 * 2 * Math.PI)) + 1) / 2);
        renderer.render(scene, camera);
    };
    animate();
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
