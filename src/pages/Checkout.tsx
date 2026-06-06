import { Link } from "react-router-dom";
import { useState } from "react";
import { Trash2, Plus, Minus, CheckCircle2, TicketPercent } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { formatToman, isValidIranianMobile, toPersianDigits } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePageTitle } from "@/lib/use-page-title";

export default function Checkout() {
  usePageTitle("تکمیل سفارش — رنگارنگ", "تکمیل خرید و پرداخت سفارش از فروشگاه رنگارنگ");
  const { items, total, setQty, remove, clear } = useCart();

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    city: "",
    address: "",
    postal_code: "",
    notes: "",
  });
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{ amount: number; code: string } | null>(null);
  const [discountErr, setDiscountErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ orderNumber: number } | null>(null);

  const finalTotal = Math.max(0, total - (discount?.amount ?? 0));

  async function applyDiscount() {
    if (!discountCode.trim()) return;
    setDiscountErr("");
    try {
      const { data, error } = await supabase
        .from("discount_codes")
        .select("*")
        .eq("code", discountCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();
      if (error || !data) {
        setDiscount(null);
        setDiscountErr("کد تخفیف نامعتبر است");
        return;
      }
      if (data.usage_limit !== null && data.used_count >= data.usage_limit) {
        setDiscount(null);
        setDiscountErr("ظرفیت این کد تخفیف به پایان رسیده است");
        return;
      }
      const amount =
        data.type === "percent"
          ? Math.floor((total * Number(data.value)) / 100)
          : Math.min(Number(data.value), total);
      setDiscount({ amount, code: data.code });
      toast.success("کد تخفیف اعمال شد");
    } catch {
      setDiscountErr("خطا در بررسی کد");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return toast.error("سبد خرید شما خالی است");
    if (!isValidIranianMobile(form.phone))
      return toast.error("شماره موبایل معتبر نیست (مثل ۰۹۱۲۳۴۵۶۷۸۹)");
    if (form.customer_name.trim().length < 2) return toast.error("نام را وارد کنید");
    if (form.city.trim().length < 2) return toast.error("شهر را وارد کنید");
    if (form.address.trim().length < 5) return toast.error("آدرس را کامل وارد کنید");

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("place_order", {
        p_customer_name: form.customer_name,
        p_phone: form.phone,
        p_city: form.city,
        p_address: form.address,
        p_postal_code: form.postal_code || "",
        p_notes: form.notes || "",
        p_discount_code: discount?.code ?? "",
        p_items: items.map((i) => ({ product_id: i.id, quantity: i.quantity })),
      } as never);
      if (error) throw error;
      const result = data as { order_number: number; total: number };
      setSuccess({ orderNumber: result.order_number });
      clear();
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? "خطا در ثبت سفارش";
      const friendly = msg.includes("insufficient_stock")
        ? "موجودی یکی از محصولات کافی نیست"
        : msg.includes("invalid_phone")
        ? "شماره موبایل معتبر نیست"
        : msg.includes("product_not_found")
        ? "محصولی در سبد یافت نشد"
        : "خطا در ثبت سفارش";
      toast.error(friendly);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-xl">
        <div className="bg-card rounded-3xl p-10 text-center shadow-festive border border-border/50">
          <div className="w-20 h-20 mx-auto rounded-full bg-success grid place-items-center mb-5">
            <CheckCircle2 className="w-10 h-10 text-success-foreground" />
          </div>
          <h1 className="text-2xl font-black mb-3">سفارش شما با موفقیت ثبت شد!</h1>
          <p className="text-muted-foreground mb-2">شماره سفارش شما:</p>
          <p className="text-3xl font-black text-primary mb-6">#{toPersianDigits(success.orderNumber)}</p>
          <p className="text-sm text-muted-foreground leading-7 mb-6">
            به‌زودی برای هماهنگی تحویل با شما تماس می‌گیریم. از خرید شما متشکریم 🎉
          </p>
          <Link
            to="/"
            className="inline-block px-6 py-3 rounded-full bg-gradient-festive text-primary-foreground font-bold shadow-festive"
          >
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl md:text-4xl font-black mb-8">تکمیل سفارش</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <form
          onSubmit={submit}
          className="bg-card rounded-3xl p-6 shadow-card border border-border/50 order-2 lg:order-1 space-y-5"
        >
          <h2 className="text-xl font-bold mb-2">اطلاعات مشتری</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="نام و نام خانوادگی" value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} />
            <Field label="شماره موبایل" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="09xxxxxxxxx" inputMode="tel" />
            <Field label="شهر" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
            <Field label="کد پستی" value={form.postal_code} onChange={(v) => setForm({ ...form, postal_code: v })} optional />
          </div>

          <Field label="آدرس کامل" value={form.address} onChange={(v) => setForm({ ...form, address: v })} multiline />
          <Field label="توضیحات سفارش" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} optional multiline />

          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="w-full py-4 rounded-full bg-gradient-festive text-primary-foreground font-extrabold text-lg shadow-festive disabled:opacity-50 hover:scale-[1.01] transition"
          >
            {submitting ? "در حال ثبت..." : "ثبت سفارش"}
          </button>
        </form>

        <aside className="bg-card rounded-3xl p-6 shadow-card border border-border/50 h-fit lg:sticky lg:top-20 order-1 lg:order-2 space-y-4">
          <h2 className="text-xl font-bold">سبد خرید شما</h2>

          {items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">
              سبد خرید خالی است
              <div className="mt-4">
                <Link to="/products" className="text-primary font-bold">رفتن به محصولات</Link>
              </div>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-border max-h-80 overflow-auto -mx-2 px-2">
                {items.map((i) => (
                  <li key={i.id} className="py-3 flex gap-3 items-center">
                    {i.image_url && <img src={i.image_url} alt={i.name} className="w-14 h-14 rounded-xl object-cover" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold truncate">{i.name}</div>
                      <div className="text-xs text-primary font-bold mt-0.5">{formatToman(i.price * i.quantity)}</div>
                      <div className="flex items-center gap-1 mt-1.5">
                        <button type="button" onClick={() => setQty(i.id, i.quantity - 1)} className="w-6 h-6 rounded-md bg-muted grid place-items-center"><Minus className="w-3 h-3" /></button>
                        <span className="w-7 text-center text-xs font-bold">{toPersianDigits(i.quantity)}</span>
                        <button type="button" onClick={() => setQty(i.id, i.quantity + 1)} className="w-6 h-6 rounded-md bg-muted grid place-items-center"><Plus className="w-3 h-3" /></button>
                        <button type="button" onClick={() => remove(i.id)} className="mr-auto text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="pt-3 border-t border-border space-y-2">
                <label className="text-sm font-bold flex items-center gap-1.5">
                  <TicketPercent className="w-4 h-4 text-gold" /> کد تخفیف
                </label>
                <div className="flex gap-2">
                  <input
                    value={discountCode}
                    onChange={(e) => {
                      setDiscountCode(e.target.value);
                      setDiscount(null);
                      setDiscountErr("");
                    }}
                    placeholder="مثلاً RANG20"
                    className="flex-1 px-3 py-2 rounded-xl bg-muted border border-transparent focus:border-primary outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={applyDiscount}
                    className="px-4 py-2 rounded-xl bg-gradient-gold text-gold-foreground text-sm font-bold"
                  >
                    اعمال
                  </button>
                </div>
                {discountErr && <p className="text-xs text-destructive">{discountErr}</p>}
                {discount && <p className="text-xs text-success font-bold">✓ تخفیف {formatToman(discount.amount)} اعمال شد</p>}
              </div>

              <div className="pt-3 border-t border-border space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">جمع کل</span><span className="font-bold">{formatToman(total)}</span></div>
                {discount && (
                  <div className="flex justify-between text-success">
                    <span>تخفیف</span>
                    <span className="font-bold">- {formatToman(discount.amount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-bold">قابل پرداخت</span>
                  <span className="font-black text-primary">{formatToman(finalTotal)}</span>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  optional,
  multiline,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  optional?: boolean;
  multiline?: boolean;
  inputMode?: "tel" | "text";
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold mb-1.5 block">
        {label} {optional && <span className="text-xs text-muted-foreground font-normal">(اختیاری)</span>}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary outline-none text-sm resize-none"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary outline-none text-sm"
        />
      )}
    </label>
  );
}
