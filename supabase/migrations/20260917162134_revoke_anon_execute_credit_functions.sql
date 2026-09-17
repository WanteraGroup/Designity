/*
# Revoke EXECUTE from anon on SECURITY DEFINER functions

The credit functions (deduct_credits, refund_credits, add_credits) are SECURITY DEFINER
and should only be callable by authenticated users, not the anon role.
This prevents unauthenticated users from manipulating credit balances.
*/

REVOKE EXECUTE ON FUNCTION deduct_credits(uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION refund_credits(uuid, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION add_credits(uuid, integer, text, text) FROM anon;
