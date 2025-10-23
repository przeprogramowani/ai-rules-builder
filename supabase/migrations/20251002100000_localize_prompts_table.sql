-- Alter prompts table for localization
ALTER TABLE prompts
  RENAME COLUMN title TO title_en;

ALTER TABLE prompts
  RENAME COLUMN markdown_body TO markdown_body_en;

ALTER TABLE prompts
  ADD COLUMN title_pl TEXT,
  ADD COLUMN markdown_body_pl TEXT;

COMMENT ON COLUMN prompts.title_en IS 'Title of the prompt in English.';
COMMENT ON COLUMN prompts.markdown_body_en IS 'Markdown body of the prompt in English.';
COMMENT ON COLUMN prompts.title_pl IS 'Title of the prompt in Polish.';
COMMENT ON COLUMN prompts.markdown_body_pl IS 'Markdown body of the prompt in Polish.';
