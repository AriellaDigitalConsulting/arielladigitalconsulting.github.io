// Minimal headless-Chrome driver over the DevTools protocol (Node 22+, no dependencies).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Opens `url` in a fresh headless Chrome; returns { evaluate(expr), close() }. */
export async function openPage(url, { mobile = false, width = mobile ? 320 : 1440, settle = 6000 } = {}) {
  const height = mobile ? 640 : 900;
  // port 0 + a private profile dir: Chrome picks a free port and reports it in DevToolsActivePort,
  // so concurrent instances can never attach to each other's pages
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'adc-cdp-'));
  // Wix lays out against the real window size, so the window must match the emulated viewport
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--remote-debugging-port=0', `--user-data-dir=${profile}`, `--window-size=${width},${height}`, 'about:blank'], { stdio: 'ignore' });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) {
    await sleep(250);
    try {
      const port = fs.readFileSync(path.join(profile, 'DevToolsActivePort'), 'utf8').split('\n')[0];
      const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
    } catch {}
  }
  if (!ws) { chrome.kill(); throw new Error('Chrome did not start'); }
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const evaluate = async (expr) => {
    const m = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (m.result?.exceptionDetails) throw new Error(JSON.stringify(m.result.exceptionDetails).slice(0, 500));
    return m.result?.result?.value;
  };
  if (mobile) {
    await send('Network.enable');
    await send('Network.setUserAgentOverride', { userAgent: IPHONE_UA });
  }
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Page.enable');
  await send('Page.navigate', { url });
  await sleep(settle);
  for (let i = 0; i < 60; i++) {
    if (await evaluate(`document.readyState === 'complete' && !!document.body`)) break;
    await sleep(500);
  }
  // scroll through the page so lazy content and entrance animations resolve
  await evaluate(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){scrollTo(0,y);await new Promise(r=>setTimeout(r,300));}await new Promise(r=>setTimeout(r,1500));scrollTo(0,0);await new Promise(r=>setTimeout(r,800));})()`);
  return {
    evaluate,
    send,
    close: () => { ws.close(); chrome.kill(); setTimeout(() => fs.rmSync(profile, { recursive: true, force: true }), 1000); },
  };
}
