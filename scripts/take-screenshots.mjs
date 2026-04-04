import { writeFileSync, mkdirSync } from "fs";

const CDP_HOST = "http://localhost:9226";
const EXT_ID = "ppocahclaifdmabkmkehmennokbkhcpo";
const POPUP_URL = `chrome-extension://${EXT_ID}/popup.html`;
const OUT_DIR = "C:/repositories/avi/youtube-auto-hd/screenshots";

async function getPages() {
  const response = await fetch(`${CDP_HOST}/json/list`);
  return response.json();
}

async function cdpEval(wsUrl, expression) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression, returnByValue: true, awaitPromise: true } }))
    );
    ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) { ws.close(); resolve(message.result?.result?.value); }
    });
  });
}

async function cdpScreenshot(wsUrl, clipY) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      ws.send(JSON.stringify({ id: 1, method: "Page.captureScreenshot", params: {
        format: "png",
        clip: { x: 0, y: clipY, width: 1280, height: 800, scale: 1 }
      }}))
    );
    ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) { ws.close(); resolve(message.result?.data); }
    });
  });
}

async function cdpSetViewport(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.addEventListener("error", reject);
    ws.addEventListener("open", () =>
      ws.send(JSON.stringify({ id: 1, method: "Emulation.setDeviceMetricsOverride", params: {
        width: 1280, height: 800, deviceScaleFactor: 1, mobile: false
      }}))
    );
    ws.addEventListener("message", ({ data }) => {
      const message = JSON.parse(data);
      if (message.id === 1) { ws.close(); resolve(); }
    });
  });
}

async function waitForPopup(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const pages = await getPages();
    const popup = pages.find(page => page.url === POPUP_URL && page.type === "page");
    if (popup) return popup;
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("Popup page not found");
}

mkdirSync(OUT_DIR, { recursive: true });
const locale = process.argv[2] || "pl";

// Navigate to popup
const pages = await getPages();
const youtubePage = pages.find(page => page.url.includes("youtube.com"));
console.log("Navigating to popup...");
await new Promise((resolve, reject) => {
  const ws = new WebSocket(youtubePage.webSocketDebuggerUrl);
  ws.addEventListener("error", reject);
  ws.addEventListener("open", () =>
    ws.send(JSON.stringify({ id: 1, method: "Page.navigate", params: { url: POPUP_URL } }))
  );
  ws.addEventListener("message", ({ data }) => {
    if (JSON.parse(data).id === 1) { ws.close(); resolve(); }
  });
});

// Wait for page to fully load and Svelte to mount
await new Promise(resolve => setTimeout(resolve, 5000));
const popup = await waitForPopup();
const wsUrl = popup.webSocketDebuggerUrl;
console.log("Popup ready");

await cdpSetViewport(wsUrl);

// Enable all switches then turn off the first, center UI, return scroll height
const scrollHeight = await cdpEval(wsUrl, `(async () => {
  const toggles = [...document.querySelectorAll("input[type=checkbox]")];
  toggles.filter(t => !t.checked).forEach(t => t.click());
  if (toggles[1]?.checked) toggles[1].click();
  document.documentElement.style.cssText = "display:flex;justify-content:center;background:#f9f9f9;";
  document.body.style.cssText = "margin:0;";
  await new Promise(r => setTimeout(r, 500));
  return document.body.scrollHeight;
})()`);

console.log("scrollHeight:", scrollHeight, "toggles setup done");

// Screenshot 1 — from y=0
const shot1Data = await cdpScreenshot(wsUrl, 0);
writeFileSync(`${OUT_DIR}/${locale}-1.png`, Buffer.from(shot1Data, "base64"));
console.log(`Saved ${locale}-1.png`);

// Screenshot 2 — from the last 800px of the page (or y=800 if page is tall enough)
const clipY2 = scrollHeight > 800 ? scrollHeight - 800 : 0;
const shot2Data = await cdpScreenshot(wsUrl, clipY2);
writeFileSync(`${OUT_DIR}/${locale}-2.png`, Buffer.from(shot2Data, "base64"));
console.log(`Saved ${locale}-2.png`);

console.log("Done");
