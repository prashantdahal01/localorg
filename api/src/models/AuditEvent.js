import mongoose from 'mongoose'

const auditEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  eventType: { type: String, required: true, index: true },
  outcome: { type: String, enum: ['SUCCESS', 'FAILURE'], required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: undefined },
  ipAddress: String,
  userAgent: String,
}, { timestamps: true })

export default mongoose.model('AuditEvent', auditEventSchema)
