-- Create table for tracking email verification requests (rate limiting)
CREATE TABLE IF NOT EXISTS public.email_verification_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    ip_address TEXT
);

-- Add index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_email_verification_requests_email_time
    ON public.email_verification_requests (email, requested_at DESC);

-- Create function to cleanup old records (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_verification_requests()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.email_verification_requests
    WHERE requested_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create function to check rate limit and log request
-- Returns true if request is allowed, false if rate limited
CREATE OR REPLACE FUNCTION check_and_log_verification_request(
    p_email TEXT,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_recent_count INTEGER;
    v_retry_after INTEGER;
    v_oldest_request_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Clean up old requests first
    DELETE FROM public.email_verification_requests
    WHERE requested_at < NOW() - INTERVAL '24 hours';

    -- Count recent requests for this email (last hour)
    SELECT COUNT(*)
    INTO v_recent_count
    FROM public.email_verification_requests
    WHERE email = LOWER(p_email)
    AND requested_at > NOW() - INTERVAL '1 hour';

    -- Check if rate limit exceeded (max 5 per hour)
    IF v_recent_count >= 5 THEN
        -- Calculate exact retry time: time until oldest request expires (1 hour from oldest request)
        SELECT requested_at
        INTO v_oldest_request_time
        FROM public.email_verification_requests
        WHERE email = LOWER(p_email)
        AND requested_at > NOW() - INTERVAL '1 hour'
        ORDER BY requested_at ASC
        LIMIT 1;

        -- Calculate seconds until the oldest request is 1 hour old
        v_retry_after := GREATEST(
            EXTRACT(EPOCH FROM (v_oldest_request_time + INTERVAL '1 hour' - NOW()))::INTEGER,
            60  -- Minimum 60 seconds
        );

        RETURN jsonb_build_object(
            'allowed', false,
            'reason', 'rate_limit',
            'retry_after', v_retry_after
        );
    END IF;

    -- Log the request
    INSERT INTO public.email_verification_requests (email, ip_address)
    VALUES (LOWER(p_email), p_ip_address);

    -- Request is allowed
    RETURN jsonb_build_object(
        'allowed', true
    );
END;
$$;

-- Grant EXECUTE permission on verification RPC function to anonymous users
-- This allows unauthenticated users to call the function to resend verification emails
-- The function is SECURITY DEFINER so it runs with elevated privileges regardless
GRANT EXECUTE ON FUNCTION check_and_log_verification_request(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION check_and_log_verification_request(TEXT, TEXT) TO authenticated;

-- Enable RLS
ALTER TABLE public.email_verification_requests ENABLE ROW LEVEL SECURITY;

-- No direct table access - only through the function
CREATE POLICY "No direct access to verification requests"
    ON public.email_verification_requests
    FOR ALL
    TO public
    USING (false);

COMMENT ON TABLE public.email_verification_requests IS
    'Rate limiting table for email verification resend requests. Access only via check_and_log_verification_request function.';

COMMENT ON FUNCTION check_and_log_verification_request IS
    'Checks rate limits and logs verification email requests. Returns JSON with allowed status and optional retry_after. Callable by anonymous users for email verification resend.';
