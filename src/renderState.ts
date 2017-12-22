import * as THREE from "three";

export interface RenderState {
    startBallFlatness: number;
    endBallFlatness: number;
    cameraPosition: THREE.Vector3;
    cameraLookAt: THREE.Vector3;
    lighting: number;
}

export function copyRenderState(state: RenderState): RenderState {
    const { cameraPosition, cameraLookAt } = state;
    return {
        ...state,
        cameraPosition: cameraPosition.clone(),
        cameraLookAt: cameraLookAt.clone(),
    };
}
