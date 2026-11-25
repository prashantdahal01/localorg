import express from 'express'
import {
  activateMemberController, changePasswordController, forgotPasswordController,
  completeActivationController, loginController, logoutController, meController, refreshController, resetPasswordController,
} from '../controllers/authController.js'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import { authRateLimiter } from '../middleware/ratelimitMiddleware.js'
import { validate } from '../middleware/validateMiddleware.js'
import { activationSchema, changePasswordSchema, completeActivationSchema, forgotPasswordSchema, loginSchema, resetPasswordSchema } from '../validation/authValidation.js'

const router = express.Router()

router.post('/login', authRateLimiter, validate(loginSchema), loginController)
router.post('/refresh', authRateLimiter, refreshController)
router.post('/logout', logoutController)
router.get('/me', authenticate, meController)
router.post('/activate-member', authenticate, requireRole('ADMIN'), validate(activationSchema), activateMemberController)
router.post('/activate', validate(completeActivationSchema), completeActivationController)
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), forgotPasswordController)
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), resetPasswordController)
router.post('/change-password', authenticate, validate(changePasswordSchema), changePasswordController)

export default router
