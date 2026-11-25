import { z } from 'zod'

const password = z.string().min(10).regex(/[A-Z]/).regex(/[a-z]/).regex(/\d/)
const email = z.string().trim().toLowerCase().email()

export const loginSchema = z.object({ email, password: z.string().min(1) })
export const bootstrapSchema = z.object({ fullName: z.string().trim().min(2).max(120), email, phone: z.string().trim().optional(), password })
export const activationSchema = z.object({ memberId: z.string().min(1), email })
export const completeActivationSchema = z.object({ token: z.string().min(32), password })
export const forgotPasswordSchema = z.object({ email })
export const resetPasswordSchema = z.object({ token: z.string().min(32), password })
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1), password })
