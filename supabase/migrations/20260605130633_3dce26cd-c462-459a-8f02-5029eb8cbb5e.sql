
-- Products: drop anon write policies. Public read stays.
DROP POLICY IF EXISTS products_anon_insert ON public.products;
DROP POLICY IF EXISTS products_anon_update ON public.products;
DROP POLICY IF EXISTS products_anon_delete ON public.products;

-- Orders / order_items: drop broad authenticated read. Inserts via server fn (service role) still work.
DROP POLICY IF EXISTS orders_auth_read ON public.orders;
DROP POLICY IF EXISTS order_items_auth_read ON public.order_items;

-- Discount codes: drop public read. validateDiscount uses service role.
DROP POLICY IF EXISTS discount_codes_public_read ON public.discount_codes;
