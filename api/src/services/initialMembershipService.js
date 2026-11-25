import crypto from 'node:crypto'
import AuditEvent from '../models/AuditEvent.js'
import InitialMembershipPayment from '../models/InitialMembershipPayment.js'
import InitialMembershipSetting from '../models/InitialMembershipSetting.js'
import Member from '../models/Member.js'
import User from '../models/User.js'
import { getRequestContext } from '../utils/auth.js'

const reference = () => `INIT-${new Date().getFullYear()}-${crypto.randomBytes(6).toString('hex').toUpperCase()}`
const audit = (req, eventType, payment = null, metadata = {}) => AuditEvent.create({
  user: req.user?._id,
  eventType,
  outcome: 'SUCCESS',
  metadata: { paymentId: payment?._id, ...metadata },
  ...getRequestContext(req),
})
const safePayment = (payment) => ({
  id: payment._id.toString(),
  paymentReference: payment.paymentReference,
  category: payment.category,
  member: payment.member,
  requiredAmount: payment.requiredAmount,
  amountPaid: payment.amountPaid,
  currency: payment.currency,
  paymentMethod: payment.paymentMethod,
  paymentStatus: payment.paymentStatus,
  paymentDate: payment.paymentDate || null,
  transactionReference: payment.transactionReference || '',
  verifiedBy: payment.verifiedBy || null,
  verificationDate: payment.verificationDate || null,
  rejectionReason: payment.rejectionReason || '',
  reversalReason: payment.reversalReason || '',
  reversalDate: payment.reversalDate || null,
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt,
})

export const getInitialMembershipSetting = async () => {
  const setting = await InitialMembershipSetting.findOneAndUpdate(
    { key: 'default' },
    { $setOnInsert: { amount: 40000, currency: 'NPR', required: true, frequency: 'ONE_TIME' } },
    { new: true, upsert: true },
  ).lean()
  return { amount: setting.amount, currency: setting.currency, required: setting.required, frequency: setting.frequency, updatedAt: setting.updatedAt || null }
}

export const updateInitialMembershipSetting = async (amount, req) => {
  const setting = await InitialMembershipSetting.findOneAndUpdate(
    { key: 'default' },
    { amount, updatedBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  await audit(req, 'INITIAL_MEMBERSHIP_SETTING_UPDATED', null, { amount })
  return { amount: setting.amount, currency: setting.currency, required: setting.required, frequency: setting.frequency, updatedAt: setting.updatedAt }
}

export const createInitialPayment = async (memberId, req) => {
  const member = await Member.findById(memberId)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  if (await InitialMembershipPayment.exists({ member: member._id })) throw Object.assign(new Error('Initial membership payment already exists'), { statusCode: 409 })
  const setting = await getInitialMembershipSetting()
  const payment = await InitialMembershipPayment.create({
    paymentReference: reference(), member: member._id, requiredAmount: setting.amount,
    paymentMethod: 'CASH', amountPaid: 0, paymentStatus: 'PENDING',
    createdBy: req.user._id, updatedBy: req.user._id,
  })
  await audit(req, 'INITIAL_MEMBERSHIP_PAYMENT_CREATED', payment, { requiredAmount: payment.requiredAmount })
  return safePayment(payment)
}

export const listInitialPayments = async ({ paymentStatus, paymentMethod, search, memberId } = {}, currentMemberId = null) => {
  const filter = { category: 'INITIAL_MEMBERSHIP' }
  if (paymentStatus) filter.paymentStatus = paymentStatus
  if (paymentMethod) filter.paymentMethod = paymentMethod
  if (memberId) filter.member = memberId
  const pipeline = [{ $lookup: { from: 'members', localField: 'member', foreignField: '_id', as: 'memberData' } }, { $unwind: '$memberData' }]
  if (currentMemberId) filter.member = currentMemberId
  if (search?.trim()) {
    const expression = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filter.$or = [{ 'memberData.fullName': expression }, { 'memberData.memberId': expression }]
  }
  const rows = await InitialMembershipPayment.aggregate([...pipeline, { $match: filter }, { $sort: { createdAt: -1 } }])
  return rows.map((row) => ({ ...safePayment(row), member: { id: row.memberData._id, memberId: row.memberData.memberId, fullName: row.memberData.fullName } }))
}

export const getInitialPayment = async (id, currentMemberId = null) => {
  const payment = await InitialMembershipPayment.findById(id).populate('member', 'memberId fullName').lean()
  if (!payment || (currentMemberId && payment.member._id.toString() !== currentMemberId.toString())) throw Object.assign(new Error('Initial membership payment not found'), { statusCode: 404 })
  return safePayment(payment)
}

export const recordInitialPayment = async (id, input, req) => {
  const payment = await InitialMembershipPayment.findById(id)
  if (!payment) throw Object.assign(new Error('Initial membership payment not found'), { statusCode: 404 })
  if (payment.paymentStatus !== 'PENDING') throw Object.assign(new Error('Only pending initial payments can be recorded'), { statusCode: 409 })
  if (input.amountPaid !== payment.requiredAmount) throw Object.assign(new Error('Initial payment must equal the assigned required amount'), { statusCode: 400 })
  payment.set({ ...input, paymentStatus: 'PENDING', updatedBy: req.user._id })
  await payment.save()
  await audit(req, 'INITIAL_MEMBERSHIP_PAYMENT_RECORDED', payment)
  return safePayment(payment)
}

export const verifyInitialPayment = async (id, req) => {
  const payment = await InitialMembershipPayment.findById(id)
  if (!payment) throw Object.assign(new Error('Initial membership payment not found'), { statusCode: 404 })
  if (payment.paymentStatus !== 'PENDING') throw Object.assign(new Error('Only pending initial payments can be verified'), { statusCode: 409 })
  if (payment.amountPaid !== payment.requiredAmount) throw Object.assign(new Error('Record the full assigned amount before verification'), { statusCode: 409 })
  payment.paymentStatus = 'PAID'
  payment.amountPaid = payment.requiredAmount
  payment.verifiedBy = req.user._id
  payment.verificationDate = new Date()
  payment.updatedBy = req.user._id
  await payment.save()
  await Member.findByIdAndUpdate(payment.member, { membershipStatus: 'INACTIVE' })
  await audit(req, 'INITIAL_MEMBERSHIP_PAYMENT_VERIFIED', payment, { liabilityAmount: payment.amountPaid })
  await audit(req, 'MEMBER_ACTIVATED_AFTER_INITIAL_PAYMENT', payment)
  return safePayment(payment)
}

export const rejectInitialPayment = async (id, reason, req) => {
  const payment = await InitialMembershipPayment.findById(id)
  if (!payment) throw Object.assign(new Error('Initial membership payment not found'), { statusCode: 404 })
  if (payment.paymentStatus !== 'PENDING') throw Object.assign(new Error('Only pending initial payments can be rejected'), { statusCode: 409 })
  payment.paymentStatus = 'REJECTED'
  payment.rejectionReason = reason
  payment.verifiedBy = req.user._id
  payment.verificationDate = new Date()
  payment.updatedBy = req.user._id
  await payment.save()
  await audit(req, 'INITIAL_MEMBERSHIP_PAYMENT_REJECTED', payment, { reason })
  return safePayment(payment)
}

export const reverseInitialPayment = async (id, reason, req) => {
  const payment = await InitialMembershipPayment.findById(id)
  if (!payment) throw Object.assign(new Error('Initial membership payment not found'), { statusCode: 404 })
  if (payment.paymentStatus !== 'PAID') throw Object.assign(new Error('Only verified initial payments can be reversed'), { statusCode: 409 })
  payment.paymentStatus = 'REVERSED'
  payment.reversalReason = reason
  payment.reversedBy = req.user._id
  payment.reversalDate = new Date()
  payment.updatedBy = req.user._id
  await payment.save()
  await Member.findByIdAndUpdate(payment.member, { membershipStatus: 'INACTIVE' })
  await audit(req, 'INITIAL_MEMBERSHIP_PAYMENT_REVERSED', payment, { reason, liabilityAmount: payment.amountPaid })
  return safePayment(payment)
}

export const getInitialMembershipSummary = async () => {
  const [totals] = await InitialMembershipPayment.aggregate([{ $match: { category: 'INITIAL_MEMBERSHIP' } }, { $group: {
    _id: null,
    collected: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$amountPaid', 0] } },
    liability: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PAID'] }, '$requiredAmount', 0] } },
    pending: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'PENDING'] }, 1, 0] } },
    rejected: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'REJECTED'] }, 1, 0] } },
  } }])
  return { totalInitialMembershipContributions: totals?.collected || 0, totalInitialMembershipLiability: totals?.liability || 0, memberRelatedLiability: totals?.liability || 0, pendingInitialMembershipPayments: totals?.pending || 0, rejectedInitialMembershipPayments: totals?.rejected || 0 }
}
