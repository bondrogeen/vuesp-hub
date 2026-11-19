import assert from 'node:assert/strict';
import { test } from 'node:test';

import { evaluateSafe, SafeExpressionError } from '../../shared/safeExpression.ts';

test('safe expression supports the dashboard subset', () => {
  assert.equal(evaluateSafe('return a & 2', { a: 6 }), 2);
  assert.equal(evaluateSafe('return (a / 1000).toFixed(3)', { a: 1234 }), '1.234');
  assert.equal(evaluateSafe('return Math.max(a, b, c, d)', { a: 1, b: 4, c: 2, d: 3 }), 4);
  assert.equal(evaluateSafe("return v ? 'ON' : 'OFF'", { v: 1 }), 'ON');
  assert.equal(evaluateSafe('return `${v} V`', { v: 12 }), '12 V');
  assert.equal(evaluateSafe('return CMD.SET', { CMD: { SET: 2 } }), 2);
  assert.equal(evaluateSafe('return PORT.OUTPUT === 4', { PORT: { OUTPUT: 4 } }), true);
  assert.equal(evaluateSafe('return new Date(v * 1000).getTime()', { v: 1 }), 1000);
});

test('safe expression keeps the input scope immutable', () => {
  const scope = { b: { output: 1, value: 10 }, v: 1 };
  const result = evaluateSafe('({ ...b, output: v ? (b.output &= ~1) : (b.output |= 1), command: 2 })', scope);
  assert.deepEqual(result, { output: 0, value: 10, command: 2 });
  assert.deepEqual(scope.b, { output: 1, value: 10 });
});

test('safe expression blocks code execution and prototype access', () => {
  const blocked = [
    'process.exit(1)',
    "require('fs')",
    'globalThis.process',
    'this.constructor',
    '({}).__proto__',
    '(() => 1)()',
    'new Function("return 1")',
    'Math.constructor("return 1")',
    'function () { return 1 }',
    'while (true) {}',
  ];

  for (const expression of blocked) {
    assert.throws(() => evaluateSafe(expression, {}), SafeExpressionError, expression);
  }
});

test('safe expression rejects unsupported methods and oversized input', () => {
  assert.throws(() => evaluateSafe("return 'x'.replace('x', 'y')", {}), /Blocked method call/);
  assert.throws(() => evaluateSafe(`return ${'1+'.repeat(2_000)}1`, {}), /too long/);
  assert.throws(() => evaluateSafe('return foo', {}), /Unknown identifier/);
});
