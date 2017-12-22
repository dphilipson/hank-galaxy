import seedrandom = require("seedrandom");
import THREE = require("three");
import bgBackUrl = require("../static/bg_back.png");
import bgBotUrl = require("../static/bg_bot.png");
import bgFrontUrl = require("../static/bg_front.png");
import bgLeftUrl = require("../static/bg_left.png");
import bgRightUrl = require("../static/bg_right.png");
import bgTopUrl = require("../static/bg_top.png");
import hankUrl = require("../static/hank.png");
import lunaUrl = require("../static/luna.png");
import debrisRareUrl = require("../static/mars.jpg");
import debrisCommonUrl = require("../static/moon.jpg");
import smallPlanetUrl = require("../static/neptune.jpg");
import planetUrl = require("../static/venus.jpg");
import { Animation, runAnimations } from "./animationEngine";
import * as Animations from "./animations";
import { FlatteningBall } from "./flatteningBall";
import "./index.scss";
import { toRect } from "./latLon";
import { copyRenderState, RenderState } from "./renderState";

const FIELD_OF_VIEW = 60;
const BIG_PLANET_RADIUS = 48;
const START_LOCATION = toRect({
    lat: -Math.PI / 6,
    lon: Math.PI / 3,
    r: BIG_PLANET_RADIUS + 10,
});
const END_LOCATION = toRect({
    lat: Math.PI / 3,
    lon: -2 * Math.PI / 3,
    r: BIG_PLANET_RADIUS + 10,
});
const SMALL_PLANET_RADIUS = 32;
const SMALL_PLANET_LOCATION = toRect({
    lat: -Math.PI / 6,
    lon: Math.PI,
    r: BIG_PLANET_RADIUS + 40 + SMALL_PLANET_RADIUS,
});
const DEBRIS_COUNT = 16;

const AMBIENT_LIGHTING_INTENSITY = 0.7;
const POINT_LIGHT_COLOR = "#A66321";
const POINT_LIGHT_INTENSITY = 6;
const ATMOSPHERE_COLOR = "#D9822B";
const ATMOSPHERE_THICKNESS = 0.5;
const ATMOSPHERE_OPACITY = 0.25;

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
    addBigPlanet(scene);
    addBigPlanetAtmosphere(scene);
    addSmallPlanet(scene);
    addDebris(scene);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(
        POINT_LIGHT_COLOR,
        POINT_LIGHT_INTENSITY,
    );
    scene.add(pointLight);

    const startTexture = new THREE.TextureLoader().load(hankUrl);
    const startBall = FlatteningBall.create({
        texture: startTexture,
        radius: 1,
        center: START_LOCATION,
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    startBall.setFlatness(1);
    scene.add(startBall.mesh);

    const endTexture = new THREE.TextureLoader().load(lunaUrl);
    const endBall = FlatteningBall.create({
        texture: endTexture,
        radius: 1,
        center: END_LOCATION,
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    endBall.setFlatness(0);
    scene.add(endBall.mesh);

    const initialState: RenderState = {
        startBallFlatness: 1,
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

function addBigPlanet(scene: THREE.Scene): void {
    const texture = new THREE.TextureLoader().load(planetUrl);
    const geometry = new THREE.SphereBufferGeometry(BIG_PLANET_RADIUS, 32, 32);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
    });
    const planet = new THREE.Mesh(geometry, material);
    scene.add(planet);
}

function addBigPlanetAtmosphere(scene: THREE.Scene): void {
    const geometry = new THREE.SphereBufferGeometry(
        BIG_PLANET_RADIUS + ATMOSPHERE_THICKNESS,
        32,
        32,
    );
    const material = new THREE.MeshBasicMaterial({
        color: ATMOSPHERE_COLOR,
        transparent: true,
        opacity: ATMOSPHERE_OPACITY,
    });
    const planet = new THREE.Mesh(geometry, material);
    scene.add(planet);
}

function addSmallPlanet(scene: THREE.Scene): void {
    const texture = new THREE.TextureLoader().load(smallPlanetUrl);
    const geometry = new THREE.SphereBufferGeometry(
        SMALL_PLANET_RADIUS,
        16,
        16,
    );
    const material = new THREE.MeshLambertMaterial({
        map: texture,
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.position.copy(SMALL_PLANET_LOCATION);
    scene.add(planet);
}

function addDebris(scene: THREE.Scene): void {
    const random = seedrandom("seed");
    const textureCommon = new THREE.TextureLoader().load(debrisCommonUrl);
    const textureRare = new THREE.TextureLoader().load(debrisRareUrl);
    for (let i = 0; i < DEBRIS_COUNT; i++) {
        const texture = random() < 0.1 ? textureRare : textureCommon;
        const lat = randomInRange(random, -Math.PI / 2, Math.PI / 2);
        const lon = randomInRange(random, 0, 2 * Math.PI);
        const r = randomInRange(
            random,
            BIG_PLANET_RADIUS + 12,
            BIG_PLANET_RADIUS + 30,
        );
        const position = toRect({ lat, lon, r });
        const radius = randomInRange(random, 0.25, 2);
        const geometry = new THREE.SphereBufferGeometry(radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({ map: texture });
        const planet = new THREE.Mesh(geometry, material);
        planet.position.copy(position);
        scene.add(planet);
    }
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

function randomInRange(random: () => number, min: number, max: number): number {
    return min + (max - min) * random();
}

main();
