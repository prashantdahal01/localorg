import mongoose from 'mongoose'

export const USER_ROLES = ['ADMIN', 'MEMBER']
export const ACCOUNT_STATUSES = ['ACTIVE', 'PENDING', 'SUSPENDED', 'DISABLED']
export const INVITATION_STATUSES = ['NOT_SENT', 'PENDING', 'SENT', 'FAILED', 'RESENT']

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  phone: { type: String, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: USER_ROLES, required: true, default: 'MEMBER' },
  member: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  accountStatus: { type: String, enum: ACCOUNT_STATUSES, default: 'PENDING' },
  emailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date, default: null },
  passwordChangedAt: { type: Date, default: null },
  mustChangePassword: { type: Boolean, default: false },
  invitationStatus: { type: String, enum: INVITATION_STATUSES, default: 'NOT_SENT' },
  invitationSentAt: { type: Date, default: null },
  invitationLastError: { type: String, trim: true, maxlength: 300, default: null },
  invitationAttempts: { type: Number, min: 0, default: 0 },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
}, { timestamps: true })

userSchema.methods.toSafeProfile = function toSafeProfile() {
  return {
    id: this._id.toString(),
    fullName: this.fullName,
    email: this.email,
    phone: this.phone,
    role: this.role,
    member: this.member,
    accountStatus: this.accountStatus,
    emailVerified: this.emailVerified,
    mustChangePassword: this.mustChangePassword,
    invitationStatus: this.invitationStatus,
    invitationSentAt: this.invitationSentAt,
    permissions: this.role === 'ADMIN' ? ['*'] : ['profile:read', 'profile:update', 'member:read:self'],
  }
}

export default mongoose.model('User', userSchema)
