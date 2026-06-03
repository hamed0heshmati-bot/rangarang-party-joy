import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductRow } from "@/components/product-card";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "محصولات — رنگارنگ" },
      { name: "description", content: "همه محصولات فروشگاه رنگارنگ: لوازم جشن، کادو، تزئینات" },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const [all, setAll] = useState<ProductRow[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(0);
  const [availOnly, setAvailOnly] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").order("created_at", { ascending: false })
      .then(({ data }) => setAll((data as ProductRow[]) ?? []));
  }, []);

  const categories = useMemo(() => Array.from(new Set(all.map((p) => p.category))), [all]);
  const priceMax = useMemo(() => all.reduce((m, p) => Math.max(m, p.price), 0), [all]);

  useEffect(() => { if (maxPrice === 0 && priceMax > 0) setMaxPrice(priceMax); }, [priceMax, maxPrice]);

  const filtered = all.filter((p) =>
    (cat === "all" || p.category === cat) &&
    (!availOnly || p.quantity > 0) &&
    (maxPrice === 0 || p.price <= maxPrice) &&
    (q.trim() === "" || p.name.includes(q.trim()) || p.category.includes(q.trim()))
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">محصولات</h1>
        <p className="text-muted-foreground">همه محصولات فروشگاه را جستجو و فیلتر کنید</p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* FILTERS */}
        <aside className="bg-card rounded-3xl p-5 shadow-card border border-border/50 h-fit lg:sticky lg:top-20 space-y-5">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="جستجو..."
              className="w-full pr-10 pl-3 py-2.5 rounded-full bg-muted border border-transparent focus:border-primary outline-none text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">دسته‌بندی</label>
            <select value={cat} onChange={(e) => setCat(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary outline-none text-sm">
              <option value="all">همه دسته‌ها</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-sm font-bold mb-2 block">حداکثر قیمت</label>
            <input type="range" min={0} max={priceMax || 1000000} value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-primary" />
            <div className="text-xs text-muted-foreground mt-1">تا {maxPrice.toLocaleString("fa-IR")} تومان</div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={availOnly} onChange={(e) => setAvailOnly(e.target.checked)}
              className="w-4 h-4 accent-primary" />
            <span className="text-sm">فقط کالاهای موجود</span>
          </label>
        </aside>

        {/* GRID */}
        <div>
          <div className="mb-4 text-sm text-muted-foreground">{filtered.length.toLocaleString("fa-IR")} محصول</div>
          {filtered.length === 0 ? (
            <div className="bg-card rounded-3xl p-12 text-center text-muted-foreground border border-border/50">
              محصولی یافت نشد
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {filtered.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
