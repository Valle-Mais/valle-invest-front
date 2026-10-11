// Captura de telas via Chrome DevTools Protocol (sem puppeteer). Node 22+ (WebSocket global).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP = 'http://127.0.0.1:4200';
const OUT = new URL('./shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64');
const token = (sub, role) => `${b64({ alg: 'HS256' })}.${b64({ sub, role, exp: Math.floor(Date.now() / 1000) + 86400 })}.sig`;
const ADMIN = token('admin1', 'admin');
const CLIENT = token('c1', 'client');

const shots = [
  { name: 'login-desktop', url: '/login', w: 1440, h: 900 },
  { name: 'login-mobile', url: '/login', w: 390, h: 844, mobile: true },
  { name: 'esqueci-senha', url: '/esqueci-senha', w: 1440, h: 900 },
  { name: 'definir-senha', url: '/definir-senha?token=mock', w: 1440, h: 900 },
  { name: 'client-alterar-senha', url: '/sistema/alterar-senha', w: 1440, h: 900, tok: CLIENT },
  { name: 'admin-dashboard', url: '/admin/dashboard', w: 1440, h: 900, tok: ADMIN },
  { name: 'admin-dashboard-dark', url: '/admin/dashboard', w: 1440, h: 900, tok: ADMIN, dark: true },
  { name: 'admin-client-detail', url: '/admin/clients/c1', w: 1440, h: 1400, tok: ADMIN },
  { name: 'admin-clients', url: '/admin/clients', w: 1440, h: 900, tok: ADMIN },
  { name: 'admin-fund-operations', url: '/admin/fund-operations', w: 1440, h: 900, tok: ADMIN },
  { name: 'admin-client-transactions', url: '/admin/client-transactions', w: 1440, h: 900, tok: ADMIN },
  { name: 'admin-dashboard-mobile', url: '/admin/dashboard', w: 390, h: 844, mobile: true, tok: ADMIN },
  { name: 'client-dashboard', url: '/sistema/dashboard', w: 1440, h: 900, tok: CLIENT },
  { name: 'client-dashboard-dark', url: '/sistema/dashboard', w: 1440, h: 900, tok: CLIENT, dark: true },
  { name: 'client-dashboard-mobile', url: '/sistema/dashboard', w: 390, h: 844, mobile: true, tok: CLIENT },
  { name: 'client-statement', url: '/sistema/statement', w: 1440, h: 900, tok: CLIENT },
  { name: 'client-statement-mobile', url: '/sistema/statement', w: 390, h: 844, mobile: true, tok: CLIENT },
  { name: 'client-solicitacoes', url: '/sistema/solicitacoes', w: 1440, h: 900, tok: CLIENT },
  { name: 'client-perfil', url: '/sistema/perfil', w: 1440, h: 900, tok: CLIENT },
];

const port = 9333;
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, '--headless=new', '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', `--user-data-dir=${OUT}profile`, '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function waitForChrome() {
  for (let i = 0; i < 50; i++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/json/version`); if (r.ok) return; } catch {}
    await sleep(200);
  }
  throw new Error('chrome não subiu');
}

class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); this.events = []; ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && this.pending.has(d.id)) { const { res, rej } = this.pending.get(d.id); this.pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); } else if (d.method) this.events.push(d); }; }
  send(method, params = {}) { const id = ++this.id; this.ws.send(JSON.stringify({ id, method, params })); return new Promise((res, rej) => this.pending.set(id, { res, rej })); }
}

async function main() {
  await waitForChrome();
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  const c = new CDP(ws);
  await c.send('Page.enable'); await c.send('Runtime.enable');

  // origem precisa existir antes de mexer no localStorage
  await c.send('Page.navigate', { url: `${APP}/login` }); await sleep(2500);

  for (const s of shots) {
    await c.send('Emulation.setDeviceMetricsOverride', { width: s.w, height: s.h, deviceScaleFactor: 1, mobile: !!s.mobile });
    await c.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: s.dark ? 'dark' : 'light' }] });
    const theme = s.dark ? 'dark' : 'light';
    const js = s.tok ? `localStorage.setItem('access_token', '${s.tok}'); localStorage.setItem('theme', '${theme}');` : `localStorage.removeItem('access_token'); localStorage.setItem('theme', '${theme}');`;
    await c.send('Runtime.evaluate', { expression: js });
    await c.send('Page.navigate', { url: `${APP}${s.url}` });
    await sleep(3500);
    const { result } = await c.send('Runtime.evaluate', { expression: 'Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)', returnByValue: true });
    const fullH = Math.min(Math.max(result.value, s.h), 4000);
    await c.send('Emulation.setDeviceMetricsOverride', { width: s.w, height: fullH, deviceScaleFactor: 1, mobile: !!s.mobile });
    await sleep(600);
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(`${OUT}${s.name}.png`, Buffer.from(data, 'base64'));
    const { result: loc } = await c.send('Runtime.evaluate', { expression: 'location.pathname', returnByValue: true });
    console.log(`${s.name}: ${s.w}x${fullH} -> ${loc.value}`);
  }
  ws.close(); chrome.kill();
}
main().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
