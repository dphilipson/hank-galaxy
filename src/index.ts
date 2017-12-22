import { loadFlier } from "./flier";
import "./index.scss";

async function main(): Promise<void> {
    const flier = await loadFlier();
}

main();
