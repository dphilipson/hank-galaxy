import * as THREE from "three";
import { StateUpdater } from "./animationEngine";
import { RenderState } from "./interfaces";

export function travelGreatCircleTo(
    target: THREE.Vector3,
): StateUpdater<RenderState> {
    const targetR = target.length();
    return (currentState, t, initialState) => {
        const initial = initialState.cameraPosition;
        const initialR = initial.length();
        const straightLinePosition = initial.clone().lerp(target, t);
        const r = (1 - t) * initialR + t * targetR;
        const position = straightLinePosition.setLength(r);
        currentState.cameraPosition.copy(position);
        return currentState;
    };
}
