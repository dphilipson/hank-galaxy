import * as THREE from "three";

export interface RenderState {
    startBallPosition: THREE.Vector3;
    startBallFlatPosition: THREE.Vector3;
    startBallFlatness: number;
    endBallPosition: THREE.Vector3;
    endBallFlatPosition: THREE.Vector3;
    endBallFlatness: number;
    cameraPosition: THREE.Vector3;
    cameraLookAt: THREE.Vector3;
}

export function copyRenderState(state: RenderState): RenderState {
    const { cameraPosition, cameraLookAt } = state;
    return {
        ...state,
        cameraPosition: cameraPosition.clone(),
        cameraLookAt: cameraLookAt.clone(),
    };
}
