import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Pencil, Trash2, Plus, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatToman } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "مدیریت موجودی — رنگارنگ" }, { name: "description", content: "پنل مدیریت محصولات و موجودی" }],
  }),
  component: AdminPage,
});

interface ProductRow {
  id: string; name: string; category: string; price: number;
  quantity: number; image_url: string | null; description: string | null;
  is_featured: boolean;
}

const empty = { name: "", category: "", price: 0, quantity: 0, image_url: "", description: "", is_featured: false };

function AdminPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [editing, setEditing] = useState<Partial<ProductRow> | null>(null);

  async function load() {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setRows((data as ProductRow[]) ?? []);
  }
  useEffect(() => {
    load();
    const ch = supabase.channel("products-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  async function save() {
    if (!editing) return;
    const payload = {
      name: editing.name ?? "",
      category: editing.category ?? "",
      price: Number(editing.price) || 0,
      quantity: Number(editing.quantity) || 0,
      image_url: editing.image_url || null,
      description: editing.description || null,
      is_featured: !!editing.is_featured,
    };
    if (!payload.name || !payload.category) return toast.error("نام و دسته‌بندی الزامی است");

    const { error } = editing.id
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error("خطا در ذخیره: " + error.message);
    toast.success("ذخیره شد");
    setEditing(null);
    load();
  }

  async function del(id: string) {
    if (!confirm("از حذف این محصول مطمئن هستید؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error("خطا در حذف: " + error.message);
    toast.success("حذف شد");
    load();
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2">مدیریت موجودی</h1>
          <p className="text-muted-foreground">افزودن، ویرایش و حذف محصولات</p>
        </div>
        <button onClick={() => setEditing(empty)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-festive text-primary-foreground font-bold shadow-festive">
          <Plus className="w-4 h-4" /> محصول جدید
        </button>
      </div>

      <div className="bg-card rounded-3xl shadow-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr className="text-right">
                <th className="p-3 font-bold">تصویر</th>
                <th className="p-3 font-bold">نام محصول</th>
                <th className="p-3 font-bold">دسته‌بندی</th>
                <th className="p-3 font-bold">قیمت</th>
                <th className="p-3 font-bold">موجودی</th>
                <th className="p-3 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const low = r.quantity > 0 && r.quantity < 5;
                const out = r.quantity === 0;
                return (
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      {r.image_url ? <img src={r.image_url} alt="" className="w-12 h-12 rounded-xl object-cover" /> : <div className="w-12 h-12 rounded-xl bg-muted" />}
                    </td>
                    <td className="p-3 font-bold max-w-xs">{r.name}</td>
                    <td className="p-3 text-muted-foreground">{r.category}</td>
                    <td className="p-3 font-bold text-primary whitespace-nowrap">{formatToman(r.price)}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                        out ? "bg-destructive/15 text-destructive" : low ? "bg-gold/25 text-gold-foreground" : "bg-success/15 text-success"
                      }`}>
                        {(out || low) && <AlertTriangle className="w-3 h-3" />}
                        {r.quantity.toLocaleString("fa-IR")}
                      </span>
                    </td>
                    <td className="p-3 text-left whitespace-nowrap">
                      <button onClick={() => setEditing(r)} className="p-2 rounded-lg hover:bg-muted"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => del(r.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">محصولی ثبت نشده است</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm grid place-items-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-lg shadow-festive border border-border/50 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black">{editing.id ? "ویرایش محصول" : "محصول جدید"}</h2>
            <div className="grid grid-cols-2 gap-3">
              <Input label="نام" value={editing.name ?? ""} onChange={(v) => setEditing({ ...editing, name: v })} className="col-span-2" />
              <Input label="دسته‌بندی" value={editing.category ?? ""} onChange={(v) => setEditing({ ...editing, category: v })} />
              <Input label="قیمت (تومان)" type="number" value={String(editing.price ?? 0)} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
              <Input label="موجودی" type="number" value={String(editing.quantity ?? 0)} onChange={(v) => setEditing({ ...editing, quantity: Number(v) })} />
              <Input label="آدرس تصویر" value={editing.image_url ?? ""} onChange={(v) => setEditing({ ...editing, image_url: v })} className="col-span-2" />
              <label className="col-span-2 flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editing.is_featured} onChange={(e) => setEditing({ ...editing, is_featured: e.target.checked })} className="w-4 h-4 accent-primary" />
                <span className="text-sm font-bold">محصول ویژه (در صفحه اصلی نمایش داده شود)</span>
              </label>
              <label className="col-span-2 block">
                <span className="text-sm font-bold mb-1 block">توضیحات</span>
                <textarea value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary outline-none text-sm resize-none" />
              </label>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 py-3 rounded-full bg-gradient-festive text-primary-foreground font-bold shadow-festive">ذخیره</button>
              <button onClick={() => setEditing(null)} className="px-6 py-3 rounded-full bg-muted font-bold">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", className = "" }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-bold mb-1 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-muted border border-transparent focus:border-primary outline-none text-sm" />
    </label>
  );
}
