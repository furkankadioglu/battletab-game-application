-- BattleTab v2 — Migration 003: Daily Rewards table

CREATE TABLE IF NOT EXISTS user_daily_rewards (
    user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    streak_day INTEGER NOT NULL DEFAULT 1,
    last_claim_date DATE,
    cycle_start_date DATE,
    last_claim_ts BIGINT DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
