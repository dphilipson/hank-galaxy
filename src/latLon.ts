import { Vector3 } from "three";

export interface LatLon {
  lat: number;
  lon: number;
  r: number;
}

export function toRect({ lat, lon, r }: LatLon): Vector3 {
  const littleR = r * Math.cos(lat);
  const z = littleR * Math.cos(lon);
  const x = littleR * Math.sin(lon);
  const y = r * Math.sin(lat);
  return new Vector3(x, y, z);
}
