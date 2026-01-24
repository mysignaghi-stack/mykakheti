-- Add new fields to congratulations table for enhanced visual templates
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS template TEXT DEFAULT 'თანამედროვე მინიმალიზმი';
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS toast TEXT;
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS music_url TEXT;
ALTER TABLE congratulations ADD COLUMN IF NOT EXISTS animation_enabled BOOLEAN DEFAULT false;

-- Update existing records with default values
UPDATE congratulations SET template = 'თანამედროვე მინიმალიზმი' WHERE template IS NULL;