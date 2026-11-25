import { getCookieOptions, getRequestContext } from '../utils/auth.js'
import AuditEvent from '../models/AuditEvent.js'
import {
  changePassword, completeMemberActivation, getUserById, initiateMemberActivation,
  login, requestPasswordReset, resetPassword, revokeSession, rotateSession,
} from '../services/authService.js'

const accessCookie = (res, token) => res.cookie('accessToken', token, getCookieOptions(15 * 60 * 1000))
const refreshCookie = (res, token) => res.cookie('refreshToken', token, getCookieOptions(7 * 24 * 60 * 60 * 1000))

export const loginController = async (req, res, next) => {
  try {
    const result = await login(req.body, req)
    accessCookie(res, result.accessToken)
    refreshCookie(res, result.refreshToken)
    res.json({ success: true, user: result.user, role: result.user.role })
  } catch (error) { next(error) }
}

export const refreshController = async (req, res, next) => {
  try {
    const result = await rotateSession(req.cookies?.refreshToken, req)
    accessCookie(res, result.accessToken)
    refreshCookie(res, result.refreshToken)
    res.json({ success: true, user: result.user, role: result.user.role })
  } catch (error) { next(error) }
}

export const logoutController = async (req, res, next) => {
  try {
    if (req.cookies?.refreshToken) {
      try {
        const { verifyRefreshToken } = await import('../utils/token.js')
        const payload = verifyRefreshToken(req.cookies.refreshToken)
        await revokeSession(payload.sid, payload.sub)
      } catch {
        // Logout remains successful even if the session token is expired.
      }
    }
    res.clearCookie('accessToken', { path: '/' })
    res.clearCookie('refreshToken', { path: '/' })
    await AuditEvent.create({ eventType: 'LOGOUT', outcome: 'SUCCESS', ...getRequestContext(req) })
    res.json({ success: true })
  } catch (error) { next(error) }
}

export const meController = async (req, res) => res.json({ success: true, user: req.user.toSafeProfile(), role: req.user.role })

export const activateMemberController = async (req, res, next) => {
  try {
    const result = await initiateMemberActivation(req.body, req)
    const response = { success: true, user: result.user, message: 'Activation initiated' }
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_TOKENS === 'true') response.activationToken = result.activationToken
    res.status(201).json(response)
  } catch (error) { next(error) }
}

export const completeActivationController = async (req, res, next) => {
  try { res.json({ success: true, user: await completeMemberActivation(req.body.token, req.body.password, req) }) } catch (error) { next(error) }
}

export const forgotPasswordController = async (req, res, next) => {
  try {
    const token = await requestPasswordReset(req.body.email)
    const response = { success: true, message: 'If an account exists, password reset instructions have been sent.' }
    if (token && process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_TOKENS === 'true') response.resetToken = token
    res.json(response)
  } catch (error) { next(error) }
}

export const resetPasswordController = async (req, res, next) => {
  try { await resetPassword(req.body.token, req.body.password, req); res.json({ success: true, message: 'Password reset successfully' }) } catch (error) { next(error) }
}

export const changePasswordController = async (req, res, next) => {
  try { await changePassword(req.user._id, req.body.currentPassword, req.body.password, req); res.json({ success: true, message: 'Password changed successfully' }) } catch (error) { next(error) }
}

export const getAuthenticatedUser = async (id) => getUserById(id)
