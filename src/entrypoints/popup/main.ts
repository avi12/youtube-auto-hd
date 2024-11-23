import "./popup.css";
import { mount } from "svelte";
import Popup from "./Popup.svelte";

export default mount(Popup, {
  target: document.getElementById("app")!
});
