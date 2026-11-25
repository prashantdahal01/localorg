import express from 'express'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import { authRateLimiter } from '../middleware/ratelimitMiddleware.js'
import { createMemberController, getMemberController, listMembersController, memberActivityController, memberSummaryController, resendMemberInvitationController, sendMemberInvitationController, updateMemberAccountStatusController, updateMemberController, updateMemberStatusController, verifyMemberController } from '../controllers/memberController.js'

const router = express.Router()
router.use(authenticate, requireRole('ADMIN'))
router.get('/summary', memberSummaryController)
router.get('/', listMembersController)
router.post('/', createMemberController)
router.get('/:id', getMemberController)
router.patch('/:id', updateMemberController)
router.patch('/:id/status', updateMemberStatusController)
router.patch('/:id/verification', verifyMemberController)
router.post('/:id/send-invitation', authRateLimiter, sendMemberInvitationController)
router.post('/:id/resend-invitation', authRateLimiter, resendMemberInvitationController)
router.patch('/:id/account-status', updateMemberAccountStatusController)
router.get('/:id/activity', memberActivityController)
export default router
