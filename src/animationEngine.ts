export interface Animation {
    startTime: number;
    duration: number;
    effect(t: number): void;
}

export function runAnimations(
    animations: Animation[],
    render: () => void,
): void {
    const duration = animations
        .map(a => a.startTime + a.duration)
        .reduce((a, b) => Math.max(a, b));
    const startTime = Date.now();
    const finished = animations.map(() => false);
    (function animate() {
        const elapsedTime = Date.now() - startTime;
        animations.forEach((animation, i) => {
            const t = (elapsedTime - animation.startTime) / animation.duration;
            if (0 <= t && t < 1) {
                animation.effect(t);
            } else if (t >= 1 && !finished[i]) {
                animation.effect(1);
                finished[i] = true;
            }
        });
        render();
        if (elapsedTime < duration) {
            requestAnimationFrame(animate);
        }
    })();
}
