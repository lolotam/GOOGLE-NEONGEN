-- NeonGen AI Studio: Supabase schema for LoRA style training
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create the styles table
CREATE TABLE IF NOT EXISTS styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  style_name TEXT NOT NULL,
  style_type TEXT NOT NULL CHECK (style_type IN ('person', 'art_style', 'character')),
  trigger_word TEXT NOT NULL DEFAULT 'ohwx',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'training', 'completed', 'failed')),
  progress INT DEFAULT 0,
  lora_url TEXT,
  config_url TEXT,
  thumbnail_url TEXT,
  image_count INT DEFAULT 0,
  logs TEXT[] DEFAULT '{}',
  error_message TEXT,
  fal_request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS (Row Level Security)
ALTER TABLE styles ENABLE ROW LEVEL SECURITY;

-- 3. Open RLS policies (this app has no user auth yet)
CREATE POLICY "Anyone can read styles" ON styles FOR SELECT USING (true);
CREATE POLICY "Anyone can insert styles" ON styles FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update styles" ON styles FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete styles" ON styles FOR DELETE USING (true);

-- 4. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_styles_updated_at
  BEFORE UPDATE ON styles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Create storage bucket for training images
INSERT INTO storage.buckets (id, name, public) VALUES ('training-images', 'training-images', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS policies (public read/write for simplicity)
CREATE POLICY "Anyone can upload training images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'training-images');

CREATE POLICY "Anyone can read training images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'training-images');

CREATE POLICY "Anyone can delete training images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'training-images');
