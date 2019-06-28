import { loadFlier } from "./flier";
import "./index.scss";
import * as serviceWorker from "./serviceWorker";

async function main(): Promise<void> {
  const flier = await loadFlier();
  function handleRestingPosition(isAtHank: boolean): void {
    const button = createVisitButton(
      `Visit ${isAtHank ? "Luna" : "Hank"}`,
      async () => {
        removeVisitButton(button);
        await (isAtHank ? flier.flyToLuna() : flier.flyToHank());
        handleRestingPosition(!isAtHank);
      },
    );
  }
  handleRestingPosition(true);
}

function createVisitButton(text: string, onClick: () => void): HTMLElement {
  const button = document.createElement("div");
  button.classList.add("visit-button");
  setTimeout(() => button.classList.add("visit-button-loaded"), 1);
  button.innerText = text;
  button.onclick = onClick;
  document.body.appendChild(button);
  return button;
}

function removeVisitButton(button: HTMLElement): void {
  button.onclick = () => undefined;
  button.classList.remove("visit-button-loaded");
  setTimeout(() => {
    const parent = button.parentElement;
    if (parent) {
      parent.removeChild(button);
    }
  }, 500);
}

main();

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
