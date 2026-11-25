import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import nodemailer from 'nodemailer'
import AuditEvent from '../models/AuditEvent.js'
import Member from '../models/Member.js'
import User from '../models/User.js'
import { getRequestContext } from '../utils/auth.js'

const PASSWORD_ROUNDS = 12
const password = () => `Lo!${crypto.randomBytes(18).toString('base64url')}9a`
const pendingPasswordHash = () => bcrypt.hash(crypto.randomBytes(32).toString('base64url'), PASSWORD_ROUNDS)
const safeMailError = (error) => String(error?.message || 'Email delivery failed').replace(/[\r\n]/g, ' ').slice(0, 300)
const audit = (req, eventType, user, metadata = {}, outcome = 'SUCCESS') => AuditEvent.create({
  user: req.user?._id || user?._id,
  eventType,
  outcome,
  metadata: { userId: user?._id, ...metadata },
  ...getRequestContext(req),
})

const fromAddress = () => process.env.SMTP_FROM_EMAIL || process.env.SMTP_FROM_ADDRESS
const mailConfigured = () => process.env.SMTP_HOST && process.env.SMTP_PORT && fromAddress()
const transporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
})

const invitationMessage = (member, temporaryPassword) => {
  const loginUrl = `${process.env.FRONTEND_URL || process.env.WEB_URL || 'http://localhost:5173'}/login`
  const subject = 'Your LocalOrg Member Account Has Been Created'
  const text = `Dear ${member.fullName},\n\nWelcome to LocalOrg!\n\nLogin ID: ${member.email}\nTemporary Password: ${temporaryPassword}\nLogin here: ${loginUrl}\n\nFor security reasons, change your temporary password immediately after your first successful login.\n\nRegards,\nLocalOrg Administration`
  const html = `<p>Dear ${member.fullName},</p><p>Welcome to LocalOrg!</p><p>Your member account has been created successfully.</p><p><strong>Login ID:</strong> ${member.email}<br><strong>Temporary Password:</strong> ${temporaryPassword}</p><p><a href="${loginUrl}">Log in to LocalOrg</a></p><p>For security reasons, change your temporary password immediately after your first successful login.</p><p>Regards,<br>LocalOrg Administration</p>`
  return { from: `"${process.env.SMTP_FROM_NAME || 'LocalOrg'}" <${fromAddress()}>`, to: member.email, subject, text, html }
}

const deliver = async (user, member, temporaryPassword, req, resent = false) => {
  user.invitationAttempts += 1
  user.invitationStatus = resent ? 'RESENT' : 'PENDING'
  user.invitationLastError = null
  await user.save()
  if (!mailConfigured()) {
    user.invitationStatus = 'FAILED'
    user.invitationLastError = 'SMTP configuration is incomplete'
    await user.save()
    await audit(req, 'MEMBER_INVITATION_FAILED', user, { reason: user.invitationLastError }, 'FAILURE')
    return { sent: false, error: user.invitationLastError }
  }
  try {
    await transporter().sendMail(invitationMessage(member, temporaryPassword))
    user.invitationStatus = resent ? 'RESENT' : 'SENT'
    user.invitationSentAt = new Date()
    await user.save()
    await audit(req, resent ? 'MEMBER_INVITATION_RESENT' : 'MEMBER_INVITATION_SENT', user)
    return { sent: true }
  } catch (error) {
    user.invitationStatus = 'FAILED'
    user.invitationLastError = safeMailError(error)
    await user.save()
    await audit(req, 'MEMBER_INVITATION_FAILED', user, { reason: user.invitationLastError }, 'FAILURE')
    return { sent: false, error: user.invitationLastError }
  }
}

export const provisionMemberAccount = async (member, req) => {
  const email = member.email.toLowerCase()
  if (await User.exists({ email })) throw Object.assign(new Error('An account with this email already exists'), { statusCode: 409 })
  const user = await User.create({
    fullName: member.fullName, email, phone: member.phone, member: member._id, role: 'MEMBER',
    accountStatus: 'PENDING', emailVerified: false, mustChangePassword: true,
    passwordHash: await pendingPasswordHash(),
    invitationStatus: 'NOT_SENT',
  })
  await audit(req, 'MEMBER_ACCOUNT_CREATED', user)
  return { user, invitation: { sent: false, pending: true } }
}

export const sendMemberInvitation = async (memberId, req) => {
  const member = await Member.findById(memberId)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (member.verificationStatus !== 'APPROVED' || member.membershipStatus !== 'ACTIVE') throw Object.assign(new Error('Member must be approved and payment verified before invitation'), { statusCode: 409 })
  const user = await User.findOne({ member: member._id }).select('+passwordHash')
  if (!user) throw Object.assign(new Error('Member has no login account'), { statusCode: 404 })
  if (user.invitationStatus === 'SENT') throw Object.assign(new Error('Invitation already sent; use resend to issue a new credential'), { statusCode: 409 })
  const temporaryPassword = password()
  user.passwordHash = await bcrypt.hash(temporaryPassword, PASSWORD_ROUNDS)
  user.mustChangePassword = true
  user.emailVerified = false
  user.accountStatus = 'ACTIVE'
  await user.save()
  return deliver(user, member, temporaryPassword, req, user.invitationStatus !== 'NOT_SENT')
}

export const resendMemberInvitation = async (memberId, req) => {
  const member = await Member.findById(memberId)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  const user = await User.findOne({ member: member._id }).select('+passwordHash')
  if (!user) throw Object.assign(new Error('Member has no login account'), { statusCode: 404 })
  const temporaryPassword = password()
  user.passwordHash = await bcrypt.hash(temporaryPassword, PASSWORD_ROUNDS)
  user.mustChangePassword = true
  user.emailVerified = false
  if (member.verificationStatus !== 'APPROVED' || member.membershipStatus !== 'ACTIVE') throw Object.assign(new Error('Member must be approved and payment verified before invitation'), { statusCode: 409 })
  user.accountStatus = 'ACTIVE'
  await user.save()
  return deliver(user, member, temporaryPassword, req, true)
}

export const updateMemberAccountStatus = async (memberId, accountStatus, req) => {
  const member = await Member.findById(memberId)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  const user = await User.findOne({ member: member._id })
  if (!user) throw Object.assign(new Error('Member has no login account'), { statusCode: 404 })
  if (accountStatus === 'ACTIVE' && member.membershipStatus !== 'ACTIVE') throw Object.assign(new Error('Member payment and activation requirements are not complete'), { statusCode: 409 })
  user.accountStatus = accountStatus
  await user.save()
  await audit(req, 'MEMBER_ACCOUNT_STATUS_CHANGED', user, { accountStatus })
  return user
}
