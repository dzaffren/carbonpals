-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    baseline_co2_monthly DECIMAL(10, 4),
    baseline_locked BOOLEAN DEFAULT FALSE,
    baseline_period_start TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Pets table
CREATE TABLE pets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    level INT DEFAULT 0,
    experience INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Expenditures table
CREATE TABLE expenditures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Carbon emissions table
CREATE TABLE carbon_emissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expenditure_id UUID NOT NULL REFERENCES expenditures(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    kg_co2e DECIMAL(10, 4) NOT NULL,
    calculation_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Badges table
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    badge_type TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB,
    UNIQUE(user_id, badge_type)
);

-- Social posts table
CREATE TABLE social_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    post_type TEXT DEFAULT 'achievement',
    metadata JSONB,
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES social_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Eco-swaps table (green actions)
CREATE TABLE eco_swaps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    swap_type TEXT NOT NULL,
    points_awarded INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard cache table (for performance)
CREATE TABLE leaderboard_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reduction_percent DECIMAL(5, 2),
    reduction_kg DECIMAL(10, 4),
    baseline_co2_monthly DECIMAL(10, 4),
    actual_co2_monthly DECIMAL(10, 4),
    badges_earned INT DEFAULT 0,
    consecutive_months_20pct INT DEFAULT 0,
    eco_swaps_count INT DEFAULT 0,
    rank INT,
    period TEXT DEFAULT 'all_time',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, period)
);

-- Row-level security policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE carbon_emissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_swaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can read all public profiles
CREATE POLICY "Users can view public profiles" ON users
    FOR SELECT USING (true);

-- Users can update own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Users can only access own data
CREATE POLICY "Users can view own pet" ON pets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own expenditures" ON expenditures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create expenditures" ON expenditures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own expenditures" ON expenditures
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own expenditures" ON expenditures
    FOR DELETE USING (auth.uid() = user_id);

-- Carbon emissions are readable by owner
CREATE POLICY "Users can view own carbon emissions" ON carbon_emissions
    FOR SELECT USING (auth.uid() = user_id);

-- Social posts are readable by all
CREATE POLICY "Anyone can view posts" ON social_posts
    FOR SELECT USING (true);

-- Users can create own posts
CREATE POLICY "Users can create posts" ON social_posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update own posts
CREATE POLICY "Users can update own posts" ON social_posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Comments are readable by all
CREATE POLICY "Anyone can view comments" ON comments
    FOR SELECT USING (true);

-- Users can create comments
CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Leaderboard is readable by all
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_cache
    FOR SELECT USING (true);

-- Users can view own eco-swaps
CREATE POLICY "Users can view own eco-swaps" ON eco_swaps
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create eco-swaps
CREATE POLICY "Users can create eco-swaps" ON eco_swaps
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Monthly finalized points table
CREATE TABLE monthly_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    year INT NOT NULL,
    month INT NOT NULL,
    baseline_co2 DECIMAL(10, 4) NOT NULL,
    actual_co2 DECIMAL(10, 4) NOT NULL,
    reduction_kg DECIMAL(10, 4) NOT NULL DEFAULT 0,
    points_earned INT NOT NULL DEFAULT 0,
    finalized_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, year, month)
);

ALTER TABLE monthly_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monthly points" ON monthly_points
    FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_monthly_points_user_id ON monthly_points(user_id);
CREATE INDEX idx_monthly_points_user_year_month ON monthly_points(user_id, year, month);
CREATE INDEX idx_expenditures_user_id ON expenditures(user_id);
CREATE INDEX idx_expenditures_created_at ON expenditures(created_at);
CREATE INDEX idx_carbon_emissions_user_id ON carbon_emissions(user_id);
CREATE INDEX idx_carbon_emissions_expenditure_id ON carbon_emissions(expenditure_id);
CREATE INDEX idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX idx_social_posts_created_at ON social_posts(created_at);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_leaderboard_period ON leaderboard_cache(period);
CREATE INDEX idx_leaderboard_rank ON leaderboard_cache(rank, period);
CREATE INDEX idx_eco_swaps_user_id ON eco_swaps(user_id);
CREATE INDEX idx_eco_swaps_created_at ON eco_swaps(created_at);
