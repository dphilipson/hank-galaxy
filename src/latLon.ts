import * as THREE from "three";

export interface LatLon {
    lat: number;
    lon: number;
    r: number;
}

export function toRect({ lat, lon, r }: LatLon): THREE.Vector3 {
    const littleR = r * Math.cos(lat);
    const z = littleR * Math.cos(lon);
    const x = littleR * Math.sin(lon);
    const y = r * Math.sin(lat);
    return new THREE.Vector3(x, y, z);
}
