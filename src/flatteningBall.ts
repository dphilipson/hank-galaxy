import * as THREE from "three";

export interface FlatteningBallCreateParams {
    texture: THREE.Texture;
    radius: number;
    center: THREE.Vector3;
    aspectRatio: number;
    fieldOfView: number;
}

export class FlatteningBall {
    public static create({
        texture,
        radius,
        center,
        aspectRatio,
        fieldOfView,
    }: FlatteningBallCreateParams): FlatteningBall {
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const flatWidth = 2 * Math.max(1, aspectRatio);
        const flatHeight = 2 * Math.max(1, 1 / aspectRatio);
        const flatVertices = getFlatVertices(
            geometry.vertices,
            flatWidth,
            flatHeight,
        );
        geometry.morphTargets.push({ name: "flat", vertices: flatVertices });
        const material = new THREE.MeshBasicMaterial({
            map: texture,
            morphTargets: true,
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.x = center.x;
        mesh.position.y = center.y;
        mesh.position.z = center.z;
        mesh.rotation.y = 3 * Math.PI / 2;
        const flatDistance =
            flatHeight / (2 * Math.tan(fieldOfView * Math.PI / 360));
        // The -radius is because the flat version of the ball is distance r
        // from the ball's center.
        const flatCameraPosition = center
            .clone()
            .sub(new THREE.Vector3(0, 0, -flatDistance - radius));
        return new FlatteningBall(mesh, flatCameraPosition);
    }

    private constructor(
        public readonly mesh: THREE.Mesh,
        public readonly flatCameraPosition: THREE.Vector3,
    ) {}

    public setFlatness(flatness: number): void {
        const clampedFlatness = Math.min(1, Math.max(0, flatness));
        this.mesh.morphTargetInfluences![0] = clampedFlatness;
    }
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

function min(a: number, b: number): number {
    return Math.min(a, b);
}

function max(a: number, b: number): number {
    return Math.max(a, b);
}
