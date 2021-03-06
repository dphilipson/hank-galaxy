import seedrandom from "seedrandom";
import {
  AmbientLight,
  CubeTexture,
  CubeTextureLoader,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PerspectiveCamera,
  PointLight,
  Renderer,
  Scene,
  SphereBufferGeometry,
  Texture,
  TextureLoader,
  WebGLRenderer,
} from "three";
import { Animation, runAnimations } from "./animationEngine";
import * as Animations from "./animations";
import { FlatteningBall } from "./flatteningBall";
import { toRect } from "./latLon";
import { copyRenderState, RenderState } from "./renderState";
import bgBackUrl from "./static/bg_back.png";
import bgBotUrl from "./static/bg_bot.png";
import bgFrontUrl from "./static/bg_front.png";
import bgLeftUrl from "./static/bg_left.png";
import bgRightUrl from "./static/bg_right.png";
import bgTopUrl from "./static/bg_top.png";
import hankUrl from "./static/hank.png";
import lunaUrl from "./static/luna.png";
import debrisRareUrl from "./static/mars.jpg";
import debrisCommonUrl from "./static/moon.jpg";
import smallPlanetUrl from "./static/neptune.jpg";
import planetUrl from "./static/venus.jpg";

const FIELD_OF_VIEW = 60;
const BIG_PLANET_RADIUS = 48;
const HANK_LOCATION = toRect({
  lat: -Math.PI / 6,
  lon: Math.PI / 3,
  r: BIG_PLANET_RADIUS + 10,
});
const LUNA_LOCATION = toRect({
  lat: Math.PI / 3,
  lon: (-2 * Math.PI) / 3,
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

  const scene = new Scene();
  const camera = new PerspectiveCamera(
    FIELD_OF_VIEW,
    getAspectRatio(),
    0.1,
    1000,
  );
  const renderer = new WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  handleResizes(camera, renderer);
  scene.background = backgroundTexture;
  addBigPlanet(scene, planetTexture);
  addBigPlanetAtmosphere(scene);
  addSmallPlanet(scene, smallPlanetTexture);
  addDebris(scene, commonDebrisTexture, rareDebrisTexture);

  const ambientLight = new AmbientLight();
  scene.add(ambientLight);

  const pointLight = new PointLight(POINT_LIGHT_COLOR, POINT_LIGHT_INTENSITY);
  scene.add(pointLight);

  const hankBall = FlatteningBall.create({
    texture: hankTexture,
    radius: 1,
    center: HANK_LOCATION,
    fieldOfView: FIELD_OF_VIEW,
  });
  hankBall.setFlatness(1);
  scene.add(hankBall.mesh);

  const lunaBall = FlatteningBall.create({
    texture: lunaTexture,
    radius: 1,
    center: LUNA_LOCATION,
    fieldOfView: FIELD_OF_VIEW,
  });
  lunaBall.setFlatness(0);
  scene.add(lunaBall.mesh);

  let state: RenderState = {
    hankBallFlatness: 1,
    lunaBallFlatness: 0,
    cameraPosition: hankBall.getFlatCameraPosition(getAspectRatio()).clone(),
    cameraLookAt: HANK_LOCATION.clone(),
    lighting: 0,
  };

  const renderOnly = () => {
    renderer.render(scene, camera);
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
    renderOnly();
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
          Animations.travelGreatCircleTo(() =>
            destination === Destination.Luna
              ? lunaBall.getFlatCameraPosition(getAspectRatio())
              : hankBall.getFlatCameraPosition(getAspectRatio()),
          ),
        ),
      },
      {
        startTime: 500,
        endTime: 8500,
        updateState: Animations.moveLookAtTarget(
          destination === Destination.Luna ? LUNA_LOCATION : HANK_LOCATION,
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

  window.addEventListener("resize", () => {
    const aspectRatio = getAspectRatio();
    camera.aspect = aspectRatio;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    state = {
      ...state,
      cameraPosition: (state.hankBallFlatness === 1
        ? hankBall
        : lunaBall
      ).getFlatCameraPosition(aspectRatio),
    };
    render(state);
  });

  return {
    flyToHank: () => doFlight(Destination.Hank),
    flyToLuna: () => doFlight(Destination.Luna),
  };
}

function addBigPlanet(scene: Scene, texture: Texture): void {
  const geometry = new SphereBufferGeometry(BIG_PLANET_RADIUS, 32, 32);
  const material = new MeshBasicMaterial({
    map: texture,
  });
  const planet = new Mesh(geometry, material);
  scene.add(planet);
}

function addBigPlanetAtmosphere(scene: Scene): void {
  const geometry = new SphereBufferGeometry(
    BIG_PLANET_RADIUS + ATMOSPHERE_THICKNESS,
    32,
    32,
  );
  const material = new MeshBasicMaterial({
    color: ATMOSPHERE_COLOR,
    transparent: true,
    opacity: ATMOSPHERE_OPACITY,
  });
  const planet = new Mesh(geometry, material);
  scene.add(planet);
}

function addSmallPlanet(scene: Scene, texture: Texture): void {
  const geometry = new SphereBufferGeometry(SMALL_PLANET_RADIUS, 16, 16);
  const material = new MeshLambertMaterial({
    map: texture,
  });
  const planet = new Mesh(geometry, material);
  planet.position.copy(SMALL_PLANET_LOCATION);
  scene.add(planet);
}

function addDebris(
  scene: Scene,
  commonTexture: Texture,
  rareTexture: Texture,
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
    const geometry = new SphereBufferGeometry(radius, 16, 16);
    const material = new MeshLambertMaterial({ map: texture });
    const planet = new Mesh(geometry, material);
    planet.position.copy(position);
    scene.add(planet);
  }
}

function loadBackground(): Promise<CubeTexture> {
  return new Promise((resolve, reject) => {
    new CubeTextureLoader().load(
      [bgLeftUrl, bgRightUrl, bgTopUrl, bgBotUrl, bgBackUrl, bgFrontUrl],
      resolve,
      undefined,
      reject,
    );
  });
}

function loadTexture(imageUrl: string): Promise<Texture> {
  return new Promise((resolve, reject) => {
    new TextureLoader().load(imageUrl, resolve, undefined, reject);
  });
}

function handleResizes(camera: PerspectiveCamera, renderer: Renderer): void {
  window.addEventListener("resize", () => {
    camera.aspect = getAspectRatio();
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}

function addCanvas(renderer: Renderer): void {
  const canvas = renderer.domElement;
  canvas.style.position = "absolute";
  document.body.appendChild(canvas);
}

function getAspectRatio(): number {
  return window.innerWidth / window.innerHeight;
}

function randomInRange(random: () => number, min: number, max: number): number {
  return min + (max - min) * random();
}
