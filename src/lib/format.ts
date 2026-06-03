export const toPersianDigits = (input: string | number): string =>
  String(input).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

export const formatToman = (amount: number): string =>
  toPersianDigits(Math.round(amount).toLocaleString("en-US")) + " تومان";

export const isValidIranianMobile = (phone: string): boolean =>
  /^09\d{9}$/.test(phone.trim());
