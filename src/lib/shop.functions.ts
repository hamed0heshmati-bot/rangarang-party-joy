import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(999),
});

const OrderInputSchema = z.object({
  customer_name: z.string().trim().min(2).max(120),
  phone: z.string().regex(/^09\d{9}$/, "شماره موبایل معتبر نیست"),
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(500),
  postal_code: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(500).optional().nullable(),
  discount_code: z.string().trim().max(40).optional().nullable(),
  items: z.array(CartItemSchema).min(1).max(50),
});

export const validateDiscount = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().trim().min(1).max(40), subtotal: z.number().min(0) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("discount_codes")
      .select("*")
      .eq("code", data.code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (error || !row) return { ok: false as const, message: "کد تخفیف نامعتبر است" };
    if (row.usage_limit !== null && row.used_count >= row.usage_limit)
      return { ok: false as const, message: "ظرفیت این کد تخفیف به پایان رسیده است" };

    const discount = row.type === "percent"
      ? Math.floor((data.subtotal * Number(row.value)) / 100)
      : Math.min(Number(row.value), data.subtotal);

    return {
      ok: true as const,
      code: row.code,
      type: row.type as "percent" | "fixed",
      value: Number(row.value),
      discount_amount: discount,
      message: "کد تخفیف اعمال شد",
    };
  });

async function sendOwnerSms(text: string): Promise<void> {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const owner = process.env.OWNER_PHONE;
  if (!apiKey || !owner) {
    console.warn("[sms] KAVENEGAR_API_KEY or OWNER_PHONE missing — skipping SMS");
    return;
  }
  try {
    const url = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;
    const params = new URLSearchParams({ receptor: owner, message: text });
    const res = await fetch(`${url}?${params.toString()}`);
    if (!res.ok) console.error("[sms] kavenegar non-2xx", res.status, await res.text());
  } catch (e) {
    console.error("[sms] kavenegar failed", e);
  }
}

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator(OrderInputSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch products from DB to get authoritative prices/stock
    const ids = data.items.map((i) => i.product_id);
    const { data: products, error: pErr } = await supabaseAdmin
      .from("products").select("id, name, price, quantity").in("id", ids);
    if (pErr || !products) throw new Error("خطا در دریافت محصولات");

    let subtotal = 0;
    const itemRows: Array<{ product_id: string; product_name: string; quantity: number; unit_price: number }> = [];
    for (const it of data.items) {
      const p = products.find((x) => x.id === it.product_id);
      if (!p) throw new Error(`محصول یافت نشد`);
      if (p.quantity < it.quantity) throw new Error(`موجودی «${p.name}» کافی نیست`);
      const unit = Number(p.price);
      subtotal += unit * it.quantity;
      itemRows.push({ product_id: p.id, product_name: p.name, quantity: it.quantity, unit_price: unit });
    }

    // Discount
    let discountAmount = 0;
    let discountCodeUsed: string | null = null;
    if (data.discount_code) {
      const { data: dc } = await supabaseAdmin
        .from("discount_codes").select("*")
        .eq("code", data.discount_code.toUpperCase())
        .eq("is_active", true).maybeSingle();
      if (dc && (dc.usage_limit === null || dc.used_count < dc.usage_limit)) {
        discountAmount = dc.type === "percent"
          ? Math.floor((subtotal * Number(dc.value)) / 100)
          : Math.min(Number(dc.value), subtotal);
        discountCodeUsed = dc.code;
        await supabaseAdmin
          .from("discount_codes").update({ used_count: dc.used_count + 1 }).eq("id", dc.id);
      }
    }
    const total = Math.max(0, subtotal - discountAmount);

    // Insert order
    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders").insert({
        customer_name: data.customer_name,
        phone: data.phone,
        city: data.city,
        address: data.address,
        postal_code: data.postal_code ?? null,
        notes: data.notes ?? null,
        total_price: total,
        discount_code: discountCodeUsed,
        discount_amount: discountAmount,
        status: "pending",
      }).select("id, order_number").single();
    if (oErr || !order) throw new Error("خطا در ثبت سفارش");

    // Insert items + decrement stock
    await supabaseAdmin.from("order_items").insert(
      itemRows.map((r) => ({ order_id: order.id, ...r }))
    );
    for (const it of data.items) {
      const p = products.find((x) => x.id === it.product_id)!;
      await supabaseAdmin.from("products").update({ quantity: p.quantity - it.quantity }).eq("id", p.id);
    }

    // SMS
    const fa = (n: number) => n.toLocaleString("en-US");
    const lines = itemRows.map((r) => `- ${r.product_name} × ${r.quantity} = ${fa(r.unit_price * r.quantity)} تومان`).join("\n");
    const discountLine = discountAmount > 0 ? `\nتخفیف: ${fa(discountAmount)} تومان` : "";
    const smsText =
`🛍 سفارش جدید رنگارنگ
شماره سفارش: #${order.order_number}
مشتری: ${data.customer_name}
موبایل: ${data.phone}
محصولات:
${lines}
جمع کل: ${fa(total)} تومان${discountLine}
آدرس: ${data.city}، ${data.address}`;
    await sendOwnerSms(smsText);

    return { ok: true as const, order_number: order.order_number, total };
  });
