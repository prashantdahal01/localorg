import { createContext, useContext, useEffect, useMemo, useState } from "react"
import API from "../api/axios"

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const restore = async () => {
    try {
      const { data } = await API.get("/auth/me")
      setUser(data.user)
    } catch {
      try {
        const { data } = await API.post("/auth/refresh")
        setUser(data.user)
      } catch {
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { restore() }, [])

  const value = useMemo(() => ({
    user,
    loading,
    async login(credentials) {
      const { data } = await API.post("/auth/login", credentials)
      setUser(data.user)
      return data.user
    },
    async logout() {
      await API.post("/auth/logout")
      setUser(null)
    },
    async refresh() {
      const { data } = await API.post("/auth/refresh")
      setUser(data.user)
      return data.user
    },
  }), [loading, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
