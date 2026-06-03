import { create } from 'zustand';
import { db } from '@/db';
import {
  findCategoryByName,
  getCategoryUsage,
  reassignCategoryReferences,
  type CategoryUsage,
} from '@/db/categories';
import type { Category, CategoryKind } from '@/types';
import { createId } from '@/utils/id';

export type CategoryInput = {
  name: string;
  color: string;
  kind?: CategoryKind;
};

interface CategoryState {
  categories: Category[];
  loading: boolean;
  load: () => Promise<void>;
  add: (data: CategoryInput) => Promise<void>;
  update: (id: string, data: Partial<CategoryInput>) => Promise<void>;
  remove: (id: string, reassignToId?: string) => Promise<void>;
  getUsage: (id: string) => Promise<CategoryUsage>;
  bulkSet: (items: Category[]) => Promise<void>;
}

export class CategoryInUseError extends Error {
  usage: CategoryUsage;

  constructor(usage: CategoryUsage) {
    const total = usage.expenses + usage.budgets + usage.recurring;
    super(
      `This category is used in ${total} record${total === 1 ? '' : 's'}. Choose another category to move them to.`,
    );
    this.name = 'CategoryInUseError';
    this.usage = usage;
  }
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
    const category: Category = {
      name: data.name.trim(),
      color: data.color,
      kind: data.kind,
      id: createId(),
    };
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
    await db.categories.put({
      ...existing,
      ...data,
      name: data.name?.trim() ?? existing.name,
    });
    await get().load();
  },

  getUsage: async (id) => getCategoryUsage(id),

  remove: async (id, reassignToId) => {
    const usage = await getCategoryUsage(id);
    const inUse = usage.expenses + usage.budgets + usage.recurring;

    if (inUse > 0) {
      if (!reassignToId) {
        throw new CategoryInUseError(usage);
      }
      if (reassignToId === id) {
        throw new Error('Choose a different category');
      }
      const target = await db.categories.get(reassignToId);
      if (!target) {
        throw new Error('Target category not found');
      }
      await reassignCategoryReferences(id, reassignToId);
    }

    await db.categories.delete(id);
    await get().load();
  },

  bulkSet: async (items) => {
    await db.categories.clear();
    await db.categories.bulkPut(items);
    await get().load();
  },
}));
