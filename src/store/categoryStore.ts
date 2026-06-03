import { create } from 'zustand';
import { db } from '@/db';
import { findCategoryByName } from '@/db/categories';
import type { Category } from '@/types';
import { createId } from '@/utils/id';

interface CategoryState {
  categories: Category[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: Omit<Category, 'id'>) => Promise<void>;
  update: (id: string, data: Partial<Omit<Category, 'id'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  bulkSet: (items: Category[]) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  loading: false,

  load: async () => {
    set({ loading: true });
    const categories = await db.categories.orderBy('name').toArray();
    set({ categories, loading: false });
  },

  add: async (data) => {
    const duplicate = await findCategoryByName(data.name);
    if (duplicate) {
      throw new Error(`A category named "${data.name}" already exists`);
    }
    const category: Category = { ...data, id: createId() };
    await db.categories.put(category);
    await get().load();
  },

  update: async (id, data) => {
    const existing = await db.categories.get(id);
    if (!existing) return;
    if (data.name) {
      const duplicate = await findCategoryByName(data.name, id);
      if (duplicate) {
        throw new Error(`A category named "${data.name}" already exists`);
      }
    }
    await db.categories.put({ ...existing, ...data });
    await get().load();
  },

  remove: async (id) => {
    await db.categories.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.categories.clear();
    await db.categories.bulkPut(items);
    await get().load();
  },
}));
