
GRANT INSERT, UPDATE, DELETE ON public.products TO anon;
DROP POLICY IF EXISTS "products_auth_write" ON public.products;
CREATE POLICY "products_anon_insert" ON public.products FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "products_anon_update" ON public.products FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "products_anon_delete" ON public.products FOR DELETE TO anon, authenticated USING (true);
