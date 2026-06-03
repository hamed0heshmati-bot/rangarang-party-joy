
-- Products
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price BIGINT NOT NULL CHECK (price >= 0),
  quantity INT NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  image_url TEXT,
  description TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "products_auth_write" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Orders
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number SERIAL UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  postal_code TEXT,
  notes TEXT,
  total_price BIGINT NOT NULL,
  discount_code TEXT,
  discount_amount BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT USAGE, SELECT ON SEQUENCE orders_order_number_seq TO anon, authenticated, service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_public_insert" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "orders_auth_read" ON public.orders FOR SELECT TO authenticated USING (true);

-- Order items
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price BIGINT NOT NULL
);
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_items_public_insert" ON public.order_items FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "order_items_auth_read" ON public.order_items FOR SELECT TO authenticated USING (true);

-- Discount codes
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value BIGINT NOT NULL CHECK (value > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  usage_limit INT,
  used_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.discount_codes TO anon, authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discount_codes_public_read" ON public.discount_codes FOR SELECT TO anon, authenticated USING (is_active = true);

-- Realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;

-- Seed sample data
INSERT INTO public.products (name, category, price, quantity, image_url, description, is_featured) VALUES
('بادکنک هلیومی رنگین کمان (۱۰ عددی)', 'بادکنک', 85000, 50, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600', 'بسته ۱۰ عددی بادکنک هلیومی با رنگ‌های شاد', true),
('کیک تولد فانتزی شکلاتی', 'کیک و شیرینی', 450000, 12, 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600', 'کیک خامه‌ای دو طبقه با تزئین شکلاتی', true),
('کلاه تولد چشمک زن', 'لوازم تولد', 25000, 100, 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600', 'کلاه تولد LED با باتری', false),
('جعبه کادو مخمل طلایی', 'کادو', 180000, 30, 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600', 'جعبه کادو لوکس با روبان طلایی', true),
('عروسک خرس بزرگ', 'کادو', 320000, 8, 'https://images.unsplash.com/photo-1559454403-b8fb88521f8b?w=600', 'عروسک خرس پولیشی ۸۰ سانتی', true),
('ریسه چراغ پری LED', 'تزئینات', 95000, 45, 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=600', 'ریسه ۵ متری با ۵۰ لامپ LED گرم', false),
('شمع عددی تولد', 'لوازم تولد', 15000, 200, 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600', 'شمع‌های عددی رنگی', false),
('فرفره و سوت تولد', 'لوازم تولد', 35000, 80, 'https://images.unsplash.com/photo-1567696911980-2eed69a46042?w=600', 'بسته ۲۰ عددی فرفره و سوت', false),
('گل رز قرمز (دسته ۲۰ تایی)', 'گل و کادو', 280000, 0, 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=600', 'دسته گل رز هلندی', false),
('بادکنک فویلی قلب', 'بادکنک', 45000, 60, 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600', 'بادکنک فویلی قلب قرمز', false);

INSERT INTO public.discount_codes (code, type, value, is_active, usage_limit) VALUES
('RANG20', 'percent', 20, true, 100),
('JASHN50', 'fixed', 50000, true, 50);
