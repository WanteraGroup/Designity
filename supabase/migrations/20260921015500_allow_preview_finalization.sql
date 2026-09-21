-- Allow the owner of a preview to transition it through
-- generated -> approved -> consumed during finalization.
ALTER TABLE public.design_previews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can update their own design previews" ON public.design_previews;
CREATE POLICY "Users can update their own design previews"
  ON public.design_previews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
