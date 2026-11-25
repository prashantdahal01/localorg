import mongoose from 'mongoose'

export const PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER']
export const PAYMENT_STATUSES = ['PENDING', 'PARTIALLY_PAID', 'PAID', 'REJECTED', 'CANCELLED']

const savingsContributionSchema = new mongoose.Schema({
  contributionReference: { type: String, required: true, unique: true, index: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, index: true },
  contributionMonth: { type: String, required: true, match: /^\d{4}-(0[1-9]|1[0-2])$/, index: true },
  requiredAmount: { type: Number, required: true, min: 1 },
  amountPaid: { type: Number, required: true, min: 0, default: 0 },
  outstandingAmount: { type: Number, required: true, min: 0 },
  paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  paymentStatus: { type: String, enum: PAYMENT_STATUSES, required: true, default: 'PENDING', index: true },
  transactionReference: { type: String, trim: true, maxlength: 120 },
  paymentDate: Date,
  verificationDate: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  notes: { type: String, trim: true, maxlength: 1000 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

savingsContributionSchema.index({ member: 1, contributionMonth: 1 }, { unique: true })
savingsContributionSchema.index({ contributionMonth: 1, paymentStatus: 1 })

export default mongoose.model('SavingsContribution', savingsContributionSchema)
