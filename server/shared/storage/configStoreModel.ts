import type { IConfigStore } from '@core/application/configStore.ts';
import type { IStoreEntity, IStoreModel } from '@shared/stores/types.ts';

const asId = (value: unknown): number => typeof value === 'number' && Number.isInteger(value) ? value : Number(value);

/**
 * Adapts the key/value config store to the existing numeric store-model API.
 *
 * `softDelete` keeps sections like panels in a recoverable trash instead of
 * removing the document; purge is an explicit second step.
 */
export const createConfigStoreModel = (
  store: IConfigStore,
  section: string,
  options: { softDelete?: boolean } = {},
): IStoreModel => {
  const listAll = async (): Promise<IStoreEntity[]> => {
    const entries = await store.list<Record<string, unknown>>(section);
    return Object.entries(entries)
      .map(([key, value]) => ({ ...value, id: asId(value.id ?? key) }))
      .filter((item): item is IStoreEntity => Number.isInteger(item.id) && item.id > 0)
      .sort((left, right) => left.id - right.id);
  };
  const getAll = async (): Promise<IStoreEntity[]> =>
    (await listAll()).filter(item => item.deletedAt === undefined);
  const findAny = async (id: number): Promise<IStoreEntity | undefined> =>
    (await listAll()).find(item => item.id === id);

  const model: IStoreModel = {
    getAll,

    async getById(id) {
      return (await getAll()).find(item => item.id === id);
    },

    async create(data) {
      const items = await getAll();
      const id = items.length ? Math.max(...items.map(item => item.id)) + 1 : 1;
      const item = { ...data, id };
      await store.set(section, String(id), item);
      return item;
    },

    async update(id, data) {
      const current = (await getAll()).find(item => item.id === id);
      if (!current) return null;
      const updated = { ...current, ...data, id };
      await store.set(section, String(id), updated);
      return updated;
    },

    async delete(id) {
      const current = await findAny(id);
      if (!current) return undefined;
      if (options.softDelete) {
        const deletedAt = new Date().toISOString();
        await store.set(section, String(id), { ...current, deletedAt });
        return current;
      }
      await store.delete(section, String(id));
      return current;
    },
  };

  if (options.softDelete) {
    model.restore = async id => {
      const current = await findAny(id);
      if (!current || current.deletedAt === undefined) return undefined;
      const { deletedAt: _deletedAt, ...restored } = current;
      await store.set(section, String(id), restored);
      return restored;
    };
    model.purge = async id => {
      const current = await findAny(id);
      if (!current || current.deletedAt === undefined) return undefined;
      await store.delete(section, String(id));
      return current;
    };
    model.getDeleted = async () => (await listAll()).filter(item => item.deletedAt !== undefined);
  }

  return model;
};
