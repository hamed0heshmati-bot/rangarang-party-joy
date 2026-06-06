import { useEffect } from "react";

export function usePageTitle(title: string, description?: string) {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    let metaPrev: string | null = null;
    let meta: HTMLMetaElement | null = null;
    if (description) {
      meta = document.querySelector('meta[name="description"]');
      if (meta) {
        metaPrev = meta.getAttribute("content");
        meta.setAttribute("content", description);
      }
    }
    return () => {
      document.title = prev;
      if (meta && metaPrev !== null) meta.setAttribute("content", metaPrev);
    };
  }, [title, description]);
}
