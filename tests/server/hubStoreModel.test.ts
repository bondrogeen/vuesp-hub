import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { IConfigStore } from '@core/application/configStore.ts';
import { createHubStoreModel } from '@server/shared/storage/hubStoreModel.ts';
import type { IStoreEntity, IStoreModel, TStoreModelFactory } from '@server/shared/stores/types.ts';

const memoryConfigStore = (): IConfigStore => {
  const sections = new Map<string, Record<string, unknown>>();
  return {
    async get<T>(section: string, key: string) { return sections.get(section)?.[key] as T | undefined; },
    async set<T>(section: string, key: string, value: T) {
      const bucket = sections.get(section) ?? {};
      bucket[key] = value;
      sections.set(section, bucket);
    },
    async delete(section: string, key: string) {
      const bucket = sections.get(section);
      if (!bucket) return false;
      const existed = Object.hasOwn(bucket, key);
      delete bucket[key];
      return existed;
    },
    async list<T>(section: string) { return { ...(sections.get(section) ?? {}) } as Record<string, T>; },
    async health() { return { ok: true, status: 'ok' as const }; },
    async close() {},
  };
};

const fallbackStore: IStoreModel = {
  async getAll() { return [] as IStoreEntity[]; },
  async getById() { return undefined; },
  async create(data) { return { ...data, id: 1 }; },
  async update() { return null; },
  async delete() { return undefined; },
};
const fallback: TStoreModelFactory = () => fallbackStore;

test('routes config sections to config.sqlite and the rest to the fallback store', async () => {
  const configStore = memoryConfigStore();
  const storeModel = createHubStoreModel({ configStore, fallback });

  const areas = storeModel('areas');
  const created = await areas.create({ name: 'Kitchen' });
  assert.equal((await areas.getAll())[0]?.name, 'Kitchen');

  assert.equal(storeModel('device'), fallbackStore);
  await configStore.set('areas', String(created.id), { ...created, name: 'Hall' });
  assert.equal((await areas.getById(created.id))?.name, 'Hall');
});

test('panels keep soft delete while other sections delete hard', async () => {
  const configStore = memoryConfigStore();
  const storeModel = createHubStoreModel({ configStore, fallback });

  const panels = storeModel('panels');
  const panel = await panels.create({ name: 'Home' });
  await panels.delete(panel.id);
  assert.deepEqual(await panels.getAll(), []);
  assert.equal((await panels.getDeleted?.())?.length, 1);

  const areas = storeModel('areas');
  const area = await areas.create({ name: 'Kitchen' });
  await areas.delete(area.id);
  assert.deepEqual(await areas.getAll(), []);
  assert.equal(areas.getDeleted, undefined);
});

test('without a config store the fallback is returned untouched', () => {
  assert.equal(createHubStoreModel({ fallback }), fallback);
});
