import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ProductInput = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(80),
  price: z.number().int().min(0).max(1_000_000_000),
  quantity: z.number().int().min(0).max(1_000_000),
  image_url: z.string().trim().max(2000).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  is_featured: z.boolean().optional(),
});

function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD || "666";
  if (password !== expected) {
    throw new Error("رمز عبور اشتباه است");
  }
}

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1).max(200), product: ProductInput }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = {
      name: data.product.name,
      category: data.product.category,
      price: data.product.price,
      quantity: data.product.quantity,
      image_url: data.product.image_url || null,
      description: data.product.description || null,
      is_featured: !!data.product.is_featured,
    };
    if (data.product.id) {
      const { error } = await supabaseAdmin.from("products").update(payload).eq("id", data.product.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin.from("products").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true as const };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator(z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
