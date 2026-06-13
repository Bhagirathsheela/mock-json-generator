import { useEffect } from "react";

export default function Toast({ toast, onClear }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onClear, 2600);
    return () => clearTimeout(t);
  }, [toast, onClear]);

  if (!toast) return null;
  const tone =
    toast.type === "error"
      ? "bg-red-600"
      : toast.type === "success"
      ? "bg-emerald-600"
      : "bg-slate-800";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className={`pointer-events-auto rounded-lg px-4 py-2 text-sm font-medium text-white shadow-lg ${tone}`}>
        {toast.message}
      </div>
    </div>
  );
}
