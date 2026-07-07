/**
 * Billing lifecycle emails via Resend REST API (no SDK dependency).
 * No-ops silently when RESEND_API_KEY is unset so webhooks never fail
 * on email problems.
 */

const FROM = process.env.BILLING_EMAIL_FROM ?? "LocalMap <onboarding@resend.dev>";

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: input.to,
        subject: input.subject,
        html: input.html,
      }),
    });

    if (!response.ok) {
      console.error(
        "[billing-email] Resend rejected email:",
        response.status,
        (await response.text()).slice(0, 200),
      );
    }
  } catch (error) {
    console.error("[billing-email] send failed:", error);
  }
}

function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://localsync-ai.vercel.app";
  return `${base.replace(/\/$/, "")}${path}`;
}

function wrap(body: string): string {
  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#1a1a1a">
      <p style="font-size:18px;font-weight:700;margin:0 0 16px">LocalMap</p>
      ${body}
      <p style="font-size:12px;color:#888;margin-top:32px">
        You're receiving this because you manage billing for a LocalMap workspace.
      </p>
    </div>`;
}

export async function sendTrialEndingEmail(input: {
  to: string;
  planName: string;
}): Promise<void> {
  await sendEmail({
    to: input.to,
    subject: `Your ${input.planName} trial ends soon`,
    html: wrap(`
      <p>Your <strong>${input.planName}</strong> free trial is ending in a few days.</p>
      <p>Your card on file will be charged automatically — no action needed to keep automated listing sync, AI drafts, and visibility tracking running.</p>
      <p>Want to change plans first? <a href="${appUrl("/dashboard/billing")}" style="color:#0d9488">Manage your plan</a>.</p>
    `),
  });
}

export async function sendPaymentFailedEmail(input: {
  to: string;
  planName: string;
}): Promise<void> {
  await sendEmail({
    to: input.to,
    subject: `Payment failed for ${input.planName}`,
    html: wrap(`
      <p>We couldn't process the payment for your <strong>${input.planName}</strong> subscription.</p>
      <p>Your automation keeps running during a short grace period. Please <a href="${appUrl("/dashboard/billing")}" style="color:#0d9488">update your payment method</a> to avoid interruption.</p>
    `),
  });
}

export async function sendCanceledEmail(input: {
  to: string;
  planName: string;
}): Promise<void> {
  await sendEmail({
    to: input.to,
    subject: `Your ${input.planName} subscription was canceled`,
    html: wrap(`
      <p>Your <strong>${input.planName}</strong> subscription has been canceled and will end at the close of the current billing period.</p>
      <p>Your listings and profile data stay safe, and manual workflows remain free forever. Automated sync and AI drafts pause when the period ends.</p>
      <p>Changed your mind? <a href="${appUrl("/dashboard/billing")}" style="color:#0d9488">Resubscribe any time</a>.</p>
    `),
  });
}
