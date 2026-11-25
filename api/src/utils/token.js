import jwt from 'jsonwebtoken'

const issuer = process.env.JWT_ISSUER || 'localorg-api'
const audience = process.env.JWT_AUDIENCE || 'localorg-web'

export const generateAccessToken = (userId, role) => jwt.sign(
  { sub: userId, role },
  process.env.JWT_SECRET,
  { expiresIn: '15m', issuer, audience },
)

export const generateRefreshToken = (userId, sessionId) => jwt.sign(
  { sub: userId, sid: sessionId },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d', issuer, audience },
)

export const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET, { issuer, audience })
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET, { issuer, audience })
