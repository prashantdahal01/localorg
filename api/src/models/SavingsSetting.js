import mongoose from 'mongoose'

const savingsSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'default' },
  monthlyAmount: { type: Number, required: true, min: 1, default: 100 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true })

export default mongoose.model('SavingsSetting', savingsSettingSchema)
