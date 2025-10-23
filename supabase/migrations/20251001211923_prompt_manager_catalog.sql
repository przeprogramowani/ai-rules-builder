-- Prompt Manager Phase 3: Prompt Collection Schema & Catalog
-- Create prompt collections table
CREATE TABLE IF NOT EXISTS prompt_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_prompt_collections_org_sort
  ON prompt_collections(organization_id, sort_order);

-- Create collection segments table
CREATE TABLE IF NOT EXISTS prompt_collection_segments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES prompt_collections(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE (collection_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_prompt_segments_collection_sort
  ON prompt_collection_segments(collection_id, sort_order);

-- Create prompts table (single active version per prompt)
CREATE TABLE IF NOT EXISTS prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES prompt_collections(id) ON DELETE CASCADE,
  segment_id UUID REFERENCES prompt_collection_segments(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  markdown_body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_prompts_org_scope
  ON prompts(organization_id, status, collection_id, segment_id);

-- Seed demo collections for 10xDevs
DO $$
DECLARE
  v_org_id UUID;
  v_coll1_id UUID;
  v_coll2_id UUID;
  v_seg1_id UUID;
  v_seg2_id UUID;
BEGIN
  -- Get 10xDevs organization ID
  SELECT id INTO v_org_id FROM organizations WHERE slug = '10xdevs';

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION '10xDevs organization not found';
  END IF;

  -- Insert collections
  INSERT INTO prompt_collections (organization_id, slug, title, description, sort_order)
  VALUES
    (v_org_id, 'fundamentals', 'Fundamentals', 'Core prompts for foundational concepts', 1),
    (v_org_id, 'advanced', 'Advanced Topics', 'Advanced prompts for experienced developers', 2)
  ON CONFLICT (organization_id, slug) DO NOTHING;

  -- Get collection IDs
  SELECT id INTO v_coll1_id FROM prompt_collections WHERE organization_id = v_org_id AND slug = 'fundamentals';
  SELECT id INTO v_coll2_id FROM prompt_collections WHERE organization_id = v_org_id AND slug = 'advanced';

  -- Insert segments
  INSERT INTO prompt_collection_segments (collection_id, slug, title, sort_order)
  VALUES
    (v_coll1_id, 'getting-started', 'Getting Started', 1),
    (v_coll1_id, 'best-practices', 'Best Practices', 2)
  ON CONFLICT (collection_id, slug) DO NOTHING;

  -- Get segment IDs
  SELECT id INTO v_seg1_id FROM prompt_collection_segments WHERE collection_id = v_coll1_id AND slug = 'getting-started';
  SELECT id INTO v_seg2_id FROM prompt_collection_segments WHERE collection_id = v_coll1_id AND slug = 'best-practices';

  -- Insert sample prompts
  INSERT INTO prompts (organization_id, collection_id, segment_id, title, markdown_body, status)
  VALUES
    (
      v_org_id,
      v_coll1_id,
      v_seg1_id,
      'Project Setup Guide',
      '# Project Setup

This prompt helps you set up a new project with best practices.

## Steps
1. Initialize repository
2. Configure tooling
3. Set up CI/CD',
      'published'
    ),
    (
      v_org_id,
      v_coll1_id,
      v_seg2_id,
      'Code Review Checklist',
      '# Code Review Checklist

Use this checklist when reviewing pull requests.

- [ ] Tests pass
- [ ] Code follows style guide
- [ ] Documentation updated',
      'draft'
    )
  ON CONFLICT DO NOTHING;
END $$;
