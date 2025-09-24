-- Create rules table for storing AI rules
CREATE TABLE rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  library_id VARCHAR(100) NOT NULL, -- Maps to Library enum
  rule_content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(library_id, rule_content)
);

-- Create indexes for performance
CREATE INDEX idx_rules_library ON rules(library_id);
CREATE INDEX idx_rules_active ON rules(is_active);
CREATE INDEX idx_rules_library_active ON rules(library_id, is_active);

-- Add RLS (Row Level Security) - allow read access to all users
ALTER TABLE rules ENABLE ROW LEVEL SECURITY;

-- Policy to allow read access to all authenticated and anonymous users
CREATE POLICY "Allow read access to rules" ON rules
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy to allow insert/update/delete only to authenticated users (for future admin functionality)
CREATE POLICY "Allow admin access to rules" ON rules
  FOR ALL
  TO authenticated
  USING (true);