import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  parseModuleRequirement,
  resolveModuleDependencies,
} from '@server/modules/modules/application/moduleDependencies.ts';
import { compareVersions, isValidRange, satisfies } from '@server/modules/modules/application/moduleSemver.ts';

test('semver comparisons and ranges cover the manifest syntax', () => {
  assert.equal(compareVersions('1.2.3', '1.2.4'), -1);
  assert.equal(compareVersions('2.0.0', '1.9.9'), 1);
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0);

  assert.equal(satisfies('1.4.0', '>=1.4 <2'), true);
  assert.equal(satisfies('2.0.0', '>=1.4 <2'), false);
  assert.equal(satisfies('1.2.9', '^1.2.3'), true);
  assert.equal(satisfies('2.0.0', '^1.2.3'), false);
  assert.equal(satisfies('0.2.9', '^0.2.3'), true);
  assert.equal(satisfies('0.3.0', '^0.2.3'), false);
  assert.equal(satisfies('1.2.9', '~1.2'), true);
  assert.equal(satisfies('1.3.0', '~1.2'), false);
  assert.equal(satisfies('3.1.0', '*'), true);
  assert.equal(satisfies('1.2.0', '1.2'), true);
  assert.equal(satisfies('1.3.0', '1.2'), false);

  assert.equal(isValidRange('>=1.4 <2'), true);
  assert.equal(isValidRange('nonsense'), false);
});

test('module requirements split provider names that contain colons', () => {
  assert.deepEqual(parseModuleRequirement('core:>=1.4 <2'), { name: 'core', range: '>=1.4 <2' });
  assert.deepEqual(parseModuleRequirement('storage:state:^1.2'), { name: 'storage:state', range: '^1.2' });
  assert.equal(parseModuleRequirement('core'), null);
  assert.equal(parseModuleRequirement('core:not-a-range'), null);
});

test('resolution orders providers before consumers and reports problems', () => {
  const ok = resolveModuleDependencies([
    { id: 'consumer', version: '1.0.0', requires: ['storage:state:^1.0'] },
    { id: 'provider', version: '1.2.0', provides: ['storage:state'] },
  ], '1.0.1');
  assert.deepEqual(ok.order, ['provider', 'consumer']);
  assert.deepEqual(ok.problems, {});

  const missing = resolveModuleDependencies([
    { id: 'consumer', version: '1.0.0', requires: ['storage:none:^1.0'] },
  ], '1.0.1');
  assert.equal(missing.problems.consumer, 'Missing dependency storage:none ^1.0');

  const coreMismatch = resolveModuleDependencies([
    { id: 'modern', version: '1.0.0', requires: ['core:>=2'] },
  ], '1.0.1');
  assert.match(coreMismatch.problems.modern, /Requires core/);

  const cycle = resolveModuleDependencies([
    { id: 'a', version: '1.0.0', provides: ['a'], requires: ['b:^1'] },
    { id: 'b', version: '1.0.0', provides: ['b'], requires: ['a:^1'] },
  ], '1.0.1');
  assert.match(cycle.problems.a, /Cyclic dependency/);
  assert.match(cycle.problems.b, /Cyclic dependency/);
  assert.deepEqual(cycle.order, []);

  const dependentBlocked = resolveModuleDependencies([
    { id: 'consumer', version: '1.0.0', requires: ['storage:state:^2'] },
    { id: 'provider', version: '1.0.0', provides: ['storage:state'] },
  ], '1.0.1');
  assert.match(dependentBlocked.problems.consumer, /Missing dependency/);
  assert.deepEqual(dependentBlocked.order, ['provider']);
});
