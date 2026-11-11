import type { ModuleManifest } from '@root/shared/module.ts';

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

const lastSegment = (value: string): string => {
  const parts = value.split('.').filter(Boolean);
  return parts.at(-1) ?? value;
};

export const moduleGroupSlug = (manifest: ModuleManifest): string | undefined => {
  if (!manifest.group) return undefined;
  return manifest.group.slug ?? lastSegment(manifest.group.id);
};

export const moduleSlug = (manifest: ModuleManifest): string => manifest.slug ?? lastSegment(manifest.id);

/**
 * Public UI route. Modules are always mounted under /modules so they can never
 * shadow core routes such as /video, /api or /dashboard.
 */
export const modulePublicRoute = (manifest: ModuleManifest): string => {
  const group = moduleGroupSlug(manifest);
  return group ? `/modules/${group}/${moduleSlug(manifest)}` : `/modules/${manifest.id}`;
};

export const validateModuleRoute = (manifest: ModuleManifest): void => {
  if (manifest.slug !== undefined && !SLUG_PATTERN.test(manifest.slug)) {
    throw new Error(`Invalid module slug: ${manifest.slug}`);
  }

  if (manifest.group) {
    if (typeof manifest.group.id !== 'string' || !manifest.group.id.trim()) {
      throw new Error('Module group id is required');
    }
    if (typeof manifest.group.name !== 'string' || !manifest.group.name.trim()) {
      throw new Error('Module group name is required');
    }
    const groupSlug = moduleGroupSlug(manifest);
    if (!groupSlug || !SLUG_PATTERN.test(groupSlug)) {
      throw new Error(`Invalid module group slug: ${String(groupSlug)}`);
    }
  }

  const group = moduleGroupSlug(manifest);
  if (group && !SLUG_PATTERN.test(moduleSlug(manifest))) {
    throw new Error(`Invalid module slug: ${moduleSlug(manifest)}`);
  }
};
