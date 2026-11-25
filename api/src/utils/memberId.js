import MemberCounter from '../models/MemberCounter.js'

export const nextMemberId = async (year = new Date().getFullYear()) => {
  const counter = await MemberCounter.findOneAndUpdate(
    { year },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  )
  return `LOC-${year}-${String(counter.sequence).padStart(4, '0')}`
}
