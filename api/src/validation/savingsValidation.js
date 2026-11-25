import mongoose from 'mongoose'
import { z } from 'zod'

const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Contribution month must use YYYY-MM format')
const amount = z.number().int().positive().max(100000000)

export const savingsCreateSchema = z.object({
  memberId: z.string().refine(mongoose.isValidObjectId, 'Invalid member identifier'),
  contributionMonth: month,
  requiredAmount: amount.optional(),
  amountPaid: z.number().int().nonnegative().max(100000000).default(0),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']),
  transactionReference: z.string().trim().max(120).optional(),
  paymentDate: z.coerce.date().optional(),
  notes: z.string().trim().max(1000).optional(),
})

export const savingsRejectSchema = z.object({ reason: z.string().trim().min(3).max(500) })
export const savingsSettingsSchema = z.object({ monthlyAmount: amount })

export const savingsIdParamSchema = (id) => {
  if (!mongoose.isValidObjectId(id)) throw Object.assign(new Error('Invalid savings identifier'), { statusCode: 400 })
  return id
}
