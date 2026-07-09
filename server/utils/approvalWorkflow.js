/**
 * server/utils/approvalWorkflow.js
 *
 * Approval stage transition rules — Phase 11D / C Series
 * ─────────────────────────────────────────────────────────────────────────────
 * Pipeline stages are fixed identifiers (not user roles):
 *   site_engineer → project_manager → finance → approved
 *
 * Stage actors were updated in C Series to use the consolidated role set
 * (owner / builder / vendor). Builder is the operational role that covers
 * on-site engineering and project management actions.
 *
 * Who can act at each stage:
 *   • site_engineer stage  → builder OR owner
 *   • project_manager stage → builder OR owner
 *   • finance stage        → owner
 *
 * Rationale:
 *   • Builder is the operational on-site role (covers what site_engineer and
 *     project_manager used to do) — advances from their mapped stage.
 *   • Owner is a super-approver who can act at any in-pipeline stage.
 *   • Final "approved" status is reached only when owner (at the finance stage)
 *     advances an order — no other role can jump to approved.
 *   • Any authorized actor at the current stage may reject (→ rejected).
 *
 * Invalid transitions are rejected with 400.
 */

export const PIPELINE_STAGES = ['site_engineer', 'project_manager', 'finance'];

/** Roles permitted to advance/reject at each pipeline stage. */
export const STAGE_ACTORS = {
  site_engineer:   ['builder', 'owner'],
  project_manager: ['builder', 'owner'],
  finance:         ['owner'],
};

export const STAGE_LABELS = {
  site_engineer:   'Site Engineer',
  project_manager: 'Project Manager',
  finance:         'Finance',
  approved:        'Approved',
  rejected:        'Rejected',
};

/**
 * @param {string} userRole
 * @param {string} approvalStage  Current PO approvalStage
 */
export function canActOnStage(userRole, approvalStage) {
  if (!PIPELINE_STAGES.includes(approvalStage)) return false;
  return (STAGE_ACTORS[approvalStage] ?? []).includes(userRole);
}

/**
 * Returns the next stage after a successful advance action.
 * @param {string} currentStage
 * @returns {string|null}
 */
export function getAdvanceTarget(currentStage) {
  if (!PIPELINE_STAGES.includes(currentStage)) return null;
  if (currentStage === 'finance') return 'approved';
  const idx = PIPELINE_STAGES.indexOf(currentStage);
  return PIPELINE_STAGES[idx + 1] ?? null;
}

/**
 * Validates and resolves a transition request.
 *
 * @param {string} currentStage
 * @param {'advance'|'reject'} action
 * @returns {{ ok: true, nextStage: string } | { ok: false, message: string }}
 */
export function resolveTransition(currentStage, action) {
  if (!PIPELINE_STAGES.includes(currentStage)) {
    return {
      ok:      false,
      message: `Order is not in an actionable stage (current: '${currentStage}').`,
    };
  }

  if (action === 'reject') {
    return { ok: true, nextStage: 'rejected' };
  }

  if (action !== 'advance') {
    return { ok: false, message: "Action must be 'advance' or 'reject'." };
  }

  const nextStage = getAdvanceTarget(currentStage);
  if (!nextStage) {
    return { ok: false, message: 'No valid next stage for this order.' };
  }

  return { ok: true, nextStage };
}
