export interface Prompt {
  id: string;
  organization_id: string;
  collection_id: string;
  segment_id: string | null;
  title: string;
  markdown_body: string;
  status: 'draft' | 'published';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PromptCollection {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PromptSegment {
  id: string;
  collection_id: string;
  slug: string;
  title: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePromptInput {
  title: string;
  collection_id: string;
  segment_id?: string;
  markdown_body: string;
  created_by?: string;
}

export interface UpdatePromptInput {
  title?: string;
  markdown_body?: string;
  segment_id?: string | null;
}

export interface PromptFilters {
  status?: 'draft' | 'published';
  collection_id?: string;
  segment_id?: string;
  search?: string;
}

export interface CreateCollectionInput {
  slug?: string;
  title: string;
  description?: string;
  sort_order?: number;
}

export interface CreateSegmentInput {
  slug?: string;
  title: string;
  sort_order?: number;
}

export type ServiceResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };
