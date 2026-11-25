import { memberAccountStatusSchema, memberCreateSchema, memberIdParamSchema, memberStatusSchema, memberUpdateSchema, memberVerificationSchema } from '../validation/memberValidation.js'
import { createMember, getMember, getMemberActivity, getMemberSummary, listMembers, updateMember, updateMemberStatus, verifyMember } from '../services/memberService.js'
import { resendMemberInvitation, sendMemberInvitation, updateMemberAccountStatus } from '../services/memberInvitationService.js'

const parsed = (schema, input) => {
  const result = schema.safeParse(input)
  if (!result.success) throw Object.assign(new Error(result.error.issues[0]?.message || 'Invalid request'), { statusCode: 400 })
  return result.data
}

export const listMembersController = async (req, res, next) => { try { res.json({ success: true, ...(await listMembers(req.query)) }) } catch (error) { next(error) } }
export const createMemberController = async (req, res, next) => { try { res.status(201).json({ success: true, member: await createMember(parsed(memberCreateSchema, req.body), req) }) } catch (error) { next(error) } }
export const getMemberController = async (req, res, next) => { try { res.json({ success: true, member: await getMember(memberIdParamSchema(req.params.id)) }) } catch (error) { next(error) } }
export const updateMemberController = async (req, res, next) => { try { res.json({ success: true, member: await updateMember(memberIdParamSchema(req.params.id), parsed(memberUpdateSchema, req.body), req) }) } catch (error) { next(error) } }
export const updateMemberStatusController = async (req, res, next) => { try { const body = parsed(memberStatusSchema, req.body); res.json({ success: true, member: await updateMemberStatus(memberIdParamSchema(req.params.id), body.membershipStatus, req) }) } catch (error) { next(error) } }
export const memberActivityController = async (req, res, next) => { try { res.json({ success: true, activity: await getMemberActivity(memberIdParamSchema(req.params.id)) }) } catch (error) { next(error) } }
export const memberSummaryController = async (req, res, next) => { try { res.json({ success: true, summary: await getMemberSummary() }) } catch (error) { next(error) } }
export const resendMemberInvitationController = async (req, res, next) => { try { res.json({ success: true, invitation: await resendMemberInvitation(memberIdParamSchema(req.params.id), req) }) } catch (error) { next(error) } }
export const sendMemberInvitationController = async (req, res, next) => { try { res.json({ success: true, invitation: await sendMemberInvitation(memberIdParamSchema(req.params.id), req) }) } catch (error) { next(error) } }
export const verifyMemberController = async (req, res, next) => { try { const body = parsed(memberVerificationSchema, req.body); res.json({ success: true, member: await verifyMember(memberIdParamSchema(req.params.id), body.action, body.reason, req) }) } catch (error) { next(error) } }
export const updateMemberAccountStatusController = async (req, res, next) => { try { const body = parsed(memberAccountStatusSchema, req.body); res.json({ success: true, account: await updateMemberAccountStatus(memberIdParamSchema(req.params.id), body.accountStatus, req) }) } catch (error) { next(error) } }
