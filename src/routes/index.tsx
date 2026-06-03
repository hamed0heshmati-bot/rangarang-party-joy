import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sparkles, Gift, PartyPopper, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard, type ProductRow } from "@/components/product-card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "رنگارنگ — فروشگاه آنلاین لوازم جشن و کادو" },
      { name: "description", content: "فروشگاه آنلاین لوازم جشن، کادوهای خاص و وسایل فانتزی" },
    ],
  }),
  component: Home,
});

function Home() {
  const [featured, setFeatured] = useState<ProductRow[]>([]);
  useEffect(() => {
    supabase.from("products").select("*").eq("is_featured", true).limit(8)
      .then(({ data }) => setFeatured((data as ProductRow[]) ?? []));
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft" />
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute top-20 right-1/4 w-40 h-40 rounded-full bg-gold/30 blur-3xl" />

        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card/70 backdrop-blur border border-border/60 mb-6 shadow-card">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold">جشن را با رنگ‌های شاد آغاز کنید</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-5 bg-gradient-festive bg-clip-text text-transparent">
            رنگارنگ
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-9 mb-8">
            فروشگاه آنلاین لوازم جشن، کادوهای خاص و وسایل فانتزی
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link to="/products" className="px-7 py-3.5 rounded-full bg-gradient-festive text-primary-foreground font-bold shadow-festive hover:scale-105 transition">
              مشاهده محصولات
            </Link>
            <Link to="/checkout" className="px-7 py-3.5 rounded-full bg-card border-2 border-primary/20 font-bold hover:border-primary transition">
              سبد خرید
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-4">
        {[
          { icon: PartyPopper, t: "لوازم جشن", d: "از بادکنک تا کیک تولد" },
          { icon: Gift, t: "کادوهای خاص", d: "هدیه برای هر مناسبت" },
          { icon: Heart, t: "ارسال سریع", d: "تحویل در کمتر از ۲۴ ساعت" },
        ].map(({ icon: Icon, t, d }) => (
          <div key={t} className="p-5 rounded-3xl bg-card shadow-card border border-border/50 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-gradient-festive grid place-items-center shadow-festive">
              <Icon className="w-6 h-6 text-primary-foreground" />
            </span>
            <div>
              <h3 className="font-bold">{t}</h3>
              <p className="text-sm text-muted-foreground">{d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black mb-2">پرفروش‌ترین‌ها</h2>
            <p className="text-muted-foreground">منتخبی از بهترین محصولات فروشگاه</p>
          </div>
          <Link to="/products" className="text-sm font-bold text-primary hover:underline">مشاهده همه ←</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {featured.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
