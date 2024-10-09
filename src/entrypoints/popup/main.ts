import "./popup.css";
import Popup from "./Popup.svelte";

const app = new Popup({
  target: document.getElementById("app")!
});

export default app;
