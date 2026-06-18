import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { X, Plus, RefreshCw, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Page header with action button ──────────────────────────────────────────
export function PageHeader({ title, subtitle, onRefresh, loading, action }: {
  title: string; subtitle?: string; onRefresh?: () => void; loading?: boolean;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex gap-2">
        {onRefresh && (
          <button onClick={onRefresh} className="flex items-center gap-1.5 border border-gray-200 text-gray-600 text-sm font-medium px-3 py-2 rounded-xl hover:bg-gray-50">
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        )}
        {action && (
          <button onClick={action.onClick} className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-blue-700">
            <Plus className="w-3.5 h-3.5" /> {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn("relative bg-white rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl sticky bottom-0">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Form field ───────────────────────────────────────────────────────────────
export function Field({ label, required, children, hint }: { label: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}{required && <span className="text-rose-500"> *</span>}</label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

export const inputCls = "w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400";

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cn(inputCls, "bg-white", props.className)} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputCls, props.className)} />;
}

export function SaveBtn({ onClick, saving, label = "Save" }: { onClick: () => void; saving?: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={saving} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium">
      {saving ? "Saving…" : label}
    </button>
  );
}
export function CancelBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancel</button>;
}

export function ErrorMsg({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <div className="p-3 bg-rose-50 text-rose-600 text-sm rounded-xl">{msg}</div>;
}

export function Empty({ icon, text, action }: { icon?: ReactNode; text: string; action?: { label: string; onClick: () => void } }) {
  return (
    <div className="py-16 text-center">
      {icon && <div className="flex justify-center mb-3 text-gray-200">{icon}</div>}
      <p className="text-sm text-gray-400">{text}</p>
      {action && <button onClick={action.onClick} className="mt-3 text-sm text-blue-600 hover:underline">{action.label}</button>}
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? "Search…"}
        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-400" />
    </div>
  );
}

// Generic list hook — fetcher ref keeps reload always fresh, no stale closure
export function useList<T = any>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher; // always latest, no re-subscription needed

  const reload = useCallback(() => {
    setLoading(true);
    fetcherRef.current().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []); // stable identity — safe to pass anywhere without triggering extra effects

  useEffect(() => { reload(); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, loading, reload, setData };
}
