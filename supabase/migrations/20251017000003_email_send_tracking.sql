-- FIX 6: GDPR-Compliant Email Send Tracking for Monitoring Duplicates
-- Provides audit trail and analytics while respecting user privacy
--
-- GDPR Compliance Strategy:
-- 1. Store full PII for 7 days only (legitimate interest: fraud prevention & debugging)
-- 2. Automatically anonymize PII after 7 days (retain analytics capability)
-- 3. Automatic deletion after 90 days (GDPR Article 5.1.e - storage limitation)
-- 4. Implement data subject rights (access, deletion, export)
-- 5. Purpose limitation: Fraud prevention, duplicate detection, service improvement

-- Comprehensive email send tracking with privacy by design
CREATE TABLE IF NOT EXISTS public.email_send_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identifiable data (anonymized after 7 days)
    email_hash TEXT NOT NULL, -- SHA-256 hash (always stored for deduplication)
    email TEXT, -- Plain email (NULL after 7 days for privacy)
    ip_address_hash TEXT, -- SHA-256 hash of IP (always stored)
    ip_address TEXT, -- Plain IP (NULL after 7 days for privacy)

    -- Non-PII metadata (kept full retention)
    email_type TEXT NOT NULL, -- 'signup_verification', 'resend_verification', 'password_reset'
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_agent_fingerprint TEXT, -- Hashed user agent (not full string)
    request_path TEXT, -- Which endpoint triggered the email
    user_id UUID, -- References auth.users (kept for user rights)
    status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'blocked'
    error_message TEXT, -- Sanitized error (no PII)

    -- Privacy tracking
    anonymized_at TIMESTAMP WITH TIME ZONE, -- When PII was removed

    -- Metadata for duplicate tracking
    duplicate_of UUID REFERENCES public.email_send_log(id),

    CONSTRAINT check_email_type CHECK (email_type IN ('signup_verification', 'resend_verification', 'password_reset')),
    CONSTRAINT check_status CHECK (status IN ('sent', 'failed', 'blocked'))
);

-- Indexes for fast lookups (using hashes for privacy)
CREATE INDEX idx_email_send_log_hash_time ON public.email_send_log (email_hash, sent_at DESC);
CREATE INDEX idx_email_send_log_type_time ON public.email_send_log (email_type, sent_at DESC);
CREATE INDEX idx_email_send_log_user ON public.email_send_log (user_id, sent_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX idx_email_send_log_duplicate ON public.email_send_log (duplicate_of) WHERE duplicate_of IS NOT NULL;
CREATE INDEX idx_email_send_log_anonymization ON public.email_send_log (sent_at) WHERE anonymized_at IS NULL;

-- Helper function to create privacy-safe hash
CREATE OR REPLACE FUNCTION privacy_hash(input TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN encode(digest(LOWER(input), 'sha256'), 'hex');
END;
$$;

-- Helper function to sanitize error messages (remove potential PII)
CREATE OR REPLACE FUNCTION sanitize_error_message(error_msg TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    IF error_msg IS NULL THEN
        RETURN NULL;
    END IF;

    -- Remove email addresses from error messages
    error_msg := regexp_replace(error_msg, '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}', '[EMAIL_REDACTED]', 'g');

    -- Truncate to prevent excessive data storage
    IF length(error_msg) > 500 THEN
        error_msg := substring(error_msg, 1, 500) || '...';
    END IF;

    RETURN error_msg;
END;
$$;

-- GDPR-compliant function to log email sends
CREATE OR REPLACE FUNCTION log_email_send(
    p_email TEXT,
    p_type TEXT,
    p_ip_address TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'sent',
    p_error_message TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
    v_recent_duplicate UUID;
    v_email_hash TEXT;
    v_ip_hash TEXT;
    v_user_agent_fingerprint TEXT;
    v_sanitized_error TEXT;
BEGIN
    -- Create privacy hashes
    v_email_hash := privacy_hash(p_email);
    v_ip_hash := CASE WHEN p_ip_address IS NOT NULL THEN privacy_hash(p_ip_address) ELSE NULL END;
    v_user_agent_fingerprint := CASE WHEN p_user_agent IS NOT NULL THEN privacy_hash(p_user_agent) ELSE NULL END;
    v_sanitized_error := sanitize_error_message(p_error_message);

    -- Check for recent duplicate (using hash for privacy)
    SELECT id INTO v_recent_duplicate
    FROM public.email_send_log
    WHERE email_hash = v_email_hash
      AND email_type = p_type
      AND sent_at > NOW() - INTERVAL '1 minute'
      AND status = 'sent'
    ORDER BY sent_at DESC
    LIMIT 1;

    -- Insert log entry with both plain and hashed data
    -- Plain data will be automatically removed after 7 days
    INSERT INTO public.email_send_log (
        email_hash, email, ip_address_hash, ip_address,
        email_type, user_agent_fingerprint, request_path,
        user_id, status, error_message, duplicate_of
    )
    VALUES (
        v_email_hash, LOWER(p_email), v_ip_hash, p_ip_address,
        p_type, v_user_agent_fingerprint, p_request_path,
        p_user_id, p_status, v_sanitized_error, v_recent_duplicate
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- GDPR: Automatic anonymization of old records (after 7 days)
-- This preserves analytics capability while protecting privacy
CREATE OR REPLACE FUNCTION anonymize_old_email_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_anonymized_count INTEGER;
BEGIN
    -- Remove PII from records older than 7 days but keep hashes
    UPDATE public.email_send_log
    SET
        email = NULL,
        ip_address = NULL,
        anonymized_at = NOW()
    WHERE sent_at < NOW() - INTERVAL '7 days'
      AND anonymized_at IS NULL
      AND (email IS NOT NULL OR ip_address IS NOT NULL);

    GET DIAGNOSTICS v_anonymized_count = ROW_COUNT;

    RETURN v_anonymized_count;
END;
$$;

-- GDPR: Cleanup very old logs (after 90 days - full deletion)
CREATE OR REPLACE FUNCTION cleanup_old_email_logs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Delete records older than 90 days (GDPR storage limitation)
    DELETE FROM public.email_send_log
    WHERE sent_at < NOW() - INTERVAL '90 days';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$;

-- GDPR: Data subject right to access (export user's logs)
CREATE OR REPLACE FUNCTION export_user_email_logs(p_user_id UUID)
RETURNS TABLE (
    log_id UUID,
    email_type TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    was_duplicate BOOLEAN,
    anonymized BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Only allow users to export their own data or admins
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: can only export own data';
    END IF;

    RETURN QUERY
    SELECT
        id as log_id,
        esl.email_type,
        esl.sent_at,
        esl.status,
        (duplicate_of IS NOT NULL) as was_duplicate,
        (anonymized_at IS NOT NULL) as anonymized
    FROM public.email_send_log esl
    WHERE esl.user_id = p_user_id
    ORDER BY sent_at DESC;
END;
$$;

-- GDPR: Data subject right to deletion (forget me)
CREATE OR REPLACE FUNCTION delete_user_email_logs(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Only allow users to delete their own data
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Access denied: can only delete own data';
    END IF;

    -- Delete all logs for this user
    DELETE FROM public.email_send_log
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN v_deleted_count;
END;
$$;

-- View for duplicate analysis (uses hashed data for privacy)
CREATE OR REPLACE VIEW email_duplicates_analysis AS
SELECT
    -- Don't expose email directly, use hash or user_id
    CASE
        WHEN user_id IS NOT NULL THEN 'user_' || user_id::TEXT
        ELSE 'email_' || substring(email_hash, 1, 8)
    END as identifier,
    email_type,
    DATE(sent_at) as send_date,
    COUNT(*) as total_sends,
    COUNT(duplicate_of) as duplicate_count,
    ARRAY_AGG(DISTINCT request_path) FILTER (WHERE request_path IS NOT NULL) as sources,
    MIN(sent_at) as first_send,
    MAX(sent_at) as last_send,
    -- Show if data is still identifiable or anonymized
    BOOL_OR(email IS NOT NULL) as has_identifiable_data
FROM public.email_send_log
WHERE sent_at > NOW() - INTERVAL '7 days'
GROUP BY email_hash, email_type, DATE(sent_at), user_id
HAVING COUNT(*) > 1
ORDER BY total_sends DESC, send_date DESC;

-- Schedule automatic anonymization (runs daily)
-- Note: This requires pg_cron extension or manual cron job
-- For Supabase, you can create an Edge Function to call this daily
COMMENT ON FUNCTION anonymize_old_email_logs IS
    'GDPR: Anonymizes PII in email logs older than 7 days. Should be run daily via cron or Edge Function.';

COMMENT ON FUNCTION cleanup_old_email_logs IS
    'GDPR: Deletes email logs older than 90 days. Should be run weekly via cron or Edge Function.';

-- Grant permissions
GRANT EXECUTE ON FUNCTION privacy_hash(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_email_send TO anon, authenticated;
GRANT EXECUTE ON FUNCTION export_user_email_logs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_email_logs(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION anonymize_old_email_logs TO postgres;
GRANT EXECUTE ON FUNCTION cleanup_old_email_logs TO postgres;
GRANT SELECT ON email_duplicates_analysis TO authenticated;

-- Enable RLS
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

-- GDPR: Users can view their own logs (right to access)
CREATE POLICY "Users can view own email logs"
    ON public.email_send_log
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- GDPR: Users can delete their own logs (right to deletion)
-- Note: This is handled via delete_user_email_logs function for safety
CREATE POLICY "Users can delete own email logs via function"
    ON public.email_send_log
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- No one can insert logs directly (only via function)
CREATE POLICY "No direct insert of email logs"
    ON public.email_send_log
    FOR INSERT
    TO public
    WITH CHECK (false);

-- No one can update logs directly (immutable audit log)
CREATE POLICY "No direct update of email logs"
    ON public.email_send_log
    FOR UPDATE
    TO public
    USING (false);

-- Table and function documentation
COMMENT ON TABLE public.email_send_log IS
    'GDPR-compliant audit log of verification emails. Legal basis: Legitimate interest (fraud prevention, service security). Retention: 7 days identifiable, 90 days anonymized. Purpose: Duplicate detection, debugging, analytics. Data subject rights: Access via export_user_email_logs(), deletion via delete_user_email_logs().';

COMMENT ON COLUMN public.email_send_log.email IS
    'Plain email address. Automatically anonymized (set to NULL) after 7 days. Use email_hash for analytics.';

COMMENT ON COLUMN public.email_send_log.ip_address IS
    'Plain IP address. Automatically anonymized (set to NULL) after 7 days. Use ip_address_hash for analytics.';

COMMENT ON COLUMN public.email_send_log.email_hash IS
    'SHA-256 hash of email. Retained for 90 days for analytics and duplicate detection without storing PII.';

COMMENT ON FUNCTION log_email_send IS
    'Logs email send event with privacy by design. Stores both plain (7-day retention) and hashed data (90-day retention). Automatically sanitizes error messages and detects duplicates.';

COMMENT ON VIEW email_duplicates_analysis IS
    'Privacy-safe duplicate analysis using hashed identifiers. Shows patterns without exposing PII.';
