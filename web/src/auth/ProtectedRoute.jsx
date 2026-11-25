import { Navigate, Outlet, useLocation } from "react-router-dom"
import AppShell from "../components/layouts/AppShell"
import { useAuth } from "./AuthContext"

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <div className="grid min-h-screen place-items-center bg-[#f7f9fc] text-sm text-slate-500">Restoring your secure session...</div>
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (role && user.role !== role) return <Navigate to="/unauthorized" replace />
  if (user.role === "MEMBER" && user.mustChangePassword && location.pathname !== "/member/change-password") return <Navigate to="/member/change-password" replace />
  return <Outlet />
}

export function ProtectedShell({ role, children }) {
  const { user } = useAuth()
  return <AppShell member={role === "MEMBER"}>{children(user)}</AppShell>
}
