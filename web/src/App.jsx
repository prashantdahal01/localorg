import { BrowserRouter, Route, Routes } from "react-router-dom"
import { AdminDashboard, MemberDashboard } from "./pages/Dashboard"
import PlaceholderPage from "./pages/PlaceholderPage"
import { ActivatePage, ChangePasswordPage, ForgotPasswordPage, LoginPage, ResetPasswordPage, UnauthorizedPage } from "./pages/auth/AuthPages"
import { AuthProvider } from "./auth/AuthContext"
import ProtectedRoute from "./auth/ProtectedRoute"
import MembersPage, { MemberAccountsPage, MemberDetailsPage } from "./pages/Members"
import SavingsPage, { MemberSavingsPage } from "./pages/Savings"
import InitialMembershipPage from "./pages/InitialMembership"

const adminPages = {
  "/members": ["Members", "Manage member profiles and membership status."],
  "/savings": ["Savings", "Review savings activity and member contributions."],
  "/loans": ["Loans", "Monitor loan records and portfolio activity."],
  "/repayments": ["Repayments", "Review repayment activity and schedules."],
  "/accounting": ["Accounting", "Keep organization accounting organized."],
  "/expenses": ["Expenses", "Track organization expenses in one place."],
  "/meetings": ["Meetings", "Plan and manage organization meetings."],
  "/attendance": ["Attendance", "Record participation at organization meetings."],
  "/reports": ["Reports", "Create clear reports from connected data."],
  "/notifications": ["Notifications", "Review important organization updates."],
  "/settings": ["Settings", "Configure your LocalOrg workspace."],
}

const memberPages = {
  "/member/savings": ["My savings", "Review your savings account activity."],
  "/member/loans": ["My loans", "Review your active loans and status."],
  "/member/repayments": ["Repayments", "Review your repayment history."],
  "/member/transactions": ["Transactions", "Review your recent account transactions."],
  "/member/meetings": ["Meetings", "See upcoming organization meetings."],
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />
    <Route path="/activate" element={<ActivatePage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
    <Route element={<ProtectedRoute role="ADMIN" />}>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/members" element={<MembersPage />} />
      <Route path="/members/:id" element={<MemberDetailsPage />} />
      <Route path="/member-accounts" element={<MemberAccountsPage />} />
      <Route path="/savings" element={<SavingsPage />} />
      <Route path="/initial-membership" element={<InitialMembershipPage />} />
      {Object.entries(adminPages).filter(([path]) => path !== "/members" && path !== "/savings").map(([path, [title, description]]) => <Route key={path} path={path} element={<PlaceholderPage title={title} description={description} />} />)}
    </Route>
    <Route element={<ProtectedRoute role="MEMBER" />}>
      <Route path="/member" element={<MemberDashboard />} />
      <Route path="/member/change-password" element={<ChangePasswordPage />} />
      <Route path="/member/savings" element={<MemberSavingsPage />} />
      {Object.entries(memberPages).filter(([path]) => path !== "/member/savings").map(([path, [title, description]]) => <Route key={path} path={path} element={<PlaceholderPage title={title} description={description} member />} />)}
    </Route>
    <Route path="*" element={<LoginPage />} />
  </Routes></BrowserRouter></AuthProvider>
}
