-- REALITY CORP: THE AI WORLD TYCOON — Initial PostgreSQL & Supabase Zero-Trust Schema
-- Migration: 20261111000001_initial_schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Player Profiles (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.player_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL CHECK (char_length(username) BETWEEN 3 AND 24 AND username ~ '^[a-zA-Z0-9_-]+$'),
  active_world_id TEXT NOT NULL DEFAULT 'apex-syndicate'
    CHECK (active_world_id IN ('apex-syndicate', 'chrono-forge', 'sovereign-island')),
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('player', 'moderator', 'admin')),
  sound_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  haptics_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT player_profiles_username_unique UNIQUE (username)
);

-- 2. Player World States (Server-Authoritative Canonical JSONB/Snapshot State)
CREATE TABLE IF NOT EXISTS public.player_world_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  world_id TEXT NOT NULL CHECK (world_id IN ('apex-syndicate', 'chrono-forge', 'sovereign-island')),
  state_version INTEGER NOT NULL DEFAULT 1 CHECK (state_version >= 1),
  last_synced_seq INTEGER NOT NULL DEFAULT 0 CHECK (last_synced_seq >= 0),
  cash JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  compute JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  data_shards JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  lifetime_earnings JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  prestige_count INTEGER NOT NULL DEFAULT 0 CHECK (prestige_count >= 0),
  equity_shares JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  buildings JSONB NOT NULL DEFAULT '{}'::jsonb,
  unlocked_research TEXT[] NOT NULL DEFAULT '{}',
  hired_managers TEXT[] NOT NULL DEFAULT '{}',
  claimed_rewards TEXT[] NOT NULL DEFAULT '{}',
  trust_status TEXT NOT NULL DEFAULT 'verified'
    CHECK (trust_status IN ('verified', 'shadow_flagged', 'suspended')),
  last_server_tick_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT player_world_states_user_world_unique UNIQUE (user_id, world_id)
);

-- 3. Immutable Economy Ledger & Idempotency Guard
CREATE TABLE IF NOT EXISTS public.economy_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  world_id TEXT NOT NULL,
  idempotency_key UUID NOT NULL,
  tx_type TEXT NOT NULL,
  seq INTEGER CHECK (seq IS NULL OR seq >= 0),
  cash_delta JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  data_delta JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT economy_tx_user_idempotency_unique UNIQUE (user_id, idempotency_key)
);

-- 4. Anti-Double-Reward Claims Ledger
CREATE TABLE IF NOT EXISTS public.reward_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  world_id TEXT NOT NULL,
  claim_type TEXT NOT NULL CHECK (claim_type IN ('mission', 'daily_challenge', 'achievement', 'event')),
  reward_id TEXT NOT NULL,
  claim_key TEXT NOT NULL,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reward_claims_user_key_unique UNIQUE (user_id, claim_key)
);

-- 5. Server-Validated Focus Timer Sessions (Atomic Completion Lock Target)
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  world_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  target_duration_sec INTEGER NOT NULL CHECK (target_duration_sec BETWEEN 300 AND 7200),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 6. Guilds & Guild Members (Phase 2 Ready Schema with Full RLS)
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 3 AND 32),
  tag TEXT NOT NULL CHECK (char_length(tag) BETWEEN 2 AND 6),
  owner_user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE RESTRICT,
  member_limit INTEGER NOT NULL DEFAULT 25 CHECK (member_limit BETWEEN 2 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT guilds_name_unique UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.guild_members (
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  member_role TEXT NOT NULL DEFAULT 'member' CHECK (member_role IN ('owner', 'officer', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guild_id, user_id),
  CONSTRAINT guild_members_single_guild_per_player UNIQUE (user_id)
);

-- 7. Anti-Cheat Safe Leaderboards (Only trust_status = 'verified' visible publicly)
CREATE TABLE IF NOT EXISTS public.leaderboard_entries (
  user_id UUID NOT NULL REFERENCES public.player_profiles(user_id) ON DELETE CASCADE,
  world_id TEXT NOT NULL,
  username TEXT NOT NULL,
  score_log10 DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (score_log10 >= 0),
  equity_shares JSONB NOT NULL DEFAULT '{"m": 0, "e": 0}'::jsonb,
  is_verified BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, world_id)
);

-- 8. Live-Ops Game Events
CREATE TABLE IF NOT EXISTS public.game_events (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  title TEXT NOT NULL,
  cash_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (cash_multiplier >= 1.0 AND cash_multiplier <= 5.0),
  data_multiplier DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (data_multiplier >= 1.0 AND data_multiplier <= 5.0),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  CHECK (ends_at > starts_at)
);

-- 9. Privacy-Preserving Telemetry (Pseudonymized Session ID, Zero Direct PII)
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  anon_session_id UUID NOT NULL,
  world_id TEXT NOT NULL,
  event_name TEXT NOT NULL CHECK (char_length(event_name) BETWEEN 1 AND 64),
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Security & Anti-Cheat Audit Anomaly Logs
CREATE TABLE IF NOT EXISTS public.audit_anomaly_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES public.player_profiles(user_id) ON DELETE SET NULL,
  world_id TEXT NOT NULL,
  anomaly_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for O(log n) & Hotpath Lookups
CREATE INDEX IF NOT EXISTS idx_world_states_user ON public.player_world_states(user_id);
CREATE INDEX IF NOT EXISTS idx_economy_tx_user_created ON public.economy_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_status ON public.focus_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_leaderboard_world_score ON public.leaderboard_entries(world_id, score_log10 DESC)
  WHERE is_verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_game_events_active ON public.game_events(world_id, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_anomalies_user ON public.audit_anomaly_logs(user_id, created_at DESC);

-- Enable Strict Row-Level Security on ALL Tables
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_world_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.economy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_anomaly_logs ENABLE ROW LEVEL SECURITY;

-- Restrictive Default Policies & Authenticated Scoping using `(SELECT auth.uid())`
CREATE POLICY player_profiles_self_select ON public.player_profiles
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY player_profiles_self_update ON public.player_profiles
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()) AND role = 'player');

CREATE POLICY world_states_self_select ON public.player_world_states
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY economy_tx_self_select ON public.economy_transactions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY reward_claims_self_select ON public.reward_claims
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY focus_sessions_self_select ON public.focus_sessions
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY guilds_auth_read ON public.guilds
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY guild_members_auth_read ON public.guild_members
  FOR SELECT TO authenticated
  USING (TRUE);

CREATE POLICY leaderboard_verified_read ON public.leaderboard_entries
  FOR SELECT TO anon, authenticated
  USING (is_verified = TRUE);

CREATE POLICY game_events_read ON public.game_events
  FOR SELECT TO anon, authenticated
  USING (TRUE);

-- Zero-Trust Lockdown on Client Direct Writes & Telemetry / Audit Tables
CREATE POLICY analytics_no_direct_client_access ON public.analytics_events
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (FALSE) WITH CHECK (FALSE);

CREATE POLICY audit_anomalies_no_client_access ON public.audit_anomaly_logs
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (FALSE) WITH CHECK (FALSE);

-- Atomic Service-Role-Only RPCs (`SECURITY DEFINER` + REVOKE PUBLIC)
CREATE OR REPLACE FUNCTION public.complete_focus_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  completed_id UUID,
  world_id TEXT,
  target_duration_sec INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.focus_sessions fs
  SET status = 'completed',
      completed_at = NOW()
  WHERE fs.id = p_session_id
    AND fs.user_id = p_user_id
    AND fs.status = 'active'
    AND fs.started_at + MAKE_INTERVAL(secs => fs.target_duration_sec) <= NOW() + INTERVAL '5 seconds'
  RETURNING fs.id, fs.world_id, fs.target_duration_sec;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_focus_session(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_focus_session(UUID, UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.cleanup_old_analytics_events(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analytics_events
  WHERE created_at < NOW() - MAKE_INTERVAL(days => retention_days);
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cleanup_old_analytics_events(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_analytics_events(INTEGER) TO service_role;

