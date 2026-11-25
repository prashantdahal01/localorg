import mongoose from 'mongoose'

const initialMembershipSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'default' },
  amount: { type: Number, required: true, min: 1, validate: Number.isInteger, default: 40000 },
  currency: { type: String, required: true, enum: ['NPR'], default: 'NPR' },
  required: { type: Boolean, default: true },
  frequency: { type: String, enum: ['ONE_TIME'], default: 'ONE_TIME' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

export default mongoose.model('InitialMembershipSetting', initialMembershipSettingSchema)
