import bcrypt from 'bcrypt'
import User from '../models/User.js'
import Member from '../models/Member.js'
import AuthSession from '../models/AuthSession.js'
import OneTimeToken from '../models/OneTimeToken.js'
import AuditEvent from '../models/AuditEvent.js'
import { createOneTimeToken, getRequestContext, hashToken } from '../utils/auth.js'
import { generateAccessToken, generateRefreshToken } from '../utils/token.js'

const PASSWORD_ROUNDS = 12
const LOCK_THRESHOLD = 5
const LOCK_MINUTES = 15
const genericLoginError = () => {
  const error = new Error('Invalid email or password')
  error.statusCode = 401
  return error
}

const audit = (req, eventType, outcome, user = null) =>
  AuditEvent.create({ user: user?._id || user, eventType, outcome, ...getRequestContext(req) })

const passwordIsStrong = (password) =>
  typeof password === 'string' && password.length >= 10 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password)

const createSession = async (user, req) => {
  const session = await AuthSession.create({
    user: user._id,
    refreshTokenHash: hashToken(createOneTimeToken()),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    ...getRequestContext(req),
  })
  const refreshToken = generateRefreshToken(user._id.toString(), session._id.toString())
  session.refreshTokenHash = hashToken(refreshToken)
  await session.save()
  return { accessToken: generateAccessToken(user._id.toString(), user.role), refreshToken }
}

export const bootstrapAdmin = async ({ fullName, email, phone, password }) => {
  if (!passwordIsStrong(password)) throw Object.assign(new Error('Password must be at least 10 characters and include upper, lower, and numeric characters'), { statusCode: 400 })
  if (await User.exists({ role: 'ADMIN' })) throw Object.assign(new Error('An administrator already exists'), { statusCode: 409 })
  const user = await User.create({
    fullName, email: email.toLowerCase(), phone, passwordHash: await bcrypt.hash(password, PASSWORD_ROUNDS),
    role: 'ADMIN', accountStatus: 'ACTIVE', emailVerified: true, passwordChangedAt: new Date(),
  })
  return user.toSafeProfile()
}

export const login = async (credentials, req) => {
  const user = await User.findOne({ email: credentials.email.toLowerCase() }).select('+passwordHash')
  if (!user || user.accountStatus !== 'ACTIVE' || (user.lockedUntil && user.lockedUntil > new Date())) {
    await audit(req, 'LOGIN', 'FAILURE', user)
    throw genericLoginError()
  }
  if (user.role === 'MEMBER' && user.member) {
    const member = await Member.findById(user.member).select('membershipStatus')
    if (!member || member.membershipStatus !== 'ACTIVE') {
      await audit(req, 'LOGIN', 'FAILURE', user)
      throw genericLoginError()
    }
  }
  const valid = await bcrypt.compare(credentials.password, user.passwordHash)
  if (!valid) {
    user.failedLoginAttempts += 1
    if (user.failedLoginAttempts >= LOCK_THRESHOLD) user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
    await user.save()
    await audit(req, 'LOGIN', 'FAILURE', user)
    throw genericLoginError()
  }
  user.failedLoginAttempts = 0
  user.lockedUntil = null
  user.lastLogin = new Date()
  await user.save()
  const tokens = await createSession(user, req)
  await audit(req, 'LOGIN', 'SUCCESS', user)
  return { ...tokens, user: user.toSafeProfile() }
}

export const revokeSession = async (sessionId, userId) => AuthSession.updateOne({ _id: sessionId, user: userId, revokedAt: null }, { revokedAt: new Date() })

export const rotateSession = async (refreshToken, req) => {
  const { verifyRefreshToken } = await import('../utils/token.js')
  const payload = verifyRefreshToken(refreshToken)
  const session = await AuthSession.findOne({ _id: payload.sid, user: payload.sub, refreshTokenHash: hashToken(refreshToken), revokedAt: null }).populate('user')
  if (!session) {
    const previousSession = await AuthSession.findById(payload.sid)
    if (previousSession?.revokedAt) await AuthSession.updateMany({ user: payload.sub, revokedAt: null }, { revokedAt: new Date() })
    throw Object.assign(new Error('Invalid refresh session'), { statusCode: 401 })
  }
  if (session.expiresAt <= new Date() || session.user.accountStatus !== 'ACTIVE') throw Object.assign(new Error('Invalid refresh session'), { statusCode: 401 })
  await revokeSession(session._id, session.user._id)
  const tokens = await createSession(session.user, req)
  session.replacedByHash = hashToken(tokens.refreshToken)
  await session.save()
  return { ...tokens, user: session.user.toSafeProfile() }
}

export const getUserById = async (id) => User.findById(id)

export const initiateMemberActivation = async ({ memberId, email }, req) => {
  const member = await Member.findById(memberId)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (member.membershipStatus !== 'ACTIVE') throw Object.assign(new Error('Only active members can be activated'), { statusCode: 409 })
  if (await User.exists({ member: member._id, accountStatus: { $in: ['ACTIVE', 'PENDING'] } })) throw Object.assign(new Error('Member already has an account'), { statusCode: 409 })
  const user = await User.create({ fullName: member.fullName, email: email.toLowerCase(), phone: member.phone, member: member._id, role: 'MEMBER', accountStatus: 'PENDING', emailVerified: false, passwordHash: await bcrypt.hash(createOneTimeToken(), PASSWORD_ROUNDS) })
  const activationToken = await issueToken(user, 'ACTIVATION', member._id)
  await audit(req, 'ACCOUNT_ACTIVATION', 'SUCCESS', user)
  return { user: user.toSafeProfile(), activationToken }
}

const issueToken = async (user, purpose, member = null) => {
  const rawToken = createOneTimeToken()
  await OneTimeToken.create({ user: user._id, member, tokenHash: hashToken(rawToken), purpose, expiresAt: new Date(Date.now() + 60 * 60 * 1000) })
  return rawToken
}

export const completeMemberActivation = async (token, password, req) => {
  if (!passwordIsStrong(password)) throw Object.assign(new Error('Password must be at least 10 characters and include upper, lower, and numeric characters'), { statusCode: 400 })
  const record = await OneTimeToken.findOne({ tokenHash: hashToken(token), purpose: 'ACTIVATION', usedAt: null, expiresAt: { $gt: new Date() } })
  if (!record) throw Object.assign(new Error('Invalid or expired activation token'), { statusCode: 400 })
  const user = await User.findById(record.user).select('+passwordHash')
  user.passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS)
  user.passwordChangedAt = new Date()
  user.accountStatus = 'ACTIVE'
  user.emailVerified = true
  user.mustChangePassword = false
  await user.save()
  record.usedAt = new Date()
  await record.save()
  await audit(req, 'ACCOUNT_ACTIVATION', 'SUCCESS', user)
  return user.toSafeProfile()
}

export const requestPasswordReset = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })
  if (!user) return null
  return issueToken(user, 'PASSWORD_RESET')
}

export const resetPassword = async (token, password, req) => {
  if (!passwordIsStrong(password)) throw Object.assign(new Error('Password must be at least 10 characters and include upper, lower, and numeric characters'), { statusCode: 400 })
  const record = await OneTimeToken.findOne({ tokenHash: hashToken(token), purpose: 'PASSWORD_RESET', usedAt: null, expiresAt: { $gt: new Date() } })
  if (!record) throw Object.assign(new Error('Invalid or expired reset token'), { statusCode: 400 })
  const user = await User.findById(record.user).select('+passwordHash')
  user.passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS)
  user.passwordChangedAt = new Date()
  await user.save()
  record.usedAt = new Date()
  await record.save()
  await AuthSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() })
  await audit(req, 'PASSWORD_RESET', 'SUCCESS', user)
}

export const changePassword = async (userId, currentPassword, password, req) => {
  if (!passwordIsStrong(password)) throw Object.assign(new Error('Password must be at least 10 characters and include upper, lower, and numeric characters'), { statusCode: 400 })
  const user = await User.findById(userId).select('+passwordHash')
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw Object.assign(new Error('Current password is incorrect'), { statusCode: 400 })
  if (currentPassword === password) throw Object.assign(new Error('New password must be different from the temporary password'), { statusCode: 400 })
  user.passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS)
  user.passwordChangedAt = new Date()
  user.mustChangePassword = false
  await user.save()
  await AuthSession.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() })
  await audit(req, 'PASSWORD_CHANGE', 'SUCCESS', user)
}
