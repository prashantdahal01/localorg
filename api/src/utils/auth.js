import crypto from 'node:crypto'

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export const createOneTimeToken = () => crypto.randomBytes(32).toString('hex')

export const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/',
  maxAge,
})

export const getRequestContext = (req) => ({
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
})
