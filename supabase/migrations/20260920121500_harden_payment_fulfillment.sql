-- Harden payment fulfillment: idempotent provider events grant the exact purchased credits.
CREATE OR REPLACE FUNCTION record_payment_event(
  p_provider text,
  p_event_type text,
  p_provider_event_id text,
  p_user_id uuid,
  p_amount integer,
  p_currency text DEFAULT 'HUF',
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id uuid;
  v_payment payments%ROWTYPE;
  v_item_type text;
  v_item_id text;
  v_credits integer := 0;
  v_plan plans%ROWTYPE;
  v_custom text;
BEGIN
  INSERT INTO payment_events (
    provider, event_type, provider_event_id, user_id, amount, currency, metadata, status
  )
  VALUES (
    p_provider, p_event_type, p_provider_event_id, p_user_id, p_amount, p_currency, p_metadata, 'processed'
  )
  ON CONFLICT (provider_event_id) DO NOTHING
  RETURNING id INTO v_event_id;

  IF v_event_id IS NULL THEN
    SELECT id INTO v_event_id
    FROM payment_events
    WHERE provider_event_id = p_provider_event_id;
    RETURN v_event_id;
  END IF;

  UPDATE payment_events SET processed_at = now() WHERE id = v_event_id;

  IF p_event_type NOT IN ('payment.succeeded', 'payment.completed', 'order.paid', 'ORDER_COMPLETED') THEN
    RETURN v_event_id;
  END IF;

  SELECT *
  INTO v_payment
  FROM payments
  WHERE id = NULLIF(p_metadata->>'payment_id', '')::uuid
    AND user_id = p_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    SELECT *
    INTO v_payment
    FROM payments
    WHERE provider = p_provider
      AND provider_payment_id = p_provider_event_id
      AND user_id = p_user_id
    LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RETURN v_event_id;
  END IF;

  IF v_payment.status = 'succeeded' THEN
    RETURN v_event_id;
  END IF;

  v_item_type := COALESCE(v_payment.metadata->>'itemType', p_metadata->>'itemType', v_payment.type);
  v_item_id := COALESCE(v_payment.metadata->>'itemId', p_metadata->>'itemId');

  IF v_item_type = 'credit_package' THEN
    v_custom := substring(COALESCE(v_item_id, '') from '^custom_([0-9]+)$');

    IF v_custom IS NOT NULL THEN
      v_credits := LEAST(10000, GREATEST(1, v_custom::integer));
    ELSE
      SELECT credits INTO v_credits
      FROM credit_packages
      WHERE id = v_item_id
      LIMIT 1;

      IF v_credits IS NULL OR v_credits <= 0 THEN
        SELECT credits INTO v_credits
        FROM credit_packages
        WHERE price = v_payment.amount
        ORDER BY sort_order
        LIMIT 1;
      END IF;
    END IF;

    IF COALESCE(v_credits, 0) > 0 THEN
      PERFORM add_credits(
        p_user_id,
        v_credits,
        'purchase',
        'Payment completed: ' || COALESCE(v_item_id, 'credit package')
      );
    END IF;

  ELSIF v_item_type = 'subscription' THEN
    SELECT * INTO v_plan FROM plans WHERE id = v_item_id LIMIT 1;

    IF FOUND THEN
      INSERT INTO subscriptions (
        user_id, plan_id, status, current_period_end, provider, provider_subscription_id
      )
      VALUES (
        p_user_id,
        v_plan.id,
        'active',
        now() + interval '1 month',
        p_provider,
        p_provider_event_id
      );

      IF v_plan.credits_monthly > 0 THEN
        PERFORM add_credits(
          p_user_id,
          v_plan.credits_monthly,
          'subscription',
          'Subscription activated: ' || v_plan.name
        );
      END IF;

      UPDATE profiles
      SET plan_id = v_plan.id, updated_at = now()
      WHERE id = p_user_id;
    END IF;
  END IF;

  UPDATE payments
  SET
    status = 'succeeded',
    provider_payment_id = COALESCE(provider_payment_id, p_provider_event_id),
    metadata = COALESCE(metadata, '{}'::jsonb) || COALESCE(p_metadata, '{}'::jsonb)
  WHERE id = v_payment.id
    AND user_id = p_user_id;

  RETURN v_event_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION record_payment_event(text,text,text,uuid,integer,text,jsonb) FROM anon;
