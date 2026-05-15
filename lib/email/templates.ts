import 'server-only';

/**
 * Plain-HTML email templates for the signup approval flow.
 *
 * Designed for Outlook + Gmail + Apple Mail compatibility:
 *   - Inline styles (Gmail strips <style> blocks).
 *   - Table-based layout (Outlook clings to it).
 *   - Web-safe fonts as fallbacks.
 *   - PURE X "logo" is rendered as styled text rather than an image so
 *     it survives ad-blockers, image-disabled inboxes, and dark/light
 *     mode without an external dependency. Once a hosted brand PNG
 *     exists, swap LogoMark() to return <img src="..."/>.
 *
 * Brand voice: direct, premium, no fluff. Each line earns its place.
 */

const BRAND_GREEN = '#c6ff3d';
const BRAND_INK = '#0a0c09';
const BRAND_TEXT = '#e8eadc';
const BRAND_MUTED = '#a0a69a';
const BRAND_BORDER = '#2a2e23';

const FONT_STACK =
  "ui-sans-serif, system-ui, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const DISPLAY_STACK =
  "'Plus Jakarta Sans', " + FONT_STACK;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ??
  'https://www.teampurex.com';

const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '919999999999';

function LogoMark(): string {
  return `
    <span style="font-family:${DISPLAY_STACK};font-weight:800;font-size:28px;letter-spacing:-0.02em;color:#f4f7eb;">PURE</span><span style="font-family:${DISPLAY_STACK};font-weight:800;font-size:28px;letter-spacing:-0.02em;color:${BRAND_GREEN};margin-left:6px;">X</span>
  `.trim();
}

function shellHtml({
  preheader,
  body,
}: {
  preheader: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="dark light" />
  <meta name="supported-color-schemes" content="dark light" />
  <title>PURE X</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_INK};color:${BRAND_TEXT};font-family:${FONT_STACK};-webkit-font-smoothing:antialiased;">
  <!-- Preheader (hidden, but shows in inbox previews) -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;color:transparent;">
    ${escapeHtml(preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_INK};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#101410;border:1px solid ${BRAND_BORDER};border-radius:16px;overflow:hidden;">

          <!-- Header bar with logo -->
          <tr>
            <td style="padding:24px 32px;border-bottom:1px solid ${BRAND_BORDER};">
              ${LogoMark()}
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid ${BRAND_BORDER};">
              <p style="margin:0;font-size:11px;line-height:1.6;color:${BRAND_MUTED};">
                You're receiving this because you applied to join PURE X.
                Reply to this email or WhatsApp us at
                <a href="https://wa.me/${WHATSAPP_NUMBER}" style="color:${BRAND_GREEN};text-decoration:none;">+${WHATSAPP_NUMBER}</a>.
              </p>
              <p style="margin:8px 0 0 0;font-size:11px;color:${BRAND_MUTED};">
                © PURE X. ${SITE_URL.replace(/^https?:\/\//, '')}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.65;color:${BRAND_TEXT};">${text}</p>`;
}

function rule(label: string): string {
  return `<div style="display:inline-block;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;letter-spacing:0.22em;color:${BRAND_GREEN};font-weight:700;text-transform:uppercase;margin:16px 0 10px 0;">${escapeHtml(label)}</div>`;
}

function bullets(items: string[]): string {
  const lis = items
    .map(
      (it) =>
        `<li style="margin:0 0 8px 0;font-size:15px;line-height:1.65;color:${BRAND_TEXT};">${it}</li>`
    )
    .join('');
  return `<ul style="margin:0 0 16px 0;padding-left:20px;color:${BRAND_TEXT};">${lis}</ul>`;
}

function primaryButton({ href, label }: { href: string; label: string }): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0 8px 0;">
    <tr>
      <td style="background:${BRAND_GREEN};border-radius:999px;">
        <a href="${escapeAttr(href)}"
           style="display:inline-block;padding:12px 24px;font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${BRAND_INK};text-decoration:none;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(input: string): string {
  return escapeHtml(input);
}

// ─── Welcome / Approval ────────────────────────────────────────────

export function welcomeEmail({
  firstName,
}: {
  firstName: string;
}): { html: string; text: string; subject: string } {
  const subject = "You're in. Welcome to PURE X.";
  const safeName = escapeHtml(firstName);
  const loginUrl = `${SITE_URL}/login`;

  const body = `
    <h1 style="margin:0 0 16px 0;font-family:${DISPLAY_STACK};font-size:28px;line-height:1.2;color:#f4f7eb;font-weight:700;letter-spacing:-0.01em;">
      Hi ${safeName},
    </h1>

    ${paragraph("You're in.")}

    ${paragraph(
      `Your PURE X account is approved and ready. Sign in to your dashboard:`
    )}

    ${primaryButton({ href: loginUrl, label: 'Open dashboard' })}

    ${rule('What happens next')}
    ${bullets([
      'Your assigned coach reaches out within 24 hours to schedule your kickoff call.',
      'We build your first 7-day plan together.',
      'Day 1 starts the moment we agree on it — not before, not later.',
    ])}

    ${rule('A few things about how we work')}
    ${bullets([
      '<strong>100-day commitment.</strong> We don\'t promise transformations in 30 days because they don\'t last.',
      '<strong>Five specialists, one plan.</strong> Your coach is the front-line — doctors, physio, and mental performance sit behind them.',
      '<strong>No black boxes.</strong> Everything you log, your coach sees. Everything they plan, you see.',
    ])}

    ${paragraph(
      `You haven't signed up for a workout app. You've joined a system built to outlast motivation.`
    )}

    <p style="margin:24px 0 0 0;font-size:14px;color:${BRAND_MUTED};">— The PURE X team</p>
  `;

  const text = [
    `Hi ${firstName},`,
    '',
    "You're in.",
    '',
    'Your PURE X account is approved and ready. Sign in here:',
    loginUrl,
    '',
    'What happens next:',
    '- Your assigned coach reaches out within 24 hours to schedule your kickoff call.',
    '- We build your first 7-day plan together.',
    "- Day 1 starts the moment we agree on it — not before, not later.",
    '',
    'A few things about how we work:',
    "- 100-day commitment. We don't promise transformations in 30 days because they don't last.",
    "- Five specialists, one plan. Your coach is the front-line — doctors, physio, and mental performance sit behind them.",
    '- No black boxes. Everything you log, your coach sees. Everything they plan, you see.',
    '',
    "You haven't signed up for a workout app. You've joined a system built to outlast motivation.",
    '',
    '— The PURE X team',
  ].join('\n');

  return {
    subject,
    html: shellHtml({
      preheader: `Welcome, ${firstName}. Your PURE X account is approved.`,
      body,
    }),
    text,
  };
}

// ─── Rejection ─────────────────────────────────────────────────────

export function rejectionEmail({
  firstName,
}: {
  firstName: string;
}): { html: string; text: string; subject: string } {
  const subject = 'A note on your PURE X application';
  const safeName = escapeHtml(firstName);

  const body = `
    <h1 style="margin:0 0 16px 0;font-family:${DISPLAY_STACK};font-size:28px;line-height:1.2;color:#f4f7eb;font-weight:700;letter-spacing:-0.01em;">
      Hi ${safeName},
    </h1>

    ${paragraph('Thanks for applying to join PURE X.')}

    ${paragraph(
      `After reviewing your application, we don't think we're the right fit for you right now. This is rarely about you — it's usually about timing, capacity, or alignment with the kind of commitment our program requires.`
    )}

    ${rule('A few honest reasons we sometimes pause applications')}
    ${bullets([
      'Our roster is at capacity in your region or time zone.',
      "The 100-day commitment isn't aligned with what you're looking for right now.",
      'We think an in-person trainer in your city would serve you better than remote coaching.',
    ])}

    ${paragraph(
      "If any of those change, or if you'd like to talk about it, please reply to this email. We re-open applications quarterly and remember every conversation."
    )}

    <p style="margin:24px 0 0 0;font-size:14px;color:${BRAND_MUTED};">Wishing you strength,<br/>— The PURE X team</p>
  `;

  const text = [
    `Hi ${firstName},`,
    '',
    'Thanks for applying to join PURE X.',
    '',
    "After reviewing your application, we don't think we're the right fit for you right now. This is rarely about you — it's usually about timing, capacity, or alignment with the kind of commitment our program requires.",
    '',
    'A few honest reasons we sometimes pause applications:',
    '- Our roster is at capacity in your region or time zone.',
    "- The 100-day commitment isn't aligned with what you're looking for right now.",
    '- We think an in-person trainer in your city would serve you better than remote coaching.',
    '',
    "If any of those change, or if you'd like to talk about it, please reply to this email. We re-open applications quarterly and remember every conversation.",
    '',
    'Wishing you strength,',
    '— The PURE X team',
  ].join('\n');

  return {
    subject,
    html: shellHtml({
      preheader: `An update on your PURE X application.`,
      body,
    }),
    text,
  };
}
