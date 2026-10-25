import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const PORT = 9225;
const profileDir = path.join(os.tmpdir(), "chrome-daemon-" + Date.now());
fs.mkdirSync(profileDir, { recursive: true });

console.log("[CHROME DAEMON] Spawning headless Chrome on port", PORT);

const proc = spawn("C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe", [
  "--headless=new",
  `--remote-debugging-port=${PORT}`,
  "--remote-debugging-address=127.0.0.1",
  "--remote-allow-origins=*",
  `--user-data-dir=${profileDir}`,
  "--window-size=1920,1080",
  "--disable-gpu",
  "--no-sandbox",
  "http://localhost:3000"
], { stdio: "inherit" });

proc.on("exit", (code) => {
  console.log(`[CHROME DAEMON] Chrome exited with code ${code}`);
  process.exit(code || 0);
});

// Wait for Chrome to be ready and write DevToolsActivePort to default profile
async function syncDevToolsPort() {
  const defaultDir = "C:\\Users\\Dell\\AppData\\Local\\Google\\Chrome\\User Data";
  const targetFile = path.join(defaultDir, "DevToolsActivePort");
  
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) {
        const data = await res.json();
        const wsUrl = data.webSocketDebuggerUrl; // ws://127.0.0.1:9225/devtools/browser/<guid>
        const u = new URL(wsUrl);
        const wsPath = u.pathname;
        const fileContent = `${PORT}\n${wsPath}\n`;
        fs.writeFileSync(targetFile, fileContent, "utf8");
        console.log(`[CHROME DAEMON] Synced DevToolsActivePort to ${targetFile}:`);
        console.log(fileContent);
        return;
      }
    } catch (e) {
      // wait
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.error("[CHROME DAEMON] Failed to reach Chrome /json/version after 15s");
}

syncDevToolsPort();

process.on("SIGINT", () => {
  proc.kill();
  process.exit(0);
});
process.on("SIGTERM", () => {
  proc.kill();
  process.exit(0);
});
