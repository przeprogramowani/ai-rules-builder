-- Disable Row Level Security
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
-- Remove policy to allow users to manage their own collections
DROP POLICY "Users can manage their own collections" ON collections;