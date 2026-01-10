-- Allow users to read their own role (fixes chicken-and-egg problem)
CREATE POLICY "Users can view own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);