import { useEffect, useId } from "react"
import { X } from "lucide-react"
import { Button } from "./button"

export function Input({ label, hint, ...props }) {
  return <label className="block text-sm font-medium text-slate-700">{label && <span className="mb-2 block">{label}</span>}<input className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10" {...props} />{hint && <span className="mt-1.5 block text-xs text-slate-400">{hint}</span>}</label>
}

export function Dialog({ open, title, description, onClose, children }) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])
  if (!open) return null
  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><h2 id={titleId} className="font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div><button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X className="size-5" /></button></div><div className="mt-5">{children}</div></div></div>
}

export function Notification({ title, message, onClose }) {
  return <div className="flex items-start gap-3 rounded-xl border border-teal-100 bg-white p-4 shadow-lg"><div className="mt-0.5 size-2 rounded-full bg-teal-500" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-900">{title}</p><p className="mt-1 text-sm text-slate-500">{message}</p></div><Button size="icon-xs" variant="ghost" onClick={onClose} aria-label="Dismiss notification"><X className="size-4" /></Button></div>
}
