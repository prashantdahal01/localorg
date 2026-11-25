import mongoose from 'mongoose'

const memberSchema = new mongoose.Schema({
  memberId: { type: String, required: true, unique: true, index: true },
  fullName: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true, unique: true, index: true },
  phone: { type: String, required: true, trim: true, unique: true, index: true },
  joiningDate: { type: Date, required: true, default: Date.now, index: true },
  membershipStatus: { type: String, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED'], default: 'INACTIVE', index: true },
  verificationStatus: { type: String, enum: ['PENDING_VERIFICATION', 'APPROVED', 'REJECTED'], default: 'PENDING_VERIFICATION', index: true },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  verificationDate: { type: Date, default: null },
  rejectionReason: { type: String, trim: true, maxlength: 500, default: null },
  address: { type: String, trim: true, maxlength: 300 },
  dateOfBirth: Date,
  gender: { type: String, trim: true, maxlength: 40 },
  occupation: { type: String, trim: true, maxlength: 120 },
  emergencyContactName: { type: String, trim: true, maxlength: 120 },
  emergencyContactPhone: { type: String, trim: true, maxlength: 40 },
  profilePhoto: { type: String, trim: true, maxlength: 500 },
  notes: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true })

memberSchema.index({ fullName: 1 })

export default mongoose.model('Member', memberSchema)
