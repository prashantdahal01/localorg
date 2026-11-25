import mongoose from 'mongoose'
import { z } from 'zod'

const phone = z.string().trim().min(7).max(40).regex(/^[+0-9() .-]+$/, 'Enter a valid phone number')
const optionalEmail = z.union([z.string().trim().toLowerCase().email(), z.literal('')]).optional()

export const memberCreateSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone,
  email: z.string().trim().toLowerCase().email(),
  joiningDate: z.coerce.date(),
  membershipStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']).default('INACTIVE'),
  address: z.string().trim().max(300).optional(),
  dateOfBirth: z.union([z.coerce.date(), z.literal('')]).optional(),
  gender: z.string().trim().max(40).optional(),
  occupation: z.string().trim().max(120).optional(),
  emergencyContactName: z.string().trim().max(120).optional(),
  emergencyContactPhone: z.string().trim().max(40).optional(),
  profilePhoto: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(2000).optional(),
})

export const memberUpdateSchema = memberCreateSchema.omit({ membershipStatus: true, joiningDate: true }).partial()
export const memberStatusSchema = z.object({ membershipStatus: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']) })
export const memberAccountStatusSchema = z.object({ accountStatus: z.enum(['ACTIVE', 'SUSPENDED', 'DISABLED']) })
export const memberVerificationSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().trim().max(500).optional(),
}).superRefine((value, context) => {
  if (value.action === 'REJECT' && !value.reason) context.addIssue({ code: z.ZodIssueCode.custom, path: ['reason'], message: 'Rejection reason is required' })
})

export const memberIdParamSchema = (id) => {
  if (!mongoose.isValidObjectId(id)) throw Object.assign(new Error('Invalid member identifier'), { statusCode: 400 })
  return id
}
