-- BattleTab v2 — Migration 004: Analytics tables

CREATE TABLE IF NOT EXISTS analytics_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    total_users INTEGER NOT NULL DEFAULT 0,
    new_users INTEGER NOT NULL DEFAULT 0,
    daily_active_users INTEGER NOT NULL DEFAULT 0,
    total_games_played INTEGER NOT NULL DEFAULT 0,
    bot_games INTEGER NOT NULL DEFAULT 0,
    normal_games INTEGER NOT NULL DEFAULT 0,
    ranked_games INTEGER NOT NULL DEFAULT 0,
    avg_game_duration INTEGER NOT NULL DEFAULT 0,
    total_diamonds_earned INTEGER NOT NULL DEFAULT 0,
    total_diamonds_spent INTEGER NOT NULL DEFAULT 0,
    peak_online_players INTEGER NOT NULL DEFAULT 0,
    peak_concurrent_games INTEGER NOT NULL DEFAULT 0,
    total_friend_requests INTEGER NOT NULL DEFAULT 0,
    daily_reward_claims INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_snapshot_date ON analytics_snapshots(snapshot_date);

CREATE TABLE IF NOT EXISTS error_logs (
    id SERIAL PRIMARY KEY,
    error_type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    stack TEXT,
    context JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS server_uptime (
    id SERIAL PRIMARY KEY,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    stopped_at TIMESTAMP WITH TIME ZONE,
    stop_reason VARCHAR(50)
);
