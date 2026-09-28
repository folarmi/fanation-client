// src/hooks/useNotify.ts
//
// The one place that knows how THIS project shows a toast: the store's
// `S.toast(message, kind)`. Everything else calls notify.success / .error /
// .info, so if the toast style ever changes it changes here only.
//
// `success` uses the "ok" kind (from your `S.toast("...", "ok")` example).
// I haven't seen the error kind, so `error` uses the default — if the store
// has an error variant, it's the one line to change below.

import { useAppStore } from "@/lib/core";

export function useNotify() {
  const S = useAppStore();
  return {
    success: (message: string) => S.toast(message, "ok"),
    error: (message: string) => S.toast(message), // TODO: pass the store's error kind here
    info: (message: string) => S.toast(message),
  };
}
