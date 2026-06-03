import { ShoppingCart } from "lucide-react";
import { formatToman } from "@/lib/format";
import { useCart } from "@/contexts/cart-context";
import { toast } from "sonner";

export interface ProductRow {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image_url: string | null;
  description: string | null;
}

export function ProductCard({ p }: { p: ProductRow }) {
  const { add } = useCart();
  const inStock = p.quantity > 0;

  return (
    <div className="group bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-festive transition-all duration-300 hover:-translate-y-1 border border-border/50 flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gradient-soft">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground text-sm">بدون تصویر</div>
        )}
        <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold ${inStock ? "bg-success text-success-foreground" : "bg-destructive text-destructive-foreground"}`}>
          {inStock ? "موجود" : "ناموجود"}
        </span>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{p.category}</div>
          <h3 className="font-bold text-base line-clamp-2 leading-7">{p.name}</h3>
        </div>
        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-lg font-extrabold text-primary">{formatToman(p.price)}</span>
          <button
            disabled={!inStock}
            onClick={() => {
              add({ id: p.id, name: p.name, price: p.price, image_url: p.image_url, stock: p.quantity });
              toast.success("به سبد اضافه شد", { description: p.name });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-festive text-primary-foreground text-xs font-bold shadow-festive disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            افزودن به سبد
          </button>
        </div>
      </div>
    </div>
  );
}
