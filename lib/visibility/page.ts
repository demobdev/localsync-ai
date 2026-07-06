import type { LocationProfileSnapshot } from "@/lib/types/location-profile";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildLocationPageHtml(input: {
  profile: LocationProfileSnapshot;
  jsonLd: Record<string, unknown>;
  serviceNames: string[];
  categoryName?: string;
}): string {
  const { profile, jsonLd, serviceNames, categoryName } = input;
  const jsonLdScript = JSON.stringify(jsonLd, null, 2);

  const hoursList = Object.entries(profile.regularHours)
    .map(([day, hours]) => {
      if (!hours) {
        return "";
      }

      const label = day.charAt(0).toUpperCase() + day.slice(1);
      const value = hours.closed
        ? "Closed"
        : `${hours.open} – ${hours.close}`;

      return `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`;
    })
    .filter(Boolean)
    .join("\n");

  const servicesList = serviceNames
    .map((service) => `<li>${escapeHtml(service)}</li>`)
    .join("\n");

  const address = [
    profile.addressLine1,
    profile.addressLine2,
    [profile.city, profile.state, profile.postalCode].filter(Boolean).join(", "),
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line ?? ""))
    .join("<br />");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(profile.name)} · LocalMap</title>
  <meta name="description" content="${escapeHtml(profile.description ?? `${profile.name} — local business profile`)}">
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <script type="application/ld+json">${jsonLdScript}</script>
  <style>
    :root {
      color-scheme: light dark;
      --teal: #0d9488;
      --teal-light: #14b8a6;
      --bg: #f8fbfb;
      --card: #ffffff;
      --text: #1a2332;
      --muted: #5c6b7a;
      --border: #dce8e8;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0f1419;
        --card: #171d24;
        --text: #eef2f6;
        --muted: #94a3b8;
        --border: #2a3441;
      }
    }
    * { box-sizing: border-box; }
    body {
      font-family: "Manrope", system-ui, sans-serif;
      line-height: 1.6;
      margin: 0;
      background: var(--bg);
      color: var(--text);
    }
    .wrap { max-width: 42rem; margin: 0 auto; padding: 2rem 1.25rem 3rem; }
    .brand {
      display: flex; align-items: center; gap: .5rem;
      font-size: .8rem; font-weight: 600; letter-spacing: .04em;
      text-transform: uppercase; color: var(--teal); margin-bottom: 1.5rem;
    }
    .brand-dot {
      width: .5rem; height: .5rem; border-radius: 999px;
      background: linear-gradient(135deg, var(--teal-light), var(--teal));
    }
    header {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
    }
    h1 { font-size: 1.75rem; font-weight: 700; margin: 0 0 .35rem; line-height: 1.2; }
    .meta { color: var(--muted); font-size: .95rem; margin: 0; }
    header > p { margin: .75rem 0 0; color: var(--muted); }
    section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.25rem 1.5rem;
      margin: 1rem 0;
    }
    h2 {
      font-size: .75rem; font-weight: 700; letter-spacing: .06em;
      text-transform: uppercase; color: var(--teal); margin: 0 0 .75rem;
    }
    ul { padding-left: 1.1rem; margin: 0; }
    li { margin: .35rem 0; }
    a { color: var(--teal); }
    details {
      border: 1px solid var(--border);
      border-radius: .75rem;
      padding: .75rem 1rem;
      margin: .5rem 0;
    }
    summary { font-weight: 600; cursor: pointer; }
    details p { margin: .5rem 0 0; color: var(--muted); }
    footer {
      margin-top: 2rem; text-align: center;
      font-size: .8rem; color: var(--muted);
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="brand"><span class="brand-dot"></span> LocalMap · AI-readable profile</div>
    <header>
      <h1>${escapeHtml(profile.name)}</h1>
      ${categoryName ? `<p class="meta">${escapeHtml(categoryName)}</p>` : ""}
      ${profile.description ? `<p>${escapeHtml(profile.description)}</p>` : ""}
    </header>

  <section>
    <h2>Contact</h2>
    <ul>
      ${profile.phone ? `<li><strong>Phone:</strong> <a href="tel:${escapeHtml(profile.phone)}">${escapeHtml(profile.phone)}</a></li>` : ""}
      ${profile.email ? `<li><strong>Email:</strong> <a href="mailto:${escapeHtml(profile.email)}">${escapeHtml(profile.email)}</a></li>` : ""}
      ${profile.website ? `<li><strong>Website:</strong> <a href="${escapeHtml(profile.website)}" rel="noopener">${escapeHtml(profile.website)}</a></li>` : ""}
      ${address ? `<li><strong>Address:</strong><br />${address}</li>` : ""}
    </ul>
  </section>

  ${
    hoursList
      ? `<section><h2>Hours</h2><ul>${hoursList}</ul></section>`
      : ""
  }

  ${
    servicesList
      ? `<section><h2>Services</h2><ul>${servicesList}</ul></section>`
      : ""
  }

  ${
    profile.faqs && profile.faqs.length > 0
      ? `<section><h2>FAQs</h2>${profile.faqs
          .map(
            (faq) =>
              `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`,
          )
          .join("\n")}</section>`
      : ""
  }

  <footer>Structured data page · Powered by <strong>LocalMap</strong> &amp; LocalSync</footer>
  </div>
</body>
</html>`;
}
