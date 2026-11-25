import express from 'express'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import { createInitialPaymentController, createInitialRequirementController, getInitialPaymentController, initialSettingController, initialSummaryController, listInitialPaymentsController, listMyInitialPaymentsController, rejectInitialPaymentController, reverseInitialPaymentController, updateInitialSettingController, verifyInitialPaymentController } from '../controllers/initialMembershipController.js'

const router = express.Router()
router.use(authenticate)
router.get('/me', requireRole('MEMBER'), listMyInitialPaymentsController)
router.get('/settings', requireRole('ADMIN'), initialSettingController)
router.patch('/settings', requireRole('ADMIN'), updateInitialSettingController)
router.get('/summary', requireRole('ADMIN'), initialSummaryController)
router.get('/', requireRole('ADMIN'), listInitialPaymentsController)
router.post('/:memberId/requirement', requireRole('ADMIN'), createInitialRequirementController)
router.get('/:id', getInitialPaymentController)
router.post('/:id/record', requireRole('ADMIN'), createInitialPaymentController)
router.patch('/:id/verify', requireRole('ADMIN'), verifyInitialPaymentController)
router.patch('/:id/reject', requireRole('ADMIN'), rejectInitialPaymentController)
router.patch('/:id/reverse', requireRole('ADMIN'), reverseInitialPaymentController)
export default router
