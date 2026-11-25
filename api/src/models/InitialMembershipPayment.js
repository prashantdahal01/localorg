import mongoose from 'mongoose'

export const INITIAL_PAYMENT_CATEGORY = 'INITIAL_MEMBERSHIP'
export const INITIAL_PAYMENT_METHODS = ['CASH', 'BANK_TRANSFER']
export const INITIAL_PAYMENT_STATUSES = ['PENDING', 'PAID', 'REJECTED', 'REVERSED']

const initialMembershipPaymentSchema = new mongoose.Schema({
  paymentReference: { type: String, required: true, unique: true, index: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true, unique: true, index: true },
  category: { type: String, enum: [INITIAL_PAYMENT_CATEGORY], default: INITIAL_PAYMENT_CATEGORY, immutable: true },
  requiredAmount: { type: Number, required: true, min: 1, validate: Number.isInteger },
  amountPaid: { type: Number, required: true, min: 0, validate: Number.isInteger, default: 0 },
  currency: { type: String, enum: ['NPR'], default: 'NPR' },
  paymentMethod: { type: String, enum: INITIAL_PAYMENT_METHODS, required: true },
  paymentStatus: { type: String, enum: INITIAL_PAYMENT_STATUSES, default: 'PENDING', index: true },
  paymentDate: Date,
  transactionReference: { type: String, trim: true, maxlength: 120 },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verificationDate: Date,
  rejectionReason: { type: String, trim: true, maxlength: 500 },
  reversalReason: { type: String, trim: true, maxlength: 500 },
  reversedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reversalDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

initialMembershipPaymentSchema.index({ category: 1, member: 1 }, { unique: true })
initialMembershipPaymentSchema.index({ paymentStatus: 1, category: 1 })

export default mongoose.model('InitialMembershipPayment', initialMembershipPaymentSchema)
