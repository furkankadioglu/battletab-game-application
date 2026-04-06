-- BattleTab v2 — Migration 002: Matches table

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mode VARCHAR(20) NOT NULL DEFAULT 'normal',
    player_count INTEGER NOT NULL DEFAULT 2,
    winner_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    map_type VARCHAR(50),
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS match_players (
    match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    elo_before INTEGER,
    elo_after INTEGER,
    is_winner BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY(match_id, user_id)
);
