import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  stock: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "rangarang_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: Math.min(p.stock, p.quantity + qty) }
            : p
        );
      }
      return [...prev, { ...item, quantity: Math.min(item.stock, qty) }];
    });
  };

  const remove: CartCtx["remove"] = (id) =>
    setItems((prev) => prev.filter((p) => p.id !== id));

  const setQty: CartCtx["setQty"] = (id, qty) =>
    setItems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(1, Math.min(p.stock, qty)) } : p))
    );

  const clear = () => setItems([]);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
