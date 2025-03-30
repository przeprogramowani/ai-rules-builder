import { type Library } from '../data/dictionaries';
import { type Database } from '../db/database.types';

export interface Collection {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  libraries: Library[];
  createdAt: string;
  updatedAt: string;
}

export function collectionMapper(
  collection: Database['public']['Tables']['collections']['Row'],
): Collection {
  return {
    id: collection.id,
    userId: collection.user_id,
    name: collection.name,
    description: collection.description,
    libraries: collection.libraries as Library[],
    createdAt: collection.created_at,
    updatedAt: collection.updated_at,
  };
}

export const DEFAULT_USER_ID = '899b93b3-f661-4471-9995-1165701d9f51';
