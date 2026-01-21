-- Add category column to masters table
ALTER TABLE masters ADD COLUMN category TEXT DEFAULT 'ოსტატი';

-- Update existing records to have default category
UPDATE masters SET category = 'ოსტატი' WHERE category IS NULL;