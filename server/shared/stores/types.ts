export interface StoreEntity {
  id: number;
  [key: string]: unknown;
}

export interface StoreModel {
  getAll(): Promise<StoreEntity[]>;
  getById(id: number): Promise<StoreEntity | undefined>;
  create(data: Omit<StoreEntity, 'id'>): Promise<StoreEntity>;
  update(id: number, data: Partial<StoreEntity>): Promise<StoreEntity | null>;
  delete(id: number): Promise<StoreEntity | undefined>;
}

export type StoreModelFactory = (key: string) => StoreModel;
