export interface Animation<S> {
    startTime: number;
    endTime: number;
    updateState: StateUpdater<S>;
}

export type StateUpdater<S> = (
    currentState: S,
    t: number,
    initialState: S,
) => S;

export function runAnimations<S>(
    animations: Array<Animation<S>>,
    initialState: S,
    copyState: (state: S) => S,
    render: (s: S) => void,
): Promise<void> {
    const maxEndTime = animations
        .map(a => a.endTime)
        .reduce((a, b) => Math.max(a, b));
    const runnerStartTime = Date.now();
    const finished = animations.map(() => false);
    const initialStates: Array<S | undefined> = animations.map(() => undefined);
    let state = initialState;
    return new Promise(resolve =>
        (function animate() {
            const elapsedTime = Date.now() - runnerStartTime;
            animations.forEach((animation, i) => {
                const { startTime, endTime } = animation;
                const t = (elapsedTime - startTime) / (endTime - startTime);
                if (0 <= t && t < 1) {
                    if (initialStates[i] == null) {
                        initialStates[i] = copyState(state);
                    }
                    state = animation.updateState(state, t, initialStates[i]!);
                } else if (t >= 1 && !finished[i]) {
                    state = animation.updateState(
                        state,
                        1,
                        initialStates[i] || state,
                    );
                    finished[i] = true;
                }
            });
            render(state);
            if (elapsedTime < maxEndTime) {
                requestAnimationFrame(animate);
            } else {
                resolve();
            }
        })(),
    );
}
