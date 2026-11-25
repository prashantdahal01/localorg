import test from 'node:test'
import assert from 'node:assert/strict'
import User from '../src/models/User.js'
import { getCookieOptions, hashToken } from '../src/utils/auth.js'

test('sanitized user profiles never expose password hashes', () => {
  const user = new User({
    fullName: 'Test Admin',
    email: 'ADMIN@EXAMPLE.COM',
    passwordHash: 'secret-hash',
    role: 'ADMIN',
    accountStatus: 'ACTIVE',
  })
  const profile = user.toSafeProfile()
  assert.equal(profile.email, 'admin@example.com')
  assert.equal(profile.role, 'ADMIN')
  assert.equal('passwordHash' in profile, false)
  assert.deepEqual(profile.permissions, ['*'])
})

test('authentication token hashes are deterministic and cookies are httpOnly', () => {
  assert.equal(hashToken('token'), hashToken('token'))
  assert.notEqual(hashToken('token'), 'token')
  assert.equal(getCookieOptions(1000).httpOnly, true)
  assert.equal(getCookieOptions(1000).sameSite, 'strict')
})
