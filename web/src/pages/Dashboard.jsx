import { useEffect, useState } from "react"
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, HandCoins, PiggyBank, ReceiptText, Users } from "lucide-react"
import { Card, Badge, DataTable, SectionHeading } from "../components/ui/foundation"
import AppShell from "../components/layouts/AppShell"
import { Button } from "../components/ui/button"
import API from "../api/axios"

const adminStats = [["Total members", "—", "Connect member data", Users, "teal"], ["Member savings", "—", "Placeholder only", PiggyBank, "blue"], ["Outstanding loans", "—", "Placeholder only", HandCoins, "violet"], ["Total repayments", "—", "Placeholder only", ReceiptText, "amber"]]
const memberStats = [["My savings balance", "—", "No live data yet", PiggyBank], ["Active loans", "—", "No live data yet", HandCoins], ["Repayments", "—", "No live data yet", ReceiptText]]

function StatCard({ item, member }) {
  const [label, value, note, Icon] = item
  return <Card className="p-5"><div className="flex items-start justify-between"><div className="grid size-11 place-items-center rounded-xl bg-teal-50 text-teal-600"><Icon className="size-5" /></div><ArrowUpRight className="size-4 text-slate-300" /></div><p className="mt-5 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></Card>
}

export function AdminDashboard() {
  const [summary, setSummary] = useState(null); const [initial, setInitial] = useState(null)
  useEffect(() => { Promise.all([API.get("/members/summary"), API.get("/initial-membership/summary")]).then(([members, payments]) => { setSummary(members.data.summary); setInitial(payments.data.summary) }).catch(() => { setSummary(null); setInitial(null) }) }, [])
  const memberStats = [["Total members", summary?.total ?? "—", "Live member records", Users, "teal"], ["Active members", summary?.active ?? "—", "Current membership status", Users, "green"], ["Inactive members", summary?.inactive ?? "—", "Current membership status", Users, "slate"], ["Suspended members", summary?.suspended ?? "—", "Current membership status", Users, "amber"]]
  return <AppShell><SectionHeading eyebrow="Overview" title="Good morning, administrator" description="Membership and liability figures are live." action={<Button variant="outline"><CalendarDays className="size-4" />View calendar</Button>} /><div className="mb-6 rounded-xl border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm text-teal-800"><strong>Initial membership contributions:</strong> verified receipts are member liabilities, never organizational income.</div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{memberStats.map((item) => <StatCard key={item[0]} item={item} />)}</div><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Collected", `NPR ${(initial?.totalInitialMembershipContributions || 0).toLocaleString("en-IN")}`], ["Liability", `NPR ${(initial?.totalInitialMembershipLiability || 0).toLocaleString("en-IN")}`], ["Awaiting payment", initial?.pendingInitialMembershipPayments ?? "—"], ["Rejected payments", initial?.rejectedInitialMembershipPayments ?? "—"]].map(([label, value]) => <Card className="p-5" key={label}><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div></AppShell>
}

export function MemberDashboard() {
  const [payment, setPayment] = useState(null)
  useEffect(() => { API.get("/initial-membership/me").then((response) => setPayment(response.data.payments[0] || null)).catch(() => setPayment(null)) }, [])
  return <AppShell member><SectionHeading eyebrow="Member portal" title="Your financial snapshot" description="View your initial membership contribution and account activity." /><div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800"><strong>Initial membership contribution:</strong> NPR {(payment?.requiredAmount || 0).toLocaleString("en-IN")} · {payment?.paymentStatus || "Loading"}</div><div className="grid gap-4 sm:grid-cols-3">{memberStats.map((item) => <StatCard key={item[0]} item={item} member />)}</div></AppShell>
}
