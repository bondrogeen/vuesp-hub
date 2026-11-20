import { compareVersions, isValidRange, satisfies } from './moduleSemver.ts';

export interface IModuleDependency {
  name: string;
  range: string;
}

export interface IModuleDependencyInput {
  id: string;
  version: string;
  provides?: string[];
  requires?: string[];
}

export interface IModuleDependencyResult {
  /** Start order: providers before consumers. */
  order: string[];
  /** Modules that cannot start, with the reason. */
  problems: Record<string, string>;
  /** Provider module ids each module depends on. */
  dependencies: Record<string, string[]>;
}

/**
 * `core:>=1.4 <2` — the range never contains `:`, so the last colon separates
 * the provider name (which may itself contain `:`, e.g. `storage:state`).
 */
export const parseModuleRequirement = (value: string): IModuleDependency | null => {
  const index = value.lastIndexOf(':');
  if (index <= 0 || index === value.length - 1) return null;
  const name = value.slice(0, index).trim();
  const range = value.slice(index + 1).trim();
  if (!name || !isValidRange(range)) return null;
  return { name, range };
};

export const resolveModuleDependencies = (
  modules: IModuleDependencyInput[],
  coreVersion: string,
): IModuleDependencyResult => {
  const providers = new Map<string, Array<{ id: string; version: string }>>();
  for (const module of modules) {
    for (const name of module.provides ?? []) {
      const list = providers.get(name) ?? [];
      list.push({ id: module.id, version: module.version });
      providers.set(name, list);
    }
  }
  for (const list of providers.values()) {
    list.sort((left, right) => compareVersions(right.version, left.version));
  }

  const dependencies: Record<string, string[]> = {};
  const problems = new Map<string, string>();

  for (const module of modules) {
    const edges: string[] = [];
    for (const requirement of module.requires ?? []) {
      const parsed = parseModuleRequirement(requirement);
      if (!parsed) {
        problems.set(module.id, `Invalid dependency: ${requirement}`);
        continue;
      }
      if (parsed.name === 'core') {
        if (!satisfies(coreVersion, parsed.range)) {
          problems.set(module.id, `Requires core ${parsed.range}, hub is ${coreVersion}`);
        }
        continue;
      }
      const candidates = (providers.get(parsed.name) ?? []).filter(candidate => satisfies(candidate.version, parsed.range));
      if (!candidates.length) {
        problems.set(module.id, `Missing dependency ${parsed.name} ${parsed.range}`);
        continue;
      }
      const provider = candidates[0]!;
      if (provider.id !== module.id) edges.push(provider.id);
    }
    dependencies[module.id] = edges;
  }

  const order: string[] = [];
  const state = new Map<string, 'visiting' | 'done'>();

  const visit = (id: string, stack: string[]): boolean => {
    if (problems.has(id)) return false;
    const current = state.get(id);
    if (current === 'done') return true;
    if (current === 'visiting') {
      const cycle = [...stack.slice(stack.indexOf(id)), id];
      for (const cycleId of stack.slice(stack.indexOf(id))) {
        problems.set(cycleId, `Cyclic dependency: ${cycle.join(' -> ')}`);
      }
      return false;
    }

    state.set(id, 'visiting');
    let ok = true;
    for (const dependency of dependencies[id] ?? []) {
      if (!visit(dependency, [...stack, id])) {
        if (!problems.has(id)) problems.set(id, `Dependency ${dependency} is unavailable`);
        ok = false;
      }
    }
    state.set(id, 'done');
    if (ok && !problems.has(id)) order.push(id);
    return ok && !problems.has(id);
  };

  for (const module of modules) visit(module.id, []);

  return { order, problems: Object.fromEntries(problems), dependencies };
};
