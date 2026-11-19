import { parse, type Node } from 'acorn';

type TAstNode = Node & Record<string, any>;

const MAX_EXPRESSION_LENGTH = 2_048;
const MAX_STEPS = 10_000;
const MAX_DEPTH = 64;
const MAX_COLLECTION = 1_000;
const MAX_CACHE = 1_000;

const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const MATH_METHODS = new Set(['abs', 'ceil', 'floor', 'max', 'min', 'pow', 'round', 'sqrt', 'trunc']);
const DATE_METHODS = new Set(['getDate', 'getFullYear', 'getMonth', 'getTime', 'toISOString', 'toLocaleDateString']);
const PRIMITIVE_METHODS = new Set(['toFixed', 'toString', 'toUpperCase', 'toLowerCase', 'trim']);
const ARRAY_METHODS = new Set(['join', 'slice']);

const GLOBAL_VALUES: Record<string, unknown> = {
  Math,
  Date,
  Number,
  String,
  Boolean,
  JSON,
  NaN,
  Infinity,
  undefined,
};

export class SafeExpressionError extends Error {
  readonly code = 'unsafe_expression';

  constructor(message: string) {
    super(message);
    this.name = 'SafeExpressionError';
  }
}

interface IEvaluationContext {
  local: Map<string, unknown>;
  steps: number;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeBody = (body: string): string => {
  if (typeof body !== 'string') throw new SafeExpressionError('Expression must be a string');
  if (body.length > MAX_EXPRESSION_LENGTH) throw new SafeExpressionError('Expression is too long');

  let source = body.trim();
  if (!source) return 'undefined';
  if (/^return\b/.test(source)) source = source.slice(6).trim();
  if (!source) return 'undefined';
  if (source.endsWith(';')) source = source.slice(0, -1).trim();
  return source;
};

const cloneValue = (value: unknown, seen = new WeakMap<object, unknown>()): unknown => {
  if (value === null || typeof value !== 'object') return value;
  if (value instanceof Date) return new Date(value.getTime());
  if (seen.has(value)) return seen.get(value);

  if (Array.isArray(value)) {
    const copy: unknown[] = [];
    seen.set(value, copy);
    for (const item of value.slice(0, MAX_COLLECTION)) copy.push(cloneValue(item, seen));
    return copy;
  }

  const copy: Record<string, unknown> = {};
  seen.set(value, copy);
  for (const [key, item] of Object.entries(value).slice(0, MAX_COLLECTION)) {
    if (!BLOCKED_KEYS.has(key)) copy[key] = cloneValue(item, seen);
  }
  return copy;
};

const assertKey = (key: string): void => {
  if (BLOCKED_KEYS.has(key)) throw new SafeExpressionError(`Blocked property: ${key}`);
};

const readMember = (object: unknown, key: string): unknown => {
  assertKey(key);
  if (object === null || object === undefined) {
    throw new SafeExpressionError(`Cannot read property ${key} of ${String(object)}`);
  }
  if (object instanceof Date) {
    if (key === 'getTime') return () => object.getTime();
    if (DATE_METHODS.has(key) && typeof (object as unknown as Record<string, unknown>)[key] === 'function') {
      return (object as unknown as Record<string, (...args: unknown[]) => unknown>)[key].bind(object);
    }
  }
  if (typeof object === 'object' || typeof object === 'string') {
    return (object as Record<string, unknown>)[key];
  }
  return undefined;
};

const setMember = (object: unknown, key: string, value: unknown): unknown => {
  assertKey(key);
  if (!isRecord(object) && !Array.isArray(object)) {
    throw new SafeExpressionError(`Cannot assign property ${key}`);
  }
  (object as Record<string, unknown>)[key] = value;
  return value;
};

const callAllowed = (node: TAstNode, context: IEvaluationContext, depth: number, evaluate: (node: TAstNode, context: IEvaluationContext, depth: number) => unknown): unknown => {
  if (node.callee?.type === 'MemberExpression' && !node.callee.computed) {
    const object = evaluate(node.callee.object, context, depth + 1);
    const key = node.callee.computed
      ? String(evaluate(node.callee.property, context, depth + 1))
      : String(node.callee.property.name);
    assertKey(key);
    const args = (node.arguments ?? []).map((argument: TAstNode) => evaluate(argument, context, depth + 1));

    if (object === Math && MATH_METHODS.has(key)) {
      return (Math as unknown as Record<string, (...items: number[]) => number>)[key](...args as number[]);
    }
    if (object instanceof Date && DATE_METHODS.has(key)) {
      return (object as unknown as Record<string, (...items: unknown[]) => unknown>)[key](...args);
    }
    if (Array.isArray(object) && ARRAY_METHODS.has(key)) {
      return (object as unknown as Record<string, (...items: unknown[]) => unknown>)[key](...args);
    }
    if (['number', 'string', 'boolean'].includes(typeof object) && PRIMITIVE_METHODS.has(key)) {
      return (object as unknown as Record<string, (...items: unknown[]) => unknown>)[key](...args);
    }
    throw new SafeExpressionError(`Blocked method call: ${key}`);
  }

  if (node.callee?.type === 'Identifier') {
    const name = String(node.callee.name);
    const args = (node.arguments ?? []).map((argument: TAstNode) => evaluate(argument, context, depth + 1));
    if (name === 'Number') return Number(args[0]);
    if (name === 'String') return String(args[0] ?? '');
    if (name === 'Boolean') return Boolean(args[0]);
    if (name === 'parseInt') return Number.parseInt(String(args[0] ?? ''), args[1] === undefined ? 10 : Number(args[1]));
    if (name === 'parseFloat') return Number.parseFloat(String(args[0] ?? ''));
    if (name === 'isNaN') return Number.isNaN(Number(args[0]));
    if (name === 'isFinite') return Number.isFinite(Number(args[0]));
    throw new SafeExpressionError(`Blocked function call: ${name}`);
  }

  throw new SafeExpressionError('Blocked call expression');
};

export class SafeExpressionEngine {
  private readonly cache = new Map<string, TAstNode>();

  evaluate(body: string, scope: Record<string, unknown> = {}): unknown {
    const source = normalizeBody(body);
    const ast = this.compile(source);
    const local = new Map<string, unknown>();
    for (const [key, value] of Object.entries(scope)) {
      if (!BLOCKED_KEYS.has(key)) local.set(key, cloneValue(value));
    }

    return this.evaluateNode(ast, { local, steps: 0 }, 0);
  }

  private compile(source: string): TAstNode {
    const cached = this.cache.get(source);
    if (cached) return cached;

    let ast: TAstNode;
    try {
      const program = parse(`(${source})`, { ecmaVersion: 'latest' }) as TAstNode;
      const statement = program.body?.[0];
      if (program.body?.length !== 1 || statement?.type !== 'ExpressionStatement' || !statement.expression) {
        throw new SafeExpressionError('Only a single expression is allowed');
      }
      ast = statement.expression as TAstNode;
    } catch (error) {
      if (error instanceof SafeExpressionError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new SafeExpressionError(`Invalid expression: ${message}`);
    }

    if (this.cache.size >= MAX_CACHE) {
      const first = this.cache.keys().next().value;
      if (first) this.cache.delete(first);
    }
    this.cache.set(source, ast);
    return ast;
  }

  private evaluateNode(node: TAstNode, context: IEvaluationContext, depth: number): unknown {
    if (!node || typeof node.type !== 'string') throw new SafeExpressionError('Invalid AST node');
    if (depth > MAX_DEPTH) throw new SafeExpressionError('Expression is too deep');
    context.steps += 1;
    if (context.steps > MAX_STEPS) throw new SafeExpressionError('Expression step limit exceeded');

    switch (node.type) {
      case 'Literal':
        if (node.regex) throw new SafeExpressionError('Regular expressions are not allowed');
        return node.value;

      case 'Identifier': {
        const name = String(node.name);
        if (context.local.has(name)) return context.local.get(name);
        if (Object.hasOwn(GLOBAL_VALUES, name)) return GLOBAL_VALUES[name];
        throw new SafeExpressionError(`Unknown identifier: ${name}`);
      }

      case 'TemplateLiteral': {
        let result = '';
        const expressions = node.expressions ?? [];
        const quasis = node.quasis ?? [];
        for (let index = 0; index < quasis.length; index += 1) {
          result += String(quasis[index]?.value?.cooked ?? quasis[index]?.value?.raw ?? '');
          if (index < expressions.length) result += String(this.evaluateNode(expressions[index], context, depth + 1));
        }
        return result;
      }

      case 'ArrayExpression': {
        const result: unknown[] = [];
        for (const element of node.elements ?? []) {
          if (!element) {
            result.push(undefined);
            continue;
          }
          if (element.type === 'SpreadElement') {
            const value = this.evaluateNode(element.argument, context, depth + 1);
            if (Array.isArray(value)) result.push(...value.slice(0, MAX_COLLECTION));
            else throw new SafeExpressionError('Only arrays can be spread into an array');
          } else {
            result.push(this.evaluateNode(element, context, depth + 1));
          }
          if (result.length > MAX_COLLECTION) throw new SafeExpressionError('Array is too large');
        }
        return result;
      }

      case 'ObjectExpression': {
        const result: Record<string, unknown> = {};
        for (const property of node.properties ?? []) {
          if (property.type === 'SpreadElement') {
            const value = this.evaluateNode(property.argument, context, depth + 1);
            if (value && typeof value === 'object') {
              for (const [key, item] of Object.entries(value).slice(0, MAX_COLLECTION)) {
                if (!BLOCKED_KEYS.has(key)) result[key] = item;
              }
            }
            continue;
          }
          if (property.type !== 'Property' || property.computed || property.method) {
            throw new SafeExpressionError('Unsupported object property');
          }
          const key = property.key.type === 'Identifier' ? String(property.key.name) : String(property.key.value);
          assertKey(key);
          result[key] = this.evaluateNode(property.value, context, depth + 1);
        }
        return result;
      }

      case 'UnaryExpression': {
        if (node.operator === 'delete' || node.operator === 'void') {
          throw new SafeExpressionError(`Unsupported unary operator: ${node.operator}`);
        }
        const value = this.evaluateNode(node.argument, context, depth + 1);
        if (node.operator === 'typeof') return typeof value;
        if (node.operator === '!') return !value;
        if (node.operator === '~') return ~(value as number);
        if (node.operator === '+') return +(value as number);
        if (node.operator === '-') return -(value as number);
        throw new SafeExpressionError(`Unsupported unary operator: ${node.operator}`);
      }

      case 'BinaryExpression': {
        if (['in', 'instanceof'].includes(node.operator)) {
          throw new SafeExpressionError(`Unsupported binary operator: ${node.operator}`);
        }
        const left = this.evaluateNode(node.left, context, depth + 1) as never;
        const right = this.evaluateNode(node.right, context, depth + 1) as never;
        switch (node.operator) {
          case '+': return left + right;
          case '-': return (left as number) - (right as number);
          case '*': return (left as number) * (right as number);
          case '/': return (left as number) / (right as number);
          case '%': return (left as number) % (right as number);
          case '**': return (left as number) ** (right as number);
          case '&': return (left as number) & (right as number);
          case '|': return (left as number) | (right as number);
          case '^': return (left as number) ^ (right as number);
          case '<<': return (left as number) << (right as number);
          case '>>': return (left as number) >> (right as number);
          case '>>>': return (left as number) >>> (right as number);
          case '==': return left == right;
          case '!=': return left != right;
          case '===': return left === right;
          case '!==': return left !== right;
          case '<': return left < right;
          case '<=': return left <= right;
          case '>': return left > right;
          case '>=': return left >= right;
          default: throw new SafeExpressionError(`Unsupported binary operator: ${node.operator}`);
        }
      }

      case 'LogicalExpression': {
        const left = this.evaluateNode(node.left, context, depth + 1);
        if (node.operator === '&&') return left ? this.evaluateNode(node.right, context, depth + 1) : left;
        if (node.operator === '||') return left ? left : this.evaluateNode(node.right, context, depth + 1);
        if (node.operator === '??') return left ?? this.evaluateNode(node.right, context, depth + 1);
        throw new SafeExpressionError(`Unsupported logical operator: ${node.operator}`);
      }

      case 'ConditionalExpression':
        return this.evaluateNode(node.test, context, depth + 1)
          ? this.evaluateNode(node.consequent, context, depth + 1)
          : this.evaluateNode(node.alternate, context, depth + 1);

      case 'MemberExpression': {
        if (node.optional) throw new SafeExpressionError('Optional chaining is not allowed');
        const object = this.evaluateNode(node.object, context, depth + 1);
        const key = node.computed
          ? this.evaluateNode(node.property, context, depth + 1)
          : String(node.property.name);
        return readMember(object, String(key));
      }

      case 'CallExpression':
        if (node.optional) throw new SafeExpressionError('Optional calls are not allowed');
        return callAllowed(node, context, depth, (child, childContext, childDepth) => this.evaluateNode(child, childContext, childDepth));

      case 'NewExpression': {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Date') {
          throw new SafeExpressionError('Only new Date() is allowed');
        }
        const args = (node.arguments ?? []).map((argument: TAstNode) => this.evaluateNode(argument, context, depth + 1));
        return new Date(...(args as []));
      }

      case 'AssignmentExpression': {
        const value = this.evaluateNode(node.right, context, depth + 1);
        if (node.left.type === 'Identifier') {
          const name = String(node.left.name);
          if (!context.local.has(name)) throw new SafeExpressionError(`Assignment to unknown identifier: ${name}`);
          const current = context.local.get(name);
          context.local.set(name, this.applyAssignment(node.operator, current, value));
          return context.local.get(name);
        }
        if (node.left.type === 'MemberExpression' && !node.left.computed) {
          const object = this.evaluateNode(node.left.object, context, depth + 1);
          const key = String(node.left.property.name);
          const current = readMember(object, key);
          return setMember(object, key, this.applyAssignment(node.operator, current, value));
        }
        throw new SafeExpressionError('Unsupported assignment target');
      }

      case 'SequenceExpression': {
        let result: unknown;
        for (const expression of node.expressions ?? []) result = this.evaluateNode(expression, context, depth + 1);
        return result;
      }

      default:
        throw new SafeExpressionError(`Unsupported expression: ${node.type}`);
    }
  }

  private applyAssignment(operator: string, current: unknown, value: unknown): unknown {
    if (operator === '=') return value;
    const left = current as never;
    const right = value as never;
    switch (operator) {
      case '+=': return left + right;
      case '-=': return (left as number) - (right as number);
      case '*=': return (left as number) * (right as number);
      case '/=': return (left as number) / (right as number);
      case '%=': return (left as number) % (right as number);
      case '**=': return (left as number) ** (right as number);
      case '&=': return (left as number) & (right as number);
      case '|=': return (left as number) | (right as number);
      case '^=': return (left as number) ^ (right as number);
      case '<<=': return (left as number) << (right as number);
      case '>>=': return (left as number) >> (right as number);
      case '>>>=': return (left as number) >>> (right as number);
      default: throw new SafeExpressionError(`Unsupported assignment operator: ${operator}`);
    }
  }
}

const engine = new SafeExpressionEngine();

/** Dashboard evaluator with the same signature as TDashboardEvaluator. */
export const evaluateSafe = (body: string, scope: Record<string, unknown>): unknown => engine.evaluate(body, scope);
