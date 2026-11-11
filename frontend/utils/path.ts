/**
 * Hub URLs always end with a trailing slash. Returns the value unchanged when
 * it is already normalized, preserving an optional query string and hash.
 */
export const withTrailingSlash = (value: string): string => {
  if (!value) return '/';

  const hashIndex = value.indexOf('#');
  const hash = hashIndex === -1 ? '' : value.slice(hashIndex);
  const withoutHash = hashIndex === -1 ? value : value.slice(0, hashIndex);

  const queryIndex = withoutHash.indexOf('?');
  const query = queryIndex === -1 ? '' : withoutHash.slice(queryIndex);
  const pathname = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex);

  if (!pathname || pathname.endsWith('/')) return value;
  return `${pathname}/${query}${hash}`;
};

/** Route path without a trailing slash, for comparisons and lookups. */
export const withoutTrailingSlash = (value: string): string => {
  if (value === '/') return '/';
  return value.replace(/\/+$/, '') || '/';
};
