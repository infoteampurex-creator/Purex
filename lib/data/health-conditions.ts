/**
 * Health conditions — shared types + display helpers.
 *
 * Pure types, importable on server and client. Server-side fetch /
 * upsert lives in health-conditions-server.ts (admin-write) and
 * lib/actions/health-conditions.ts (admin-only action wrappers).
 */

export interface HealthConditionsProfile {
  clientId: string;
  conditions: string[];
  allergies: string[];
  injuries: string[];
  medications: string[];
  coachNotes: string | null;
  updatedAt: string | null; // ISO timestamp
}

export const EMPTY_HEALTH_PROFILE: HealthConditionsProfile = {
  clientId: '',
  conditions: [],
  allergies: [],
  injuries: [],
  medications: [],
  coachNotes: null,
  updatedAt: null,
};

/**
 * Suggested condition chips shown on the client Health page when no
 * conditions are set — purely informational, not a fixed list.
 * Trainers can enter anything via the admin UI.
 */
export const COMMON_CONDITIONS = [
  'Type 2 diabetes',
  'Hypertension',
  'PCOS',
  'Thyroid (hypo)',
  'Thyroid (hyper)',
  'High cholesterol',
  'Acidity / GERD',
  'Knee issue',
  'Lower-back issue',
  'Lactose intolerance',
  'Pre-diabetes',
  'Asthma',
];

/** True if the profile has any non-empty data (conditions/allergies/...). */
export function hasAnyHealthData(p: HealthConditionsProfile | null): boolean {
  if (!p) return false;
  return (
    p.conditions.length > 0 ||
    p.allergies.length > 0 ||
    p.injuries.length > 0 ||
    p.medications.length > 0 ||
    (p.coachNotes != null && p.coachNotes.trim().length > 0)
  );
}
