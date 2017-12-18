import THREE = require("three");
import imageUrl = require("../static/hank.png");
import "./index.scss";

const FIELD_OF_VIEW = 75;

function main(): void {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        FIELD_OF_VIEW,
        window.innerWidth / window.innerHeight,
        0.1,
        1000,
    );
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);

    handleResizes(camera, renderer);
    addCanvas(renderer);

    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const aspectRatio = window.innerWidth / window.innerHeight;
    const flatWidth = 2 * Math.max(1, aspectRatio);
    const flatHeight = 2 * Math.max(1, 1 / aspectRatio);
    const flatVertices = getFlatVertices(
        geometry.vertices,
        flatWidth,
        flatHeight,
    );
    geometry.morphTargets.push({ name: "flat", vertices: flatVertices });

    const texture = new THREE.TextureLoader().load(imageUrl);
    const material = new THREE.MeshBasicMaterial({
        map: texture,
        morphTargets: true,
    });
    const ball = new THREE.Mesh(geometry, material);
    const flatDistance =
        flatHeight / (2 * Math.tan(FIELD_OF_VIEW * Math.PI / 360));
    // The -1 is because the flat version of the ball is distance 1 away from
    // the ball's center.
    ball.translateZ(-flatDistance - 1.0);
    scene.add(ball);

    function animate() {
        requestAnimationFrame(animate);
        ball.morphTargetInfluences![0] = 1;
        //         ball.rotation.y += Math.PI / 400;
        // ball.morphTargetInfluences![0] =
        //     (Math.sin(Date.now() / (100 * 2 * Math.PI)) + 1) / 2;

        ball.rotation.y = 3 / 2 * Math.PI;
        renderer.render(scene, camera);
    }
    animate();
}

function getFlatVertices(
    sphereVertices: THREE.Vector3[],
    width: number,
    height: number,
): THREE.Vector3[] {
    const flatVertices = sphereVertices.map(v =>
        toFlatVertex(v, width, height),
    );
    // Because we need to finesse some of the points near where spherical
    // coordinates are discontinuous, the vertices we get here don't precisely
    // have the requested dimensions. Hence, scale them after the fact.
    const minY = flatVertices.map(v => v.y).reduce(min);
    const maxY = flatVertices.map(v => v.y).reduce(max);
    const yScale = height / (maxY - minY);
    const minZ = flatVertices.map(v => v.z).reduce(min);
    const maxZ = flatVertices.map(v => v.z).reduce(max);
    const zScale = width / (maxZ - minZ);
    return flatVertices.map(
        ({ x, y, z }) => new THREE.Vector3(x, yScale * y, zScale * z),
    );
}

function toFlatVertex(
    v: THREE.Vector3,
    width: number,
    height: number,
): THREE.Vector3 {
    const { x, y, z } = v;

    const r = v.length();
    const lat = Math.asin(y / r);
    const lon = Math.atan2(-z, x);
    if (x === 0 && z === 0) {
        // Special case for the poles. "Hide" them behind the plane and towards
        // the center.
        return new THREE.Vector3(
            r - 1 / 256,
            Math.sign(y) * height / 2 * 7 / 8,
            0,
        );
    }
    if (lon + Math.PI < 1 / 16 || Math.PI - lon < 1 / 16) {
        // Likewise, "hide" points close to where longitude "jumps."
        return new THREE.Vector3(
            r - 1 / 256,
            Math.sign(y) * height / 2 * 7 / 8,
            0,
        );
    }
    return new THREE.Vector3(
        r,
        height * lat / Math.PI,
        width * -lon / (2 * Math.PI),
    );
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

function min(a: number, b: number): number {
    return Math.min(a, b);
}

function max(a: number, b: number): number {
    return Math.max(a, b);
}

main();
