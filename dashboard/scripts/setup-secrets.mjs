import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const folder = new URL('../../secrets/', import.meta.url);
await mkdir(folder, { recursive: true, mode: 0o700 });
const result = spawnSync(process.execPath, [fileURLToPath(new URL('./hash-password.mjs', import.meta.url))], { stdio: ['inherit', 'pipe', 'inherit'], encoding: 'utf8' });
if (result.status !== 0) throw new Error('Password hash generation failed.');
for (const [name, value] of [['admin_password_hash', result.stdout.trim()], ['postgres_password', randomBytes(32).toString('hex')], ['app_database_password', randomBytes(32).toString('hex')], ['ingest_api_key', randomBytes(32).toString('hex')], ['kafka_sasl_password', '']]) {
  // The parent directory is private; file-mode 0444 allows non-root container UIDs to read explicitly mounted secrets.
  try { await writeFile(new URL(name, folder), value + '\n', { flag: 'wx', mode: 0o444 }); console.log(`Created secrets/${name}`); }
  catch (error) { if (error.code === 'EEXIST') console.log(`Preserved existing secrets/${name}`); else throw error; }
}
console.log('Secret values were not printed. Keep secrets/ out of Git and back it up securely.');
