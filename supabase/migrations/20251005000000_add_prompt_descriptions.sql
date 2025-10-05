-- Add description columns to prompts table
ALTER TABLE prompts
  ADD COLUMN description_en TEXT,
  ADD COLUMN description_pl TEXT;

COMMENT ON COLUMN prompts.description_en IS 'Brief description/summary of the prompt in English.';
COMMENT ON COLUMN prompts.description_pl IS 'Brief description/summary of the prompt in Polish.';
