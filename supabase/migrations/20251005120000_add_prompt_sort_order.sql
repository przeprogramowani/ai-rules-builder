-- Add sort_order column to prompts table
ALTER TABLE prompts
ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;

-- Create index for efficient sorting
CREATE INDEX IF NOT EXISTS idx_prompts_sort_order
  ON prompts(collection_id, segment_id, sort_order);
