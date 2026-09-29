// src/hooks/useNotify.ts
//
// The one place that knows how THIS project shows a toast: the store's
//   toast(msg, tone?: "ok" | "err" | "", actionLabel?, action?)
// Everything else calls notify.success / .error / .info, so if the toast
// style ever changes it changes here only.
//
// (The store's toast can also carry an action button — e.g. "Undo". Nothing
// uses that yet; when something needs it, pass the label and callback as the
// 3rd and 4th arguments below.)

import { useAppStore } from "@/lib/core";

export function useNotify() {
  const S = useAppStore();
  return {
    success: (message: string) => S.toast(message, "ok"),
    error: (message: string) => S.toast(message, "err"),
    info: (message: string) => S.toast(message),
  };
}
