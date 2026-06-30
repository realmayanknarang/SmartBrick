/**
 * server/utils/approvalWorkflow.js
 *
 * Approval stage transition rules — Phase 11D
 * ─────────────────────────────────────────────────────────────────────────────
 * ROLE-GATING DECISION (documented for product review):
 *
 * Pipeline stages (in order):
 *   site_engineer → project_manager → finance → approved
 *
 * Who can act at each stage:
 *   • site_engineer stage  → site_engineer OR owner
 *   • project_manager stage → project_manager OR owner
 *   • finance stage        → finance OR owner
 *
 * Rationale:
 *   • Each operational role advances orders only from THEIR stage to the next.
 *     A site engineer cannot skip ahead to finance or mark approved.
 *   • Owner is a super-approver who can act at any in-pipeline stage (typical
 *     for small construction firms where the owner signs off on everything).
 *   • Final "approved" status is reached only when finance (or owner acting at
 *     the finance stage) advances an order — no other role can jump to approved.
 *   • Any authorized actor at the current stage may reject (→ rejected).
 *
 * Invalid transitions (e.g. site_engineer → approved) are rejected with 400.
 */

export const PIPELINE_STAGES = ['site_engineer', 'project_manager', 'finance'];

/** Roles permitted to advance/reject at each pipeline stage. */
export const STAGE_ACTORS = {
  site_engineer:   ['site_engineer', 'owner'],
  project_manager: ['project_manager', 'owner'],
  finance:         ['finance', 'owner'],
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
