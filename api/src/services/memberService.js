import mongoose from 'mongoose'
import AuditEvent from '../models/AuditEvent.js'
import Member from '../models/Member.js'
import User from '../models/User.js'
import { getRequestContext } from '../utils/auth.js'
import { nextMemberId } from '../utils/memberId.js'
import { createInitialPayment } from './initialMembershipService.js'
import { provisionMemberAccount } from './memberInvitationService.js'
import InitialMembershipPayment from '../models/InitialMembershipPayment.js'

const statuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']
const cleanOptional = (value) => value === '' ? undefined : value

const audit = (req, eventType, member, metadata = {}) =>
  AuditEvent.create({ user: req.user?._id, eventType, outcome: 'SUCCESS', metadata: { memberId: member?._id, ...metadata }, ...getRequestContext(req) })

const safeMember = (member, user = null) => ({
  id: member._id.toString(),
  memberId: member.memberId,
  fullName: member.fullName,
  email: member.email || '',
  phone: member.phone,
  joiningDate: member.joiningDate,
  membershipStatus: member.membershipStatus,
  verificationStatus: member.verificationStatus,
  verifiedBy: member.verifiedBy || null,
  verificationDate: member.verificationDate || null,
  rejectionReason: member.rejectionReason || '',
  address: member.address || '',
  dateOfBirth: member.dateOfBirth || null,
  gender: member.gender || '',
  occupation: member.occupation || '',
  emergencyContactName: member.emergencyContactName || '',
  emergencyContactPhone: member.emergencyContactPhone || '',
  profilePhoto: member.profilePhoto || '',
  notes: member.notes || '',
  account: user ? {
    id: user._id.toString(), status: user.accountStatus, emailVerified: user.emailVerified, role: user.role,
    mustChangePassword: user.mustChangePassword, invitationStatus: user.invitationStatus,
    invitationSentAt: user.invitationSentAt || null, invitationLastError: user.invitationLastError || null,
    lastLogin: user.lastLogin || null,
  } : null,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
})

export const listMembers = async ({ search = '', membershipStatus, verificationStatus, invitationStatus, accountStatus, from, to, sort = 'joiningDate', order = 'desc', page = 1, pageSize = 20 }) => {
  const filter = {}
  if (membershipStatus && statuses.includes(membershipStatus)) filter.membershipStatus = membershipStatus
  if (verificationStatus) filter.verificationStatus = verificationStatus
  if (from || to) filter.joiningDate = { ...(from ? { $gte: new Date(from) } : {}), ...(to ? { $lte: new Date(`${to}T23:59:59.999Z`) } : {}) }
  if (search.trim()) {
    const expression = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ fullName: expression }, { memberId: expression }, { phone: expression }, { email: expression }]
  }
  if (accountStatus) {
    const users = await User.find({ accountStatus }).select('member').lean()
    filter._id = { $in: users.map((user) => user.member).filter(Boolean) }
  }
  if (invitationStatus) {
    const users = await User.find({ invitationStatus }).select('member').lean()
    filter._id = { $in: users.map((user) => user.member).filter(Boolean) }
  }
  const sortFields = { name: 'fullName', memberId: 'memberId', joiningDate: 'joiningDate' }
  const safeSort = sortFields[sort] || 'joiningDate'
  const limit = Math.min(Math.max(Number(pageSize) || 20, 1), 100)
  const currentPage = Math.max(Number(page) || 1, 1)
  const [members, total] = await Promise.all([
    Member.find(filter).sort({ [safeSort]: order === 'asc' ? 1 : -1 }).skip((currentPage - 1) * limit).limit(limit).lean(),
    Member.countDocuments(filter),
  ])
  const userIds = members.map((member) => member._id)
  const users = await User.find({ member: { $in: userIds } }).select('member accountStatus emailVerified role mustChangePassword invitationStatus invitationSentAt invitationLastError').lean()
  const byMember = new Map(users.map((user) => [user.member.toString(), user]))
  return { items: members.map((member) => safeMember(member, byMember.get(member._id.toString()))), pagination: { page: currentPage, pageSize: limit, total, pages: Math.ceil(total / limit) } }
}

export const createMember = async (input, req) => {
  const normalized = { ...input, email: input.email.toLowerCase(), phone: input.phone.replace(/[^\d+]/g, ''), membershipStatus: 'INACTIVE' }
  if (await User.exists({ email: normalized.email })) throw Object.assign(new Error('An account with this email already exists'), { statusCode: 409 })
  const member = await Member.create({ ...normalized, memberId: await nextMemberId() })
  const payment = await createInitialPayment(member._id, req)
  const account = await provisionMemberAccount(member, req)
  await audit(req, 'MEMBER_REGISTERED', member)
  return { ...safeMember(member, account.user), initialPayment: payment, invitation: { status: account.user.invitationStatus, sentAt: account.user.invitationSentAt, error: account.invitation.error || null } }
}

export const getMember = async (id) => {
  const member = await Member.findById(id).lean()
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  const user = await User.findOne({ member: member._id }).select('member accountStatus emailVerified role mustChangePassword invitationStatus invitationSentAt invitationLastError lastLogin').lean()
  const payment = await InitialMembershipPayment.findOne({ member: member._id }).select('requiredAmount paymentStatus paymentMethod verificationDate verifiedBy').lean()
  return { ...safeMember(member, user), initialPayment: payment ? { requiredAmount: payment.requiredAmount, paymentStatus: payment.paymentStatus, paymentMethod: payment.paymentMethod, verificationDate: payment.verificationDate || null, verifiedBy: payment.verifiedBy || null } : null }
}

export const updateMember = async (id, input, req) => {
  const member = await Member.findById(id)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  const updates = { ...input }
  if ('email' in updates) updates.email = cleanOptional(updates.email)?.toLowerCase()
  if (updates.phone) updates.phone = updates.phone.replace(/[^\d+]/g, '')
  const allowed = ['fullName', 'phone', 'email', 'address', 'dateOfBirth', 'gender', 'occupation', 'emergencyContactName', 'emergencyContactPhone', 'profilePhoto', 'notes']
  allowed.forEach((field) => { if (!(field in updates)) delete updates[field] })
  Object.assign(member, updates)
  await member.save()
  await audit(req, 'MEMBER_UPDATED', member, { fields: Object.keys(updates) })
  return getMember(id)
}

export const updateMemberStatus = async (id, membershipStatus, req) => {
  if (!statuses.includes(membershipStatus)) throw Object.assign(new Error('Invalid membership status'), { statusCode: 400 })
  const member = await Member.findById(id)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (membershipStatus === 'ACTIVE') {
    const payment = await InitialMembershipPayment.findOne({ member: member._id })
    if (!payment || payment.paymentStatus !== 'PAID' || member.verificationStatus !== 'APPROVED') throw Object.assign(new Error('Member must be approved and payment verified before activation'), { statusCode: 409 })
  }

  const linkedUser = await User.findOne({ member: member._id }).select('role')
  if (linkedUser?.role === 'ADMIN' && membershipStatus !== 'ACTIVE') throw Object.assign(new Error('An administrator account cannot be deactivated here'), { statusCode: 409 })
  if (member.membershipStatus === membershipStatus) return getMember(id)
  member.membershipStatus = membershipStatus
  await member.save()
  if (membershipStatus === 'ACTIVE') await User.updateOne({ member: member._id }, { accountStatus: 'ACTIVE' })
  await audit(req, 'MEMBER_STATUS_CHANGED', member, { membershipStatus })
  return getMember(id)
}

export const verifyMember = async (id, action, reason, req) => {
  const member = await Member.findById(id)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  const payment = await InitialMembershipPayment.findOne({ member: member._id })
  if (action === 'APPROVE' && (!payment || payment.paymentStatus !== 'PAID')) throw Object.assign(new Error('Initial membership payment must be verified before approval'), { statusCode: 409 })
  member.verificationStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED'
  member.verifiedBy = req.user._id
  member.verificationDate = new Date()
  member.rejectionReason = action === 'REJECT' ? reason : null
  if (action === 'APPROVE') member.membershipStatus = 'ACTIVE'
  if (action === 'REJECT') member.membershipStatus = 'INACTIVE'
  await member.save()
  await audit(req, action === 'APPROVE' ? 'MEMBER_APPROVED' : 'MEMBER_REJECTED', member, { reason })
  return getMember(id)
}

export const getMemberActivity = async (id) => {
  if (!await Member.exists({ _id: id })) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  return AuditEvent.find({ 'metadata.memberId': new mongoose.Types.ObjectId(id) }).sort({ createdAt: -1 }).limit(100).select('eventType outcome createdAt user metadata').populate('user', 'fullName email').lean()
}

export const getMemberSummary = async () => {
  const rows = await Member.aggregate([{ $group: { _id: '$membershipStatus', count: { $sum: 1 } } }])
  const counts = Object.fromEntries(statuses.map((status) => [status.toLowerCase(), 0]))
  rows.forEach((row) => { counts[row._id.toLowerCase()] = row.count })
  return { total: rows.reduce((sum, row) => sum + row.count, 0), ...counts }
}
