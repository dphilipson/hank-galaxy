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
import { toRect } from "./latLon";
import { copyRenderState, RenderState } from "./renderState";

const FIELD_OF_VIEW = 60;
const BIG_PLANET_RADIUS = 48;
const HANK_LOCATION = toRect({
    lat: -Math.PI / 6,
    lon: Math.PI / 3,
    r: BIG_PLANET_RADIUS + 10,
});
const LUNA_LOCATION = toRect({
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

export interface Flier {
    flyToHank(): Promise<void>;
    flyToLuna(): Promise<void>;
}

enum Destination {
    Hank = "HANK",
    Luna = "LUNA",
}

export async function loadFlier(): Promise<Flier> {
    const [
        backgroundTexture,
        hankTexture,
        lunaTexture,
        commonDebrisTexture,
        rareDebrisTexture,
        smallPlanetTexture,
        planetTexture,
    ] = await Promise.all([
        loadBackground(),
        loadTexture(hankUrl),
        loadTexture(lunaUrl),
        loadTexture(debrisCommonUrl),
        loadTexture(debrisRareUrl),
        loadTexture(smallPlanetUrl),
        loadTexture(planetUrl),
    ]);

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
    scene.background = backgroundTexture;
    addBigPlanet(scene, planetTexture);
    addBigPlanetAtmosphere(scene);
    addSmallPlanet(scene, smallPlanetTexture);
    addDebris(scene, commonDebrisTexture, rareDebrisTexture);

    const ambientLight = new THREE.AmbientLight();
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(
        POINT_LIGHT_COLOR,
        POINT_LIGHT_INTENSITY,
    );
    scene.add(pointLight);

    const hankBall = FlatteningBall.create({
        texture: hankTexture,
        radius: 1,
        center: HANK_LOCATION,
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    hankBall.setFlatness(1);
    scene.add(hankBall.mesh);

    const lunaBall = FlatteningBall.create({
        texture: lunaTexture,
        radius: 1,
        center: LUNA_LOCATION,
        aspectRatio,
        fieldOfView: FIELD_OF_VIEW,
    });
    lunaBall.setFlatness(0);
    scene.add(lunaBall.mesh);

    let state: RenderState = {
        hankBallFlatness: 1,
        lunaBallFlatness: 0,
        cameraPosition: hankBall.flatCameraPosition.clone(),
        cameraLookAt: HANK_LOCATION.clone(),
        lighting: 0,
    };

    const render = ({
        hankBallFlatness,
        lunaBallFlatness,
        cameraPosition,
        cameraLookAt,
        lighting,
    }: RenderState) => {
        hankBall.setFlatness(hankBallFlatness);
        lunaBall.setFlatness(lunaBallFlatness);
        camera.position.copy(cameraPosition);
        camera.lookAt(cameraLookAt);
        ambientLight.intensity =
            (1 - lighting) * 1 + lighting * AMBIENT_LIGHTING_INTENSITY;
        pointLight.intensity = lighting * POINT_LIGHT_INTENSITY;
        renderer.render(scene, camera);
    };

    const doFlight = async (destination: Destination) => {
        const animations: Array<Animation<RenderState>> = [
            {
                startTime: 0,
                endTime: 1000,
                updateState:
                    destination === Destination.Luna
                        ? Animations.setHankBallFlatness(0)
                        : Animations.setLunaBallFlatness(0),
            },
            {
                startTime: 0,
                endTime: 1000,
                updateState: Animations.setLighting(1),
            },
            {
                startTime: 500,
                endTime: 8500,
                updateState: Animations.eased(
                    Animations.travelGreatCircleTo(
                        destination === Destination.Luna
                            ? lunaBall.flatCameraPosition
                            : hankBall.flatCameraPosition,
                    ),
                ),
            },
            {
                startTime: 500,
                endTime: 8500,
                updateState: Animations.moveLookAtTarget(
                    destination === Destination.Luna
                        ? LUNA_LOCATION
                        : HANK_LOCATION,
                ),
            },
            {
                startTime: 7500,
                endTime: 8500,
                updateState: Animations.setLighting(0),
            },
            {
                startTime: 7500,
                endTime: 8500,
                updateState:
                    destination === Destination.Luna
                        ? Animations.setLunaBallFlatness(1)
                        : Animations.setHankBallFlatness(1),
            },
        ];
        state = await runAnimations(animations, state, copyRenderState, render);
    };

    addCanvas(renderer);
    render(state);

    return {
        flyToHank: () => doFlight(Destination.Hank),
        flyToLuna: () => doFlight(Destination.Luna),
    };
}

function addBigPlanet(scene: THREE.Scene, texture: THREE.Texture): void {
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

function addSmallPlanet(scene: THREE.Scene, texture: THREE.Texture): void {
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

function addDebris(
    scene: THREE.Scene,
    commonTexture: THREE.Texture,
    rareTexture: THREE.Texture,
): void {
    const random = seedrandom("seed");
    for (let i = 0; i < DEBRIS_COUNT; i++) {
        const texture = random() < 0.1 ? rareTexture : commonTexture;
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

function loadBackground(): Promise<THREE.CubeTexture> {
    return new Promise((resolve, reject) => {
        new THREE.CubeTextureLoader().load(
            [bgLeftUrl, bgRightUrl, bgTopUrl, bgBotUrl, bgBackUrl, bgFrontUrl],
            resolve,
            undefined,
            reject,
        );
    });
}

function loadTexture(imageUrl: string): Promise<THREE.Texture> {
    return new Promise((resolve, reject) => {
        new THREE.TextureLoader().load(imageUrl, resolve, undefined, reject);
    });
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
