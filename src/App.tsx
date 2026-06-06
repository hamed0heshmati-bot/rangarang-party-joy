import { Routes, Route, Link } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CartProvider } from "@/contexts/cart-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { InstallPrompt } from "@/components/install-prompt";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import Checkout from "@/pages/Checkout";
import Admin from "@/pages/Admin";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold bg-gradient-festive bg-clip-text text-transparent">۴۰۴</h1>
        <h2 className="mt-4 text-xl font-semibold">صفحه یافت نشد</h2>
        <p className="mt-2 text-sm text-muted-foreground">صفحه‌ای که دنبالش بودید پیدا نشد.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-gradient-festive px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-festive"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <SiteFooter />
        </div>
        <Toaster position="top-center" richColors />
        <InstallPrompt />
      </CartProvider>
    </QueryClientProvider>
  );
}
