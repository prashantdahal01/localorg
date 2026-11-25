import User from '../models/User.js'
import { verifyAccessToken } from '../utils/token.js'

export const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken
    if (!token) throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
    const payload = verifyAccessToken(token)
    const user = await User.findById(payload.sub)
    if (!user || user.accountStatus !== 'ACTIVE') throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
    if (user.role === 'MEMBER' && user.member) {
      const { default: Member } = await import('../models/Member.js')
      const member = await Member.findById(user.member).select('membershipStatus')
      if (!member || member.membershipStatus !== 'ACTIVE') throw Object.assign(new Error('Authentication required'), { statusCode: 401 })
      const passwordSetupRoute = ['/api/auth/me', '/api/auth/change-password'].includes(req.originalUrl.split('?')[0])
      if (user.mustChangePassword && !passwordSetupRoute) {
        throw Object.assign(new Error('Password change required'), { statusCode: 403, code: 'PASSWORD_CHANGE_REQUIRED' })
      }
    }
    req.user = user
    next()
  } catch (error) {
    if (error?.code === 'PASSWORD_CHANGE_REQUIRED') return next(error)
    next(Object.assign(new Error('Authentication required'), { statusCode: 401, cause: error }))
  }
}

export const optionalAuthenticate = async (req, res, next) => {
  try {
    if (req.cookies?.accessToken) {
      const payload = verifyAccessToken(req.cookies.accessToken)
      req.user = await User.findById(payload.sub)
    }
  } catch {
    // Optional authentication continues without a user.
  }
  next()
}

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) return next(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
  next()
}

export const requirePermission = (permission) => (req, res, next) => {
  const permissions = req.user?.role === 'ADMIN' ? ['*'] : ['profile:read', 'profile:update', 'member:read:self']
  if (!permissions.includes('*') && !permissions.includes(permission)) return next(Object.assign(new Error('Forbidden'), { statusCode: 403 }))
  next()
}

export const authMiddleware = authenticate
