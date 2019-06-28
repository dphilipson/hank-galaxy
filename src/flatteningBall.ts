import * as THREE from "three";

export interface FlatteningBallCreateParams {
  texture: THREE.Texture;
  radius: number;
  center: THREE.Vector3;
  fieldOfView: number;
}

// The width and height of the flattened form, for a ball of radius 1.
const FLAT_WIDTH = 4;
const FLAT_HEIGHT = 2;

export class FlatteningBall {
  public static create({
    texture,
    radius,
    center,
    fieldOfView,
  }: FlatteningBallCreateParams): FlatteningBall {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const flatVertices = getFlatVertices(geometry.vertices);
    geometry.morphTargets.push({ name: "flat", vertices: flatVertices });
    const material = new THREE.MeshLambertMaterial({
      map: texture,
      morphTargets: true,
      morphNormals: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(center);
    mesh.rotation.y = (3 * Math.PI) / 2;
    const flatDistance =
      FLAT_HEIGHT / (2 * Math.tan((fieldOfView * Math.PI) / 360));
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
    this.mesh.morphTargetInfluences = [clampedFlatness];
  }
}

function getFlatVertices(sphereVertices: THREE.Vector3[]): THREE.Vector3[] {
  const flatVertices = sphereVertices.map(v => toFlatVertex(v));
  // Because we need to finesse some of the points near where spherical
  // coordinates are discontinuous, the vertices we get here don't precisely
  // have the requested dimensions. Hence, scale them after the fact.
  const minY = flatVertices.map(v => v.y).reduce(min);
  const maxY = flatVertices.map(v => v.y).reduce(max);
  const yScale = FLAT_HEIGHT / (maxY - minY);
  const minZ = flatVertices.map(v => v.z).reduce(min);
  const maxZ = flatVertices.map(v => v.z).reduce(max);
  const zScale = FLAT_WIDTH / (maxZ - minZ);
  return flatVertices.map(
    ({ x, y, z }) => new THREE.Vector3(x, yScale * y, zScale * z),
  );
}

function toFlatVertex(v: THREE.Vector3): THREE.Vector3 {
  const { x, y, z } = v;
  const r = v.length();
  const lat = Math.asin(y / r);
  const lon = Math.atan2(-z, x);
  if (x === 0 && z === 0) {
    // Special case for the poles. "Hide" them behind the plane and towards
    // the center.
    return new THREE.Vector3(
      r - 1 / 256,
      (((Math.sign(y) * FLAT_HEIGHT) / 2) * 7) / 8,
      0,
    );
  }
  if (lon + Math.PI < 1 / 16 || Math.PI - lon < 1 / 16) {
    // Likewise, "hide" points close to where longitude "jumps."
    return new THREE.Vector3(
      r - 1 / 256,
      (((Math.sign(y) * FLAT_HEIGHT) / 2) * 7) / 8,
      0,
    );
  }
  return new THREE.Vector3(
    r,
    (FLAT_HEIGHT * lat) / Math.PI,
    (FLAT_WIDTH * -lon) / (2 * Math.PI),
  );
}

function min(a: number, b: number): number {
  return Math.min(a, b);
}

function max(a: number, b: number): number {
  return Math.max(a, b);
}
