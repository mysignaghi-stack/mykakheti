-- Add new fields to congratulations table for enhanced visual templates
ALTER TABLE congratulations ADD COLUMN template TEXT DEFAULT 'თანამედროვე მინიმალიზმი';
ALTER TABLE congratulations ADD COLUMN toast TEXT;
ALTER TABLE congratulations ADD COLUMN music_url TEXT;
ALTER TABLE congratulations ADD COLUMN animation_enabled BOOLEAN DEFAULT false;

-- Update existing records with default values
UPDATE congratulations SET template = 'თანამედროვე მინიმალიზმი' WHERE template IS NULL;