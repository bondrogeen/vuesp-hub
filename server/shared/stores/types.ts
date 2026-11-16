export interface IStoreEntity {
  id: number;
  [key: string]: unknown;
}

export interface IStoreModel {
  getAll(): Promise<IStoreEntity[]>;
  getById(id: number): Promise<IStoreEntity | undefined>;
  create(data: Omit<IStoreEntity, 'id'>): Promise<IStoreEntity>;
  update(id: number, data: Partial<IStoreEntity>): Promise<IStoreEntity | null>;
  delete(id: number): Promise<IStoreEntity | undefined>;
}

export type TStoreModelFactory = (key: string) => IStoreModel;
