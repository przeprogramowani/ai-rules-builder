-- FIX 3: Signup request deduplication to prevent network retry duplicates
-- Tracks recent signup attempts to prevent duplicate requests within a short time window

-- Track recent signup attempts to prevent duplicates
CREATE TABLE IF NOT EXISTS public.signup_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    ip_address TEXT,
    captcha_hash TEXT, -- Hash of captcha token for dedup
    attempt_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'

    -- Index for fast lookups
    CONSTRAINT check_status CHECK (status IN ('processing', 'completed', 'failed'))
);

-- Unique constraint: same email cannot have multiple processing requests
CREATE UNIQUE INDEX unique_processing_signup
    ON public.signup_attempts (email)
    WHERE status = 'processing';

-- Index for fast lookups by email and time
CREATE INDEX idx_signup_attempts_email_time
    ON public.signup_attempts (email, attempt_at DESC);

-- Cleanup old attempts (older than 5 minutes)
CREATE OR REPLACE FUNCTION cleanup_old_signup_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.signup_attempts
    WHERE attempt_at < NOW() - INTERVAL '5 minutes';
END;
$$;

-- Function to check and log signup attempt
CREATE OR REPLACE FUNCTION check_signup_duplicate(
    p_email TEXT,
    p_ip_address TEXT,
    p_captcha_hash TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recent_attempt RECORD;
BEGIN
    -- Cleanup old attempts first
    PERFORM cleanup_old_signup_attempts();

    -- Check for recent identical attempt (within 2 minutes)
    SELECT *
    INTO v_recent_attempt
    FROM public.signup_attempts
    WHERE email = LOWER(p_email)
      AND attempt_at > NOW() - INTERVAL '2 minutes'
      AND status IN ('processing', 'completed')
    ORDER BY attempt_at DESC
    LIMIT 1;

    IF FOUND THEN
        -- Duplicate request detected
        RETURN jsonb_build_object(
            'is_duplicate', true,
            'status', v_recent_attempt.status,
            'attempted_at', v_recent_attempt.attempt_at,
            'seconds_ago', EXTRACT(EPOCH FROM (NOW() - v_recent_attempt.attempt_at))::INTEGER
        );
    END IF;

    -- Not a duplicate - log this attempt as 'processing'
    INSERT INTO public.signup_attempts (email, ip_address, captcha_hash, status)
    VALUES (LOWER(p_email), p_ip_address, p_captcha_hash, 'processing');

    RETURN jsonb_build_object(
        'is_duplicate', false,
        'allowed', true
    );
END;
$$;

-- Function to update signup attempt status
CREATE OR REPLACE FUNCTION update_signup_status(
    p_email TEXT,
    p_status TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the most recent processing attempt for this email
    UPDATE public.signup_attempts
    SET status = p_status
    WHERE id = (
        SELECT id
        FROM public.signup_attempts
        WHERE email = LOWER(p_email)
          AND status = 'processing'
          AND attempt_at > NOW() - INTERVAL '5 minutes'
        ORDER BY attempt_at DESC
        LIMIT 1
    );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_signup_duplicate(TEXT, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_signup_duplicate(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_signup_status(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION update_signup_status(TEXT, TEXT) TO authenticated;

-- Enable RLS
ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

-- No direct access policy (only through functions)
CREATE POLICY "No direct access to signup attempts"
    ON public.signup_attempts
    FOR ALL
    TO public
    USING (false);

COMMENT ON TABLE public.signup_attempts IS
    'Tracks signup attempts to prevent duplicate requests from network retries. Access only via check_signup_duplicate and update_signup_status functions.';

COMMENT ON FUNCTION check_signup_duplicate IS
    'Checks if signup request is a duplicate within 2-minute window. Returns JSON with is_duplicate status.';

COMMENT ON FUNCTION update_signup_status IS
    'Updates the status of a signup attempt. Used to mark attempts as completed or failed.';
