export interface Animation {
    startTime: number;
    endTime: number;
    effect(t: number): void;
}

export function runAnimations(
    animations: Animation[],
    render: () => void,
): Promise<void> {
    const maxEndTime = animations
        .map(a => a.endTime)
        .reduce((a, b) => Math.max(a, b));
    const runnerStartTime = Date.now();
    const finished = animations.map(() => false);
    return new Promise(resolve =>
        (function animate() {
            const elapsedTime = Date.now() - runnerStartTime;
            animations.forEach((animation, i) => {
                const { startTime, endTime } = animation;
                const t = (elapsedTime - startTime) / (endTime - startTime);
                if (0 <= t && t < 1) {
                    animation.effect(t);
                } else if (t >= 1 && !finished[i]) {
                    animation.effect(1);
                    finished[i] = true;
                }
            });
            render();
            if (elapsedTime < maxEndTime) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        })(),
    );
}
