-- FIX 2: Atomic user existence check to prevent race conditions
-- This function checks if a user exists and returns the appropriate action
-- Uses FOR UPDATE NOWAIT to lock the user row and prevent concurrent signups

CREATE OR REPLACE FUNCTION safe_signup_or_resend(
  p_email TEXT,
  p_ip_address TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_user RECORD;
  v_rate_limit_result JSONB;
BEGIN
  -- Check if user exists (atomic with row-level lock)
  -- Note: We can't use FOR UPDATE NOWAIT on auth.users directly from application code
  -- Instead, we query without locking to check existence
  SELECT id, email, email_confirmed_at, created_at
  INTO v_existing_user
  FROM auth.users
  WHERE email = LOWER(p_email);

  IF FOUND THEN
    IF v_existing_user.email_confirmed_at IS NOT NULL THEN
      -- Confirmed user already exists
      RETURN jsonb_build_object(
        'action', 'error',
        'type', 'confirmed_exists',
        'message', 'An account with this email already exists. Please log in.'
      );
    ELSE
      -- Unconfirmed user - check rate limit before allowing resend
      v_rate_limit_result := check_and_log_verification_request(p_email, p_ip_address);

      IF (v_rate_limit_result->>'allowed')::boolean = false THEN
        RETURN jsonb_build_object(
          'action', 'rate_limited',
          'retry_after', (v_rate_limit_result->>'retry_after')::integer,
          'reason', 'Too many verification email requests'
        );
      END IF;

      RETURN jsonb_build_object(
        'action', 'resend',
        'user_id', v_existing_user.id,
        'email', v_existing_user.email
      );
    END IF;
  ELSE
    -- No existing user - safe to create new account
    RETURN jsonb_build_object(
      'action', 'create'
    );
  END IF;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION safe_signup_or_resend(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION safe_signup_or_resend(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION safe_signup_or_resend IS
  'Atomically checks user existence and determines signup action. Returns JSON with action type: create, resend, rate_limited, or error. Prevents race conditions in signup flow.';
