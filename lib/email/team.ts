import "server-only";

import { Resend } from "resend";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character] ?? character,
  );
}

function teamWelcomeHtml(input: {
  workspaceName: string;
  roleName: string;
  workspaceUrl: string;
}): string {
  const workspaceName = escapeHtml(input.workspaceName);
  const roleName = escapeHtml(input.roleName);
  const workspaceUrl = escapeHtml(input.workspaceUrl);

  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#effafa;color:#10212f;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
    <div style="display:none;max-height:0;overflow:hidden">Your access to ${workspaceName} is ready.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#effafa">
      <tr><td align="center" style="padding:32px 14px 44px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px">
          <tr><td style="padding:20px 28px 18px;background:#fff;border-radius:20px 20px 0 0;font-size:20px;font-weight:800;color:#0f172a">LocalMap.Co</td></tr>
          <tr><td style="height:6px;background:#0d9488"></td></tr>
          <tr><td style="padding:32px 34px 34px;background:#fff;border-radius:0 0 20px 20px;box-shadow:0 16px 44px rgba(13,148,136,.1)">
            <p style="margin:0 0 9px;color:#0f766e;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Workspace access confirmed</p>
            <h1 style="margin:0 0 18px;color:#0f172a;font-size:30px;line-height:1.2">You're in ${workspaceName}.</h1>
            <p style="margin:0 0 18px;color:#475569;font-size:16px;line-height:1.65">Your LocalMap invitation has been accepted. You can now work from the existing client context without repeating the business-owner setup.</p>
            <div style="margin:22px 0;padding:20px 22px;border:1px solid #99f6e4;border-radius:16px;background:#f0fdfa">
              <p style="margin:0 0 4px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase">Your access</p>
              <p style="margin:0;color:#0f766e;font-size:26px;font-weight:800">${roleName}</p>
              <p style="margin:7px 0 0;color:#64748b;font-size:14px;line-height:1.5">LocalMap will activate this workspace before opening your dashboard.</p>
            </div>
            <p style="margin:0 0 10px;color:#334155;font-size:15px">✓ Review the shared business profile and current priorities</p>
            <p style="margin:0 0 10px;color:#334155;font-size:15px">✓ Work from the team's existing clients and locations</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px">✓ Use the workspace switcher when you belong to more than one team</p>
            <a href="${workspaceUrl}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#0d9488;color:#fff;font-size:15px;font-weight:700;text-decoration:none">Open your workspace</a>
          </td></tr>
          <tr><td align="center" style="padding:20px 24px 0;color:#78909c;font-size:11px;line-height:1.6">LocalMap.Co helps local businesses keep their web presence accurate, visible, and ready for AI search.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export async function sendTeamMemberWelcome(input: {
  invitationId: string;
  email: string;
  organizationId: string;
  workspaceName: string;
  roleName: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    console.info("[email] skipped team-member-welcome; RESEND_API_KEY is unset");
    return;
  }

  const workspaceUrl = "https://app.localmap.co/welcome/team";
  const resend = new Resend(apiKey);
  const response = await resend.emails.send(
    {
      from:
        process.env.LOCALMAP_EMAIL_FROM?.trim() ||
        "LocalMap <welcome@updates.localmap.co>",
      to: input.email,
      replyTo: process.env.LOCALMAP_EMAIL_REPLY_TO?.trim() || undefined,
      subject: `You're in ${input.workspaceName}`,
      html: teamWelcomeHtml({
        workspaceName: input.workspaceName,
        roleName: input.roleName,
        workspaceUrl,
      }),
      tags: [
        { name: "category", value: "account" },
        { name: "template", value: "team-member-welcome" },
        { name: "organization", value: input.organizationId },
      ],
    },
    { idempotencyKey: `team-member-welcome-${input.invitationId}` },
  );

  if (response.error || !response.data?.id) {
    throw new Error(
      response.error?.message ?? "Resend did not return an email id",
    );
  }
}
