import { initialPaymentCreateSchema, initialPaymentIdSchema, initialPaymentRejectSchema, initialPaymentReverseSchema, initialSettingSchema } from '../validation/initialMembershipValidation.js'
import { createInitialPayment, getInitialMembershipSetting, getInitialMembershipSummary, getInitialPayment, listInitialPayments, recordInitialPayment, rejectInitialPayment, reverseInitialPayment, updateInitialMembershipSetting, verifyInitialPayment } from '../services/initialMembershipService.js'

const parsed = (schema, input) => {
  const result = schema.safeParse(input)
  if (!result.success) throw Object.assign(new Error(result.error.issues[0]?.message || 'Invalid request'), { statusCode: 400 })
  return result.data
}
export const initialSettingController = async (req, res, next) => { try { res.json({ success: true, settings: await getInitialMembershipSetting() }) } catch (error) { next(error) } }
export const updateInitialSettingController = async (req, res, next) => { try { res.json({ success: true, settings: await updateInitialMembershipSetting(parsed(initialSettingSchema, req.body).amount, req) }) } catch (error) { next(error) } }
export const initialSummaryController = async (req, res, next) => { try { res.json({ success: true, summary: await getInitialMembershipSummary() }) } catch (error) { next(error) } }
export const listInitialPaymentsController = async (req, res, next) => { try { res.json({ success: true, payments: await listInitialPayments(req.query) }) } catch (error) { next(error) } }
export const listMyInitialPaymentsController = async (req, res, next) => { try { res.json({ success: true, payments: await listInitialPayments({}, req.user.member) }) } catch (error) { next(error) } }
export const getInitialPaymentController = async (req, res, next) => { try { res.json({ success: true, payment: await getInitialPayment(initialPaymentIdSchema(req.params.id), req.user.role === 'MEMBER' ? req.user.member : null) }) } catch (error) { next(error) } }
export const createInitialPaymentController = async (req, res, next) => { try { res.status(201).json({ success: true, payment: await recordInitialPayment(initialPaymentIdSchema(req.params.id), parsed(initialPaymentCreateSchema, req.body), req) }) } catch (error) { next(error) } }
export const verifyInitialPaymentController = async (req, res, next) => { try { res.json({ success: true, payment: await verifyInitialPayment(initialPaymentIdSchema(req.params.id), req) }) } catch (error) { next(error) } }
export const rejectInitialPaymentController = async (req, res, next) => { try { res.json({ success: true, payment: await rejectInitialPayment(initialPaymentIdSchema(req.params.id), parsed(initialPaymentRejectSchema, req.body).reason, req) }) } catch (error) { next(error) } }
export const reverseInitialPaymentController = async (req, res, next) => { try { res.json({ success: true, payment: await reverseInitialPayment(initialPaymentIdSchema(req.params.id), parsed(initialPaymentReverseSchema, req.body).reason, req) }) } catch (error) { next(error) } }
export const createInitialRequirementController = async (req, res, next) => { try { res.status(201).json({ success: true, payment: await createInitialPayment(req.params.memberId, req) }) } catch (error) { next(error) } }
