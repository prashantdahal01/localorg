import mongoose from 'mongoose'
import { z } from 'zod'

const amount = z.number().int().positive().max(100000000)

export const initialPaymentCreateSchema = z.object({
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER']),
  amountPaid: amount,
  paymentDate: z.coerce.date().optional(),
  transactionReference: z.string().trim().max(120).optional(),
})

export const initialPaymentRejectSchema = z.object({ reason: z.string().trim().min(3).max(500) })
export const initialPaymentReverseSchema = z.object({ reason: z.string().trim().min(3).max(500) })
export const initialSettingSchema = z.object({ amount })

export const initialPaymentIdSchema = (id) => {
  if (!mongoose.isValidObjectId(id)) throw Object.assign(new Error('Invalid payment identifier'), { statusCode: 400 })
  return id
}
