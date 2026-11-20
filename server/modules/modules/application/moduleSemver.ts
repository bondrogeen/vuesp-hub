export interface IParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
}

const VERSION_PATTERN = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9A-Za-z.-]+))?$/;

export const parseVersion = (value: string): IParsedVersion | null => {
  const match = VERSION_PATTERN.exec(value.trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
    ...(match[4] ? { prerelease: match[4] } : {}),
  };
};

export const compareVersions = (left: string, right: string): number => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return 0;
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (a.prerelease === undefined) return 1;
  if (b.prerelease === undefined) return -1;
  return a.prerelease > b.prerelease ? 1 : -1;
};

interface IPartialVersion extends IParsedVersion {
  precision: 1 | 2 | 3;
}

const parsePartial = (value: string): IPartialVersion | null => {
  const parsed = parseVersion(value);
  if (!parsed) return null;
  const parts = value.trim().split('-')[0]!.split('.');
  return { ...parsed, precision: Math.min(parts.length, 3) as 1 | 2 | 3 };
};

type TComparator = (version: IParsedVersion) => boolean;

const gte = (minimum: IParsedVersion): TComparator => version => compareParsed(version, minimum) >= 0;
const gt = (minimum: IParsedVersion): TComparator => version => compareParsed(version, minimum) > 0;
const lte = (maximum: IParsedVersion): TComparator => version => compareParsed(version, maximum) <= 0;
const lt = (maximum: IParsedVersion): TComparator => version => compareParsed(version, maximum) < 0;

const compareParsed = (a: IParsedVersion, b: IParsedVersion): number => {
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  }
  return 0;
};

const version = (major: number, minor = 0, patch = 0): IParsedVersion => ({ major, minor, patch });

const caretRange = (partial: IPartialVersion): TComparator[] => {
  const lower = gte(version(partial.major, partial.minor, partial.patch));
  if (partial.major > 0 || partial.precision === 1) {
    return [lower, lt(version(partial.major + 1))];
  }
  if (partial.minor > 0 || partial.precision === 2) {
    return [lower, lt(version(0, partial.minor + 1))];
  }
  return [lower, lt(version(0, 0, partial.patch + 1))];
};

const tildeRange = (partial: IPartialVersion): TComparator[] => {
  const lower = gte(version(partial.major, partial.minor, partial.patch));
  if (partial.precision === 1) return [lower, lt(version(partial.major + 1))];
  return [lower, lt(version(partial.major, partial.minor + 1))];
};

const bareRange = (partial: IPartialVersion): TComparator[] => {
  if (partial.precision === 3) {
    const exact = lowerVersion(partial);
    return [candidate => compareParsed(candidate, exact) === 0];
  }
  const lower = gte(version(partial.major, partial.minor, partial.patch));
  if (partial.precision === 2) return [lower, lt(version(partial.major, partial.minor + 1))];
  return [lower, lt(version(partial.major + 1))];
};

const lowerVersion = (partial: IParsedVersion): IParsedVersion => version(partial.major, partial.minor, partial.patch);

/** Turns one comparator token into predicate functions, or null when invalid. */
const comparator = (token: string): TComparator[] | null => {
  if (token === '*' || token === 'x' || token === 'X') return [() => true];
  const match = /^(>=|<=|>|<|=|\^|~)?(.+)$/.exec(token);
  if (!match) return null;
  const operator = match[1] ?? '';
  const partial = parsePartial(match[2]!);
  if (!partial) return null;

  switch (operator) {
    case '>=': return [gte(version(partial.major, partial.minor, partial.patch))];
    case '>': return [gt(version(partial.major, partial.minor, partial.patch))];
    case '<=': return [lte(version(partial.major, partial.minor, partial.patch))];
    case '<': return [lt(version(partial.major, partial.minor, partial.patch))];
    case '^': return caretRange(partial);
    case '~': return tildeRange(partial);
    default: return bareRange(partial);
  }
};

/** True when `range` uses only supported comparator syntax. */
export const isValidRange = (range: string): boolean => {
  const tokens = range.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  return tokens.every(token => comparator(token) !== null);
};

/** Minimal SemVer range check: `*`, `>=1.2`, `^1.2.3`, `~1.2`, space = AND. */
export const satisfies = (value: string, range: string): boolean => {
  const parsed = parseVersion(value);
  if (!parsed) return false;
  const tokens = range.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  const predicates: TComparator[] = [];
  for (const token of tokens) {
    const parsedToken = comparator(token);
    if (!parsedToken) return false;
    predicates.push(...parsedToken);
  }
  return predicates.every(predicate => predicate(parsed));
};
