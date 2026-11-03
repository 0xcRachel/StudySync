import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(backendDir, '..');
const env = { ...process.env };
try {
  for (const raw of readFileSync(path.join(backendDir, '.env'), 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && env[key] === undefined) env[key] = value;
  }
} catch { /* Defaults and inherited environment remain available. */ }

const php = env.PHP_BINARY || 'php';
const phpPort = env.API_PORT || '8080';
const phpArgs = ['-d', 'upload_max_filesize=6M', '-d', 'post_max_size=8M', '-S', `0.0.0.0:${phpPort}`, '-t', backendDir, path.join(backendDir, 'router.php')];
async function healthy(url) {
  try { return (await fetch(url, { signal: AbortSignal.timeout(1500) })).ok; } catch { return false; }
}
const apiAlreadyRunning = await healthy(`http://127.0.0.1:${phpPort}/health.php`);
const realtimePort = env.REALTIME_PORT || '8090';
const realtimeAlreadyRunning = await healthy(`http://127.0.0.1:${realtimePort}/health`);
if (apiAlreadyRunning) console.log(`StudySync API is already available on port ${phpPort}; reusing it.`);
if (realtimeAlreadyRunning) console.log(`StudySync real-time gateway is already available on port ${realtimePort}; reusing it.`);
const phpServer = apiAlreadyRunning ? null : spawn(php, phpArgs, { cwd: rootDir, env, stdio: 'inherit', windowsHide: true });
const realtime = realtimeAlreadyRunning ? null : spawn(process.execPath, [path.join(backendDir, 'realtime', 'server.mjs')], { cwd: rootDir, env, stdio: 'inherit', windowsHide: true });
let stopping = false;

function shutdown(code = 0) {
  if (stopping) return;
  stopping = true;
  phpServer?.kill();
  realtime?.kill();
  setTimeout(() => process.exit(code), 300).unref();
}

phpServer?.on('error', (error) => { console.error(`PHP backend failed to start: ${error.message}`); shutdown(1); });
realtime?.on('error', (error) => { console.error(`Real-time gateway failed to start: ${error.message}`); shutdown(1); });
phpServer?.on('exit', (code) => { if (!stopping) shutdown(code || 0); });
realtime?.on('exit', (code) => { if (!stopping && code) { console.error(`Real-time gateway exited with code ${code}`); shutdown(code); } });
process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
