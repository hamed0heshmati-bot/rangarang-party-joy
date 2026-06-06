import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, Sparkles } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { toPersianDigits } from "@/lib/format";

export function SiteHeader() {
  const { count } = useCart();
  const navClass = ({ isActive }: { isActive: boolean }) =>
    `hover:text-primary transition${isActive ? " text-primary" : ""}`;

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="w-10 h-10 rounded-2xl bg-gradient-festive grid place-items-center shadow-festive group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </span>
          <span className="text-2xl font-extrabold bg-gradient-festive bg-clip-text text-transparent">رنگارنگ</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <NavLink to="/" end className={navClass}>صفحه اصلی</NavLink>
          <NavLink to="/products" className={navClass}>محصولات</NavLink>
          <NavLink to="/checkout" className={navClass}>پرداخت</NavLink>
          <NavLink to="/admin" className={navClass}>مدیریت موجودی</NavLink>
        </nav>

        <Link
          to="/checkout"
          className="relative inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-festive text-primary-foreground text-sm font-bold shadow-festive hover:scale-105 transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>سبد</span>
          {count > 0 && (
            <span className="absolute -top-1 -left-2 min-w-5 h-5 px-1 rounded-full bg-gold text-gold-foreground text-xs font-bold grid place-items-center">
              {toPersianDigits(count)}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
