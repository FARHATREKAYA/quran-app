-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    font_size INTEGER DEFAULT 24,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'sepia')),
    default_translation TEXT DEFAULT 'english' CHECK (default_translation IN ('english', 'arabic')),
    show_tajweed BOOLEAN DEFAULT true,
    audio_reciter_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verse_id INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_verse_id ON bookmarks(verse_id);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for user_preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for bookmarks
CREATE POLICY "Users can view own bookmarks"
    ON bookmarks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
    ON bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
    ON bookmarks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
    ON bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookmarks_updated_at
    BEFORE UPDATE ON bookmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON bookmarks TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE user_preferences_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE bookmarks_id_seq TO authenticated;