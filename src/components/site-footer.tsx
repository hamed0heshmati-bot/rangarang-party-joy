import { Phone, MapPin, Instagram, Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-20 bg-gradient-festive text-primary-foreground">
      <div className="container mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5" />
            <span className="text-2xl font-extrabold">رنگارنگ</span>
          </div>
          <p className="text-sm opacity-90 leading-7">
            فروشگاه آنلاین لوازم جشن، کادوهای خاص و وسایل فانتزی برای رنگی‌تر کردن لحظه‌های ویژه‌ی شما.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="font-bold text-gold mb-2">تماس با ما</h3>
          <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> ۰۲۱-۱۲۳۴۵۶۷۸</p>
          <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> تهران، خیابان ولیعصر</p>
          <p className="flex items-center gap-2"><Instagram className="w-4 h-4" /> rangarang_shop@</p>
        </div>
        <div className="text-sm">
          <h3 className="font-bold text-gold mb-2">ساعات کاری</h3>
          <p>شنبه تا چهارشنبه: ۹ صبح تا ۹ شب</p>
          <p>پنجشنبه و جمعه: ۱۰ صبح تا ۱۰ شب</p>
        </div>
      </div>
      <div className="border-t border-white/15 py-4 text-center text-xs opacity-80">
        © تمامی حقوق برای فروشگاه رنگارنگ محفوظ است.
      </div>
    </footer>
  );
}
