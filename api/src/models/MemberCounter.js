import mongoose from 'mongoose'

const memberCounterSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  sequence: { type: Number, required: true, default: 0 },
})

export default mongoose.model('MemberCounter', memberCounterSchema)
