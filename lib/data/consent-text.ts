/**
 * TEAM Team Purex — Client Consent & Privacy Agreement.
 *
 * Versioned in code so legal changes are reviewable through git
 * history. When you change any text below, bump CURRENT_CONSENT_VERSION
 * and every client will be prompted to re-sign on next login.
 *
 * Drafted to meet the common ground of:
 *   • UK / EU — GDPR + ICO guidance (explicit, granular, withdrawable)
 *   • USA  — CCPA / CPRA / VCDPA / CPA (clear notice + opt-in for
 *            sensitive / health data)
 *   • UAE / Dubai — Federal Decree-Law 45/2021 + Health Data Law
 *   • India — DPDP Act 2023 (free, specific, informed, withdrawable)
 *
 * Source of truth — do not edit the rendered text in the page; edit
 * here and the page picks it up.
 */

export const CURRENT_CONSENT_VERSION = 'v1.0' as const;

export interface ConsentSection {
  title: string;
  /** Plain text paragraphs (no Markdown). Renderer formats lists. */
  paragraphs: string[];
  /** Optional bullet list under the paragraphs. */
  bullets?: string[];
}

export const CONSENT_DOCUMENT: ConsentSection[] = [
  {
    title: '1. Declaration',
    paragraphs: [
      'I voluntarily choose to participate in the TEAM Team Purex fitness and nutrition coaching program. I understand that the program is designed to provide general fitness guidance, exercise programming, nutrition coaching, lifestyle recommendations, and accountability support.',
      'I acknowledge that TEAM Team Purex does not provide medical diagnosis, treatment, or cure for any disease or medical condition.',
    ],
  },
  {
    title: '2. Medical Responsibility',
    paragraphs: ['I confirm that:'],
    bullets: [
      'I have disclosed all known medical conditions, injuries, surgeries, medications, allergies, and health concerns relevant to my participation.',
      'I understand that I should consult my physician before starting any exercise or nutrition program if I have any existing medical condition or concerns.',
      'I agree to immediately inform TEAM Team Purex if my health status changes during the coaching program.',
    ],
  },
  {
    title: '3. Program Disclaimer',
    paragraphs: ['I understand that:'],
    bullets: [
      'Results vary between individuals.',
      'No specific weight loss, fat loss, muscle gain, disease reversal, or health outcome is guaranteed.',
      'The coaching provided is educational and lifestyle-based and should not replace medical advice from a qualified healthcare professional.',
    ],
  },
  {
    title: '4. Exercise & Nutrition Risks',
    paragraphs: [
      'I acknowledge that participation in physical exercise and dietary changes involves inherent risks, including but not limited to:',
    ],
    bullets: [
      'Muscle soreness',
      'Fatigue',
      'Minor injuries',
      'Changes in body weight',
      'Temporary discomfort associated with exercise',
    ],
  },
  {
    title: '5. Data Collection & Privacy',
    paragraphs: ['I consent to TEAM Team Purex collecting information such as:'],
    bullets: [
      'Name and contact details',
      'Age, gender, height and weight',
      'Progress photos (optional)',
      'Body measurements',
      'Daily meal updates',
      'Water intake',
      'Sleep duration',
      'Step count',
      'Workout performance',
      'Health questionnaires',
      'Other fitness-related information shared by me',
    ],
  },
  {
    title: 'How this information will be used',
    paragraphs: ['This information will only be used for:'],
    bullets: [
      'Personalised coaching',
      'Progress tracking',
      'Program improvements',
      'Internal analytics',
      'Customer support',
    ],
  },
  {
    title: 'Sharing & security',
    paragraphs: [
      'TEAM Team Purex will not sell, rent, or commercially share my personal data with third parties without my permission except where required by applicable law.',
      'Reasonable security measures will be taken to protect my information.',
    ],
  },
  {
    title: '6. Progress Photos',
    paragraphs: [
      'I understand that progress photos are optional.',
      'If I separately provide permission, TEAM Team Purex may use my transformation photos or testimonials for educational or promotional purposes.',
      'I may withdraw this permission at any time by written request.',
    ],
  },
  {
    title: '7. Communication Consent',
    paragraphs: [
      'I consent to receiving communication from TEAM Team Purex through the channels I tick below — WhatsApp, Email, Phone calls, and Mobile application notifications — for coaching, reminders, progress tracking, and support.',
    ],
  },
  {
    title: '8. Client Responsibilities',
    paragraphs: ['I agree to:'],
    bullets: [
      'Provide accurate information.',
      'Follow the program responsibly.',
      'Report pain, discomfort, or medical issues immediately.',
      'Avoid exercises that cause injury or unusual discomfort.',
      'Understand that consistency is my responsibility.',
    ],
  },
  {
    title: '9. Limitation of Liability',
    paragraphs: [
      'To the fullest extent permitted by law, TEAM Team Purex and its coaches shall not be liable for injuries, illness, losses, or damages arising from participation in the program except where caused by proven negligence.',
      'Participation is entirely voluntary.',
    ],
  },
];

/** Granular checkboxes the client must explicitly tick. */
export interface ConsentBox {
  key: string;
  label: string;
  required: boolean;
  /** Subtle help text below the checkbox. */
  help?: string;
}

export const CONSENT_BOXES: ConsentBox[] = [
  {
    key: 'agreed_to_terms',
    label: 'I have read and understood this agreement.',
    required: true,
  },
  {
    key: 'agreed_to_data_collection',
    label:
      'I consent to TEAM Team Purex collecting and using my data for coaching, as described in Section 5.',
    required: true,
    help: 'You can withdraw consent later from your Account settings.',
  },
  {
    key: 'agreed_to_progress_photos',
    label: 'I am willing to share progress photos (optional).',
    required: false,
    help: 'Photos are private by default — never used in marketing without separate permission.',
  },
  {
    key: 'agreed_to_marketing_use',
    label:
      'I separately permit TEAM Team Purex to use my transformation photos or testimonials for educational or promotional purposes (optional).',
    required: false,
    help: 'Revocable at any time. Section 6.',
  },
  {
    key: 'agreed_to_whatsapp',
    label: 'I consent to receive WhatsApp messages.',
    required: false,
  },
  {
    key: 'agreed_to_email',
    label: 'I consent to receive emails.',
    required: false,
  },
  {
    key: 'agreed_to_phone',
    label: 'I consent to receive phone calls.',
    required: false,
  },
  {
    key: 'agreed_to_push',
    label: 'I consent to receive in-app push notifications.',
    required: false,
  },
];

export type ConsentBoxKey = (typeof CONSENT_BOXES)[number]['key'];
