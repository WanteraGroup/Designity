-- Safe refund RPC used by provider-backed generation functions.
-- Credits are refunded only by trusted server-side functions.
create or replace function public.refund_credits(
  p_user_id uuid,
  p_amount integer,
  p_description text default 'Credit refund'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'Refund amount must be positive';
  end if;

  update public.profiles
  set credits = credits + p_amount,
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

revoke all on function public.refund_credits(uuid, integer, text) from public;
grant execute on function public.refund_credits(uuid, integer, text) to service_role;
