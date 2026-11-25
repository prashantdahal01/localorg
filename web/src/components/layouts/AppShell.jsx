import { useState } from "react"
import { NavLink, Link, useNavigate } from "react-router-dom"
import { Bell, ChevronDown, CircleUserRound, Menu, X, LogOut, LayoutDashboard, Users, PiggyBank, HandCoins, ReceiptText, WalletCards, CalendarDays, ClipboardCheck, BarChart3, Settings, Landmark } from "lucide-react"
import { Button } from "../ui/button"
import { cn } from "cn"
import { useAuth } from "../../auth/AuthContext"

const adminNav = [
  ["Dashboard", "/", LayoutDashboard],
  ["Members", "/members", Users],
  ["Member accounts", "/member-accounts", Users],
  ["Savings", "/savings", PiggyBank],
  ["Initial payments", "/initial-membership", ReceiptText],
  ["Loans", "/loans", HandCoins],
  ["Repayments", "/repayments", ReceiptText],
  ["Accounting", "/accounting", WalletCards],
  ["Expenses", "/expenses", Landmark],
  ["Meetings", "/meetings", CalendarDays],
  ["Attendance", "/attendance", ClipboardCheck],
  ["Reports", "/reports", BarChart3],
]

const memberNav = [
  ["Dashboard", "/member", LayoutDashboard],
  ["My savings", "/member/savings", PiggyBank],
  ["My loans", "/member/loans", HandCoins],
  ["Repayments", "/member/repayments", ReceiptText],
  ["Transactions", "/member/transactions", WalletCards],
  ["Meetings", "/member/meetings", CalendarDays],
]

export default function AppShell({ children, member = false }) {
  const [open, setOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const nav = member ? memberNav : adminNav
  const navigate = useNavigate()
  const { logout } = useAuth()
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
      <aside className={cn("fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-slate-200 bg-white transition-transform lg:translate-x-0", open && "translate-x-0")}>
        <div className="flex h-full flex-col">
          <div className="flex h-20 items-center justify-between border-b border-slate-100 px-6">
            <Link to={member ? "/member" : "/"} className="flex items-center gap-3" onClick={() => setOpen(false)}>
              <span className="grid size-10 place-items-center rounded-xl bg-teal-600 text-white"><Landmark className="size-5" /></span>
              <span><strong className="block text-lg tracking-tight">LocalOrg</strong><small className="text-xs text-slate-400">{member ? "Member portal" : "Admin console"}</small></span>
            </Link>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation"><X className="size-5" /></button>
          </div>
          <nav className="flex-1 space-y-1 overflow-y-auto p-4">
            <p className="mb-3 px-3 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{member ? "Your workspace" : "Workspace"}</p>
            {nav.map(([label, href, Icon]) => <NavLink key={href} to={href} end={href === "/" || href === "/member"} onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition", isActive ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}><Icon className="size-[18px]" />{label}</NavLink>)}
            {!member && <><p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">System</p><NavLink to="/notifications" onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", isActive ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50")}><Bell className="size-[18px]" />Notifications</NavLink><NavLink to="/settings" onClick={() => setOpen(false)} className={({ isActive }) => cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium", isActive ? "bg-teal-50 text-teal-700" : "text-slate-500 hover:bg-slate-50")}><Settings className="size-[18px]" />Settings</NavLink></>}
          </nav>
          <div className="border-t border-slate-100 p-4"><div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"><div className="grid size-9 place-items-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">{member ? "MP" : "AD"}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{member ? "Member profile" : "Admin profile"}</p><p className="truncate text-xs text-slate-400">Active account</p></div><ChevronDown className="size-4 text-slate-400" /></div></div>
        </div>
      </aside>
      {open && <button className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden" onClick={() => setOpen(false)} aria-label="Close navigation overlay" />}
      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu className="size-5" /></button>
          <div className="hidden text-sm text-slate-500 sm:block">{member ? "Welcome back to your member portal" : "Manage your organization with clarity"}</div>
          <div className="relative ml-auto flex items-center gap-2">
            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => { setNotificationsOpen((value) => !value); setProfileOpen(false) }} aria-label="Notifications" aria-expanded={notificationsOpen}><Bell className="size-5" /><span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-teal-500 ring-2 ring-white" /></button>
            <button className="flex items-center gap-2 rounded-lg p-2 text-sm font-medium hover:bg-slate-100" onClick={() => { setProfileOpen((value) => !value); setNotificationsOpen(false) }} aria-label="Open profile menu" aria-expanded={profileOpen}><CircleUserRound className="size-5 text-slate-500" /><span className="hidden sm:inline">{member ? "Member" : "Administrator"}</span><ChevronDown className="hidden size-4 text-slate-400 sm:inline" /></button>
            {notificationsOpen && <div className="absolute right-12 top-12 w-72 rounded-xl border border-slate-200 bg-white p-4 shadow-xl"><div className="flex items-center justify-between"><p className="font-semibold text-slate-900">Notifications</p><span className="text-xs text-slate-400">0 unread</span></div><p className="mt-4 text-sm text-slate-500">You are all caught up.</p></div>}
            {profileOpen && <div className="absolute right-0 top-12 w-52 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><div className="border-b border-slate-100 px-3 py-2"><p className="text-sm font-semibold">{member ? "Member profile" : "Administrator"}</p><p className="text-xs text-slate-400">Active account</p></div><button className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50"><CircleUserRound className="size-4" />Profile settings</button><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50" onClick={async () => { await logout(); navigate("/login") }}><LogOut className="size-4" />Sign out</button></div>}
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-8">{children}</main>
      </div>
    </div>
  )
}
