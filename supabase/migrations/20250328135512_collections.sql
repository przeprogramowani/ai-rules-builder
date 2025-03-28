-- Create collections table
CREATE TABLE collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  libraries TEXT [] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);
-- Create index on user_id for faster lookups
CREATE INDEX collections_user_id_idx ON collections(user_id);
-- Enable Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
-- Create policy to allow users to manage their own collections
CREATE POLICY "Users can manage their own collections" ON collections FOR ALL USING (auth.uid() = user_id);
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = TIMEZONE('utc', NOW());
RETURN NEW;
END;
$$ language 'plpgsql';
-- Trigger to call the update function
CREATE TRIGGER update_collections_updated_at BEFORE
UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();