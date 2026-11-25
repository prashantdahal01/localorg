import crypto from 'node:crypto'
import AuditEvent from '../models/AuditEvent.js'
import Member from '../models/Member.js'
import SavingsContribution from '../models/SavingsContribution.js'
import SavingsSetting from '../models/SavingsSetting.js'
import User from '../models/User.js'
import { getRequestContext } from '../utils/auth.js'

const reference = () => `SAV-${new Date().getFullYear()}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`
const audit = (req, eventType, contribution = null, metadata = {}) => AuditEvent.create({
  user: req.user?._id,
  eventType,
  outcome: 'SUCCESS',
  metadata: { contributionId: contribution?._id, ...metadata },
  ...getRequestContext(req),
})
const safeContribution = (value) => ({
  id: value._id.toString(),
  contributionReference: value.contributionReference,
  member: value.member,
  contributionMonth: value.contributionMonth,
  requiredAmount: value.requiredAmount,
  amountPaid: value.amountPaid,
  outstandingAmount: value.outstandingAmount,
  paymentMethod: value.paymentMethod,
  paymentStatus: value.paymentStatus,
  transactionReference: value.transactionReference || '',
  paymentDate: value.paymentDate || null,
  verificationDate: value.verificationDate || null,
  verifiedBy: value.verifiedBy || null,
  rejectionReason: value.rejectionReason || '',
  notes: value.notes || '',
  createdAt: value.createdAt,
  updatedAt: value.updatedAt,
})

const getSettings = async () => SavingsSetting.findOneAndUpdate(
  { key: 'default' },
  { $setOnInsert: { key: 'default', monthlyAmount: 100, updatedBy: null } },
  { new: true, upsert: true },
)

const memberForUser = async (user) => {
  if (!user?.member) throw Object.assign(new Error('Member account is not linked'), { statusCode: 403 })
  return user.member
}

export const createContribution = async (input, req) => {
  const member = await Member.findById(input.memberId)
  if (!member) throw Object.assign(new Error('Member not found'), { statusCode: 404 })
  const settings = input.requiredAmount ? null : await getSettings()
  const requiredAmount = input.requiredAmount || settings.monthlyAmount
  if (input.amountPaid > requiredAmount) throw Object.assign(new Error('Amount paid cannot exceed required amount'), { statusCode: 400 })
  const paymentStatus = input.amountPaid > 0 ? 'PARTIALLY_PAID' : 'PENDING'
  const contribution = await SavingsContribution.create({
    contributionReference: reference(),
    member: member._id,
    contributionMonth: input.contributionMonth,
    requiredAmount,
    amountPaid: input.amountPaid,
    outstandingAmount: requiredAmount - input.amountPaid,
    paymentMethod: input.paymentMethod,
    paymentStatus,
    transactionReference: input.transactionReference,
    paymentDate: input.paymentDate,
    notes: input.notes,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  })
  await audit(req, 'SAVINGS_CONTRIBUTION_CREATED', contribution, { paymentStatus, paymentMethod: contribution.paymentMethod })
  return safeContribution(contribution)
}

const contributionFilter = ({ search, month, paymentStatus, paymentMethod }) => {
  const filter = {}
  if (month) filter.contributionMonth = month
  if (paymentStatus) filter.paymentStatus = paymentStatus
  if (paymentMethod) filter.paymentMethod = paymentMethod
  if (search?.trim()) {
    const expression = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    return { ...filter, $or: [{ 'memberData.fullName': expression }, { 'memberData.memberId': expression }] }
  }
  return filter
}

const listPipeline = (params, memberId = null) => {
  const filter = contributionFilter(params)
  if (memberId) filter.member = memberId
  return [
    { $lookup: { from: 'members', localField: 'member', foreignField: '_id', as: 'memberData' } },
    { $unwind: '$memberData' },
    { $match: filter },
    { $sort: { contributionMonth: -1, createdAt: -1 } },
  ]
}

export const listContributions = async (params, memberId = null) => {
  const page = Math.max(Number(params.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(params.pageSize) || 20, 1), 100)
  const pipeline = listPipeline(params, memberId)
  const [rows, count] = await Promise.all([
    SavingsContribution.aggregate([...pipeline, { $skip: (page - 1) * pageSize }, { $limit: pageSize }]),
    SavingsContribution.aggregate([...pipeline, { $count: 'total' }]),
  ])
  return {
    items: rows.map((row) => ({ ...safeContribution(row), member: { id: row.memberData._id, memberId: row.memberData.memberId, fullName: row.memberData.fullName } })),
    pagination: { page, pageSize, total: count[0]?.total || 0, pages: Math.ceil((count[0]?.total || 0) / pageSize) },
  }
}

export const getContribution = async (id, req) => {
  const contribution = await SavingsContribution.findById(id).populate('member', 'memberId fullName').lean()
  if (!contribution) throw Object.assign(new Error('Savings contribution not found'), { statusCode: 404 })
  if (req.user.role === 'MEMBER' && contribution.member._id.toString() !== (await memberForUser(req.user)).toString()) throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
  return safeContribution(contribution)
}

export const verifyContribution = async (id, req) => {
  const contribution = await SavingsContribution.findById(id)
  if (!contribution) throw Object.assign(new Error('Savings contribution not found'), { statusCode: 404 })
  if (contribution.paymentStatus !== 'PENDING' && contribution.paymentStatus !== 'PARTIALLY_PAID') throw Object.assign(new Error('Only pending contributions can be verified'), { statusCode: 409 })
  contribution.paymentStatus = 'PAID'
  contribution.amountPaid = contribution.requiredAmount
  contribution.outstandingAmount = 0
  contribution.verificationDate = new Date()
  contribution.verifiedBy = req.user._id
  contribution.updatedBy = req.user._id
  await contribution.save()
  await audit(req, 'SAVINGS_CONTRIBUTION_VERIFIED', contribution)
  return safeContribution(contribution)
}

export const rejectContribution = async (id, reason, req) => {
  const contribution = await SavingsContribution.findById(id)
  if (!contribution) throw Object.assign(new Error('Savings contribution not found'), { statusCode: 404 })
  if (contribution.paymentStatus !== 'PENDING' && contribution.paymentStatus !== 'PARTIALLY_PAID') throw Object.assign(new Error('Only pending contributions can be rejected'), { statusCode: 409 })
  contribution.paymentStatus = 'REJECTED'
  contribution.rejectionReason = reason
  contribution.verificationDate = new Date()
  contribution.verifiedBy = req.user._id
  contribution.updatedBy = req.user._id
  await contribution.save()
  await audit(req, 'SAVINGS_CONTRIBUTION_REJECTED', contribution, { reason })
  return safeContribution(contribution)
}

export const getSummary = async (month) => {
  const match = month ? { contributionMonth: month } : {}
  const [totals] = await SavingsContribution.aggregate([{ $match: match }, { $group: {
    _id: null,
    totalLiability: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'REJECTED'] }, '$requiredAmount', 0] } },
    totalPaid: { $sum: '$amountPaid' },
    outstanding: { $sum: { $cond: [{ $ne: ['$paymentStatus', 'REJECTED'] }, '$outstandingAmount', 0] } },
    pending: { $sum: { $cond: [{ $in: ['$paymentStatus', ['PENDING', 'PARTIALLY_PAID']] }, 1, 0] } },
  } }])
  return { totalLiability: totals?.totalLiability || 0, totalPaid: totals?.totalPaid || 0, outstanding: totals?.outstanding || 0, pending: totals?.pending || 0 }
}

export const getSavingsSettings = async () => {
  const setting = await SavingsSetting.findOne({ key: 'default' }).lean()
  return { monthlyAmount: setting?.monthlyAmount || 100, updatedAt: setting?.updatedAt || null }
}

export const updateSavingsSettings = async (monthlyAmount, req) => {
  const setting = await SavingsSetting.findOneAndUpdate(
    { key: 'default' },
    { monthlyAmount, updatedBy: req.user._id },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  await audit(req, 'SAVINGS_SETTINGS_UPDATED', null, { monthlyAmount })
  return { monthlyAmount: setting.monthlyAmount, updatedAt: setting.updatedAt }
}
