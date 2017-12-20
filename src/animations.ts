import * as THREE from "three";

export function travelGreatCircleTo(
    camera: THREE.Camera,
    target: THREE.Vector3,
): (t: number) => void {
    let initial: THREE.Vector3 | undefined;
    let initialR = 0;
    const targetR = target.length();
    return (t: number) => {
        if (initial == null) {
            initial = camera.position.clone();
            initialR = initial.length();
        } else {
            const straightLinePosition = initial.clone().lerp(target, t);
            const r = (1 - t) * initialR + t * targetR;
            const position = straightLinePosition.setLength(r);
            camera.position.copy(position);
            const straightLineDirection = target.clone().sub(initial);
            const normalizedToCenter = position
                .clone()
                .normalize()
                .negate();
            const tangentDirection = straightLineDirection
                .sub(
                    normalizedToCenter.multiplyScalar(
                        straightLineDirection.dot(normalizedToCenter),
                    ),
                )
                .normalize();
            const dummyObject = new THREE.Object3D();
            dummyObject.position.copy(camera.position);
            dummyObject.lookAt(target);
            // camera.quaternion.copy(dummyObject.quaternion);
            camera.lookAt(target.clone().lerp(new THREE.Vector3(), 0.5));
            //            camera.quaternion.copy(quaternionToLookAt(normalizedToCenter));
        }
    };
}

function quaternionToLookAt(v: THREE.Vector3): THREE.Quaternion {
    const rotateVector = new THREE.Vector3(0, 0, -1).cross(v).normalize();
    const rotateAmount = Math.acos(-v.z / v.length());
    return new THREE.Quaternion().setFromAxisAngle(rotateVector, rotateAmount);
}
