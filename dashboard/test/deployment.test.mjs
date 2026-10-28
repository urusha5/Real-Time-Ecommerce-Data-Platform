import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parse } from 'yaml';
const root = new URL('../../', import.meta.url);
test('production Compose isolates services, requires secrets and gates startup on migrations', async () => {
  const config = parse(await readFile(new URL('compose.production.yml', root), 'utf8'), { merge: true });
  for (const name of ['app', 'database', 'migrate', 'worker']) assert.equal(config.services[name].ports, undefined, name);
  assert.ok(config.services.proxy.ports.includes('443:443'));
  assert.equal(config.services.app.read_only, true); assert.ok(config.services.app.cap_drop.includes('ALL'));
  assert.equal(config.services.app.environment.NODE_ENV, 'production');
  assert.ok(config.services.app.environment.ADMIN_PASSWORD_HASH_FILE.startsWith('/run/secrets/'));
  assert.equal(config.services.app.depends_on.migrate.condition, 'service_completed_successfully');
  assert.equal(config.services.migrate.environment.PGUSER, 'postgres'); assert.equal(config.services.app.environment.PGUSER, 'commerce_app');
  assert.ok(config.services.worker.profiles.includes('kafka')); assert.ok(Object.hasOwn(config.volumes, 'database_data'));
});
test('CI has restricted permissions and pinned actions; image excludes secrets and development dependencies', async () => {
  const workflow = parse(await readFile(new URL('.github/workflows/ci.yml', root), 'utf8'));
  assert.equal(workflow.permissions.contents, 'read');
  for (const step of workflow.jobs.verify.steps) if (step.uses) assert.match(step.uses, /@[a-f0-9]{40}$/);
  const dockerfile = await readFile(new URL('Dockerfile', root), 'utf8');
  assert.ok(dockerfile.includes('USER node')); assert.ok(dockerfile.includes('npm ci --omit=dev'));
  const ignored = await readFile(new URL('.dockerignore', root), 'utf8');
  for (const token of ['.env', 'secrets', 'node_modules', 'backups']) assert.ok(ignored.includes(token));
});
