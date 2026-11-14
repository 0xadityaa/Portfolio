// Minimal MCP stdio client: initialize, then page through tools/list, save the raw result.
// No dependencies. Usage: node list-tools.mjs servers.json raw
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [serversFile, outDir] = process.argv.slice(2);
const servers = JSON.parse(readFileSync(serversFile, 'utf8'));
const TIMEOUT_MS = 180_000;

function run(s) {
  return new Promise((resolve) => {
    const child = spawn(s.cmd, s.args, {
      env: { ...process.env, ...(s.env || {}) },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let buf = '';
    let stderr = '';
    let nextId = 1;
    let done = false;
    const tools = [];
    const pending = new Map();
    const finish = (res) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill('SIGKILL');
      resolve({ ...res, stderr: stderr.slice(-400) });
    };
    const timer = setTimeout(() => finish({ ok: false, error: 'timeout' }), TIMEOUT_MS);
    const send = (method, params) =>
      new Promise((res) => {
        const id = nextId++;
        pending.set(id, res);
        child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      });
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (e) => finish({ ok: false, error: String(e) }));
    child.on('exit', (c) => finish({ ok: false, error: `exited early (${c})` }));
    child.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line) continue;
        let m;
        try { m = JSON.parse(line); } catch { continue; }
        if (m.id != null && pending.has(m.id)) {
          pending.get(m.id)(m);
          pending.delete(m.id);
        }
      }
    });
    (async () => {
      const init = await send('initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'tool-tax-counter', version: '1.0.0' },
      });
      if (init.error) return finish({ ok: false, error: JSON.stringify(init.error) });
      child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');
      let cursor;
      do {
        const r = await send('tools/list', cursor ? { cursor } : {});
        if (r.error) return finish({ ok: false, error: JSON.stringify(r.error) });
        tools.push(...r.result.tools);
        cursor = r.result.nextCursor;
      } while (cursor);
      finish({ ok: true, serverInfo: init.result.serverInfo, protocol: init.result.protocolVersion, tools });
    })();
  });
}

const summary = [];
for (const s of servers) {
  const t0 = Date.now();
  const r = await run(s);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  if (r.ok) {
    writeFileSync(
      `${outDir}/${s.id}.tools.json`,
      JSON.stringify(
        { server: s.id, command: [s.cmd, ...s.args], serverInfo: r.serverInfo, protocolVersion: r.protocol, tools: r.tools },
        null,
        2,
      ),
    );
    console.log(`ok    ${s.id.padEnd(20)} ${String(r.tools.length).padStart(3)} tools  ${secs}s`);
  } else {
    console.log(`FAIL  ${s.id.padEnd(20)} ${r.error}  ${secs}s  stderr: ${r.stderr.replace(/\s+/g, ' ').slice(0, 200)}`);
  }
  summary.push({ id: s.id, ok: r.ok, tools: r.ok ? r.tools.length : 0, error: r.error });
}
writeFileSync(`${outDir}/_run-summary.json`, JSON.stringify(summary, null, 2));
