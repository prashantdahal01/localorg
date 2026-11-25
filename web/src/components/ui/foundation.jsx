import { cn } from "cn"

export function Card({ className, children }) {
  return <section className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", className)}>{children}</section>
}

export function Badge({ className, tone = "slate", children }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    rose: "bg-rose-50 text-rose-700",
  }
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone], className)}>{children}</span>
}

export function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      {Icon && <Icon className="mb-3 size-8 text-slate-300" />}
      <h3 className="font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
    </div>
  )
}

export function DataTable({ columns, rows = [], emptyMessage = "No records available." }) {
  return rows.length ? (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-400">
          <tr>{columns.map((column) => <th className="px-5 py-3 font-semibold" key={column.key}>{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => <tr className="text-slate-600" key={row.id || index}>{columns.map((column) => <td className="px-5 py-4" key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  ) : <EmptyState title={emptyMessage} description="This area will populate when connected to LocalOrg data." />
}
