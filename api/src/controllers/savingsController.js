import { savingsCreateSchema, savingsIdParamSchema, savingsRejectSchema, savingsSettingsSchema } from '../validation/savingsValidation.js'
import { createContribution, getContribution, getSavingsSettings, getSummary, listContributions, rejectContribution, updateSavingsSettings, verifyContribution } from '../services/savingsService.js'

const parsed = (schema, input) => {
  const result = schema.safeParse(input)
  if (!result.success) throw Object.assign(new Error(result.error.issues[0]?.message || 'Invalid request'), { statusCode: 400 })
  return result.data
}

export const listSavingsController = async (req, res, next) => { try { res.json({ success: true, ...(await listContributions(req.query)) }) } catch (error) { next(error) } }
export const listMySavingsController = async (req, res, next) => { try { res.json({ success: true, ...(await listContributions(req.query, req.user.member)) }) } catch (error) { next(error) } }
export const createSavingsController = async (req, res, next) => { try { res.status(201).json({ success: true, contribution: await createContribution(parsed(savingsCreateSchema, req.body), req) }) } catch (error) { next(error) } }
export const getSavingsController = async (req, res, next) => { try { res.json({ success: true, contribution: await getContribution(savingsIdParamSchema(req.params.id), req) }) } catch (error) { next(error) } }
export const verifySavingsController = async (req, res, next) => { try { res.json({ success: true, contribution: await verifyContribution(savingsIdParamSchema(req.params.id), req) }) } catch (error) { next(error) } }
export const rejectSavingsController = async (req, res, next) => { try { const { reason } = parsed(savingsRejectSchema, req.body); res.json({ success: true, contribution: await rejectContribution(savingsIdParamSchema(req.params.id), reason, req) }) } catch (error) { next(error) } }
export const summarySavingsController = async (req, res, next) => { try { res.json({ success: true, summary: await getSummary(req.query.month) }) } catch (error) { next(error) } }
export const savingsSettingsController = async (req, res, next) => { try { res.json({ success: true, settings: await getSavingsSettings() }) } catch (error) { next(error) } }
export const updateSavingsSettingsController = async (req, res, next) => { try { const { monthlyAmount } = parsed(savingsSettingsSchema, req.body); res.json({ success: true, settings: await updateSavingsSettings(monthlyAmount, req) }) } catch (error) { next(error) } }
