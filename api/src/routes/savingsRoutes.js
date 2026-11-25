import express from 'express'
import { authenticate, requireRole } from '../middleware/authMiddleware.js'
import { createSavingsController, getSavingsController, listMySavingsController, listSavingsController, rejectSavingsController, savingsSettingsController, summarySavingsController, updateSavingsSettingsController, verifySavingsController } from '../controllers/savingsController.js'

const router = express.Router()
router.use(authenticate)
router.get('/me', requireRole('MEMBER'), listMySavingsController)
router.get('/', requireRole('ADMIN'), listSavingsController)
router.post('/', requireRole('ADMIN'), createSavingsController)
router.get('/summary', requireRole('ADMIN'), summarySavingsController)
router.get('/settings', requireRole('ADMIN'), savingsSettingsController)
router.patch('/settings', requireRole('ADMIN'), updateSavingsSettingsController)
router.get('/:id', getSavingsController)
router.patch('/:id/verify', requireRole('ADMIN'), verifySavingsController)
router.patch('/:id/reject', requireRole('ADMIN'), rejectSavingsController)
export default router
