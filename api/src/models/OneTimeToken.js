import mongoose from 'mongoose'

const oneTimeTokenSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  tokenHash: { type: String, required: true, unique: true },
  purpose: { type: String, enum: ['ACTIVATION', 'PASSWORD_RESET'], required: true },
  expiresAt: { type: Date, required: true },
  usedAt: { type: Date, default: null },
}, { timestamps: true })

oneTimeTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('OneTimeToken', oneTimeTokenSchema)
