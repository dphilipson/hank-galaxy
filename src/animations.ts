import * as THREE from "three";
import { StateUpdater } from "./animationEngine";
import { RenderState } from "./interfaces";

export function travelGreatCircleTo(
    target: THREE.Vector3,
): StateUpdater<RenderState> {
    const targetR = target.length();
    return (state, t, initialState) => {
        const initial = initialState.cameraPosition;
        const initialR = initial.length();
        const straightLinePosition = initial.clone().lerp(target, t);
        const r = (1 - t) * initialR + t * targetR + 4 * 10 * t * (1 - t);
        const position = straightLinePosition.setLength(r);
        state.cameraPosition.copy(position);
        return state;
    };
}

export function travelTo(target: THREE.Vector3): StateUpdater<RenderState> {
    return (state, t, initialState) => {
        state.cameraPosition.lerpVectors(
            initialState.cameraPosition,
            target,
            t,
        );
        return state;
    };
}

export function moveLookAtTarget(
    target: THREE.Vector3,
): StateUpdater<RenderState> {
    return (state, t, initialState) => {
        const initialLookAt = initialState.cameraLookAt;
        const initialFromCamera = initialLookAt
            .clone()
            .sub(state.cameraPosition);
        const targetFromCamera = target.clone().sub(state.cameraPosition);
        const lerpedFromCamera = initialFromCamera
            .setLength(targetFromCamera.length())
            .lerp(targetFromCamera, t);
        state.cameraLookAt = lerpedFromCamera.add(state.cameraPosition);
        return state;
    };
}

export function setStartBallFlatness(
    target: number,
): StateUpdater<RenderState> {
    return (state, t, initialState) => {
        const flatness = (1 - t) * initialState.startBallFlatness + t * target;
        state.startBallFlatness = flatness;
        return state;
    };
}

export function setEndBallFlatness(target: number): StateUpdater<RenderState> {
    return (state, t, initialState) => {
        const flatness = (1 - t) * initialState.endBallFlatness + t * target;
        state.endBallFlatness = flatness;
        return state;
    };
}

export function eased<S>(updater: StateUpdater<S>): StateUpdater<S> {
    return (state, t, initialState) => updater(state, ease(t), initialState);
}

/** Standard cubic easing function */
function ease(t: number): number {
    return t * t * (3 - 2 * t);
}
