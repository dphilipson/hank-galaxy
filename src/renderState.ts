import { Vector3 } from "three";

export interface RenderState {
  hankBallFlatness: number;
  lunaBallFlatness: number;
  cameraPosition: Vector3;
  cameraLookAt: Vector3;
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
