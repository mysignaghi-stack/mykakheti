-- Add missing columns to masters table
ALTER TABLE masters ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS service_area TEXT;
ALTER TABLE masters ADD COLUMN IF NOT EXISTS price_note TEXT;
