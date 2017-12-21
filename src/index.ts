import THREE = require("three");
import bgBackUrl = require("../static/bg_back.png");
import bgBotUrl = require("../static/bg_bot.png");
import bgFrontUrl = require("../static/bg_front.png");
import bgLeftUrl = require("../static/bg_left.png");
import bgRightUrl = require("../static/bg_right.png");
import bgTopUrl = require("../static/bg_top.png");
import imageUrl = require("../static/hank.png");
import planetUrl = require("../static/venus.jpg");
import { Animation, runAnimations } from "./animationEngine";
import * as Animations from "./animations";
import { FlatteningBall } from "./flatteningBall";
import "./index.scss";
import { copyRenderState, RenderState } from "./interfaces";
import { toRect } from "./latLon";

const FIELD_OF_VIEW = 60;
const BIG_PLANET_RADIUS = 48;
const START_LOCATION = toRect({
    lat: -Math.PI / 6,
    lon: Math.PI / 3,
    r: BIG_PLANET_RADIUS + 10,
});
const END_LOCATION = toRect({
    lat: Math.PI / 3,
    lon: -3 * Math.PI / 3,
    r: BIG_PLANET_RADIUS + 10,
});
const AMBIENT_LIGHTING_INTENSITY = 0.7;
const POINT_LIGHT_COLOR = "#A66321";
const POINT_LIGHT_INTENSITY = 6;

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

    const planetTexture = new THREE.TextureLoader().load(planetUrl);
    const planetGeometry = new THREE.SphereBufferGeometry(
        BIG_PLANET_RADIUS,
        32,
        32,
    );
    const planetMaterial = new THREE.MeshBasicMaterial({
        map: planetTexture,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planet);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(
        POINT_LIGHT_COLOR,
        POINT_LIGHT_INTENSITY,
    );
    scene.add(pointLight);

    const texture = new THREE.TextureLoader().load(imageUrl);
    const startBall = FlatteningBall.create({
        texture,
        radius: 1,
        center: START_LOCATION,
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
        center: END_LOCATION,
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    endBall.setFlatness(0);
    scene.add(endBall.mesh);

    const initialState: RenderState = {
        startBallPosition: START_LOCATION,
        startBallFlatPosition: startBall.flatCameraPosition,
        startBallFlatness: 1,
        endBallPosition: END_LOCATION,
        endBallFlatPosition: endBall.flatCameraPosition,
        endBallFlatness: 0,
        cameraPosition: startBall.flatCameraPosition,
        cameraLookAt: START_LOCATION,
        lighting: 0,
    };

    const render = (state: RenderState) => {
        const {
            startBallFlatness,
            endBallFlatness,
            cameraPosition,
            cameraLookAt,
            lighting,
        } = state;
        startBall.setFlatness(startBallFlatness);
        endBall.setFlatness(endBallFlatness);
        camera.position.copy(cameraPosition);
        camera.lookAt(cameraLookAt);
        ambientLight.intensity =
            (1 - lighting) * 1 + lighting * AMBIENT_LIGHTING_INTENSITY;
        pointLight.intensity = lighting * POINT_LIGHT_INTENSITY;
        renderer.render(scene, camera);
    };

    const animations: Array<Animation<RenderState>> = [
        {
            startTime: 1500,
            endTime: 2500,
            updateState: Animations.setStartBallFlatness(0),
        },
        {
            startTime: 1500,
            endTime: 2500,
            updateState: Animations.setLighting(1),
        },
        {
            startTime: 2000,
            endTime: 10000,
            updateState: Animations.eased(
                Animations.travelGreatCircleTo(endBall.flatCameraPosition),
            ),
        },
        {
            startTime: 2000,
            endTime: 10000,
            updateState: Animations.moveLookAtTarget(END_LOCATION),
        },
        {
            startTime: 9000,
            endTime: 10000,
            updateState: Animations.setLighting(0),
        },
        {
            startTime: 9000,
            endTime: 10000,
            updateState: Animations.setEndBallFlatness(1),
        },
    ];
    runAnimations(animations, initialState, copyRenderState, render);
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
