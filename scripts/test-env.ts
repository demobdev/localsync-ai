import { config } from "dotenv";

config({ path: ".env.local" });

type CheckResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const results: CheckResult[] = [];

function record(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
}

function required(name: string): string | null {
  const value = process.env[name]?.trim();
  if (!value) {
    record(name, false, "Missing or empty");
    return null;
  }

  record(name, true, "Set");
  return value;
}

async function testDatabase() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    record("DATABASE_URL", false, "Missing or empty");
    return;
  }

  try {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    const rows = await sql`select 1 as ok`;
    const publishers = await sql`select count(*)::int as count from publishers`;
    record(
      "DATABASE_URL",
      true,
      `Connected (${publishers[0]?.count ?? 0} publishers seeded)`,
    );
    void rows;
  } catch (error) {
    record(
      "DATABASE_URL",
      false,
      error instanceof Error ? error.message : "Connection failed",
    );
  }
}

async function testClerk() {
  const secret = process.env.CLERK_SECRET_KEY?.trim();
  if (!secret) {
    record("CLERK_SECRET_KEY", false, "Missing or empty");
    return;
  }

  try {
    const response = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: { Authorization: `Bearer ${secret}` },
    });

    if (response.ok) {
      record("CLERK_SECRET_KEY", true, "API key valid");
    } else {
      record("CLERK_SECRET_KEY", false, `HTTP ${response.status}`);
    }
  } catch (error) {
    record(
      "CLERK_SECRET_KEY",
      false,
      error instanceof Error ? error.message : "Request failed",
    );
  }
}

async function testBlob() {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    record("BLOB_READ_WRITE_TOKEN", false, "Missing or empty");
    return;
  }

  try {
    const response = await fetch("https://blob.vercel-storage.com/?prefix=locations/", {
      headers: { authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      record("BLOB_READ_WRITE_TOKEN", true, "Token accepted");
    } else {
      record("BLOB_READ_WRITE_TOKEN", false, `HTTP ${response.status}`);
    }
  } catch (error) {
    record(
      "BLOB_READ_WRITE_TOKEN",
      false,
      error instanceof Error ? error.message : "Request failed",
    );
  }
}

async function testResend() {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) {
    record("RESEND_API_KEY", false, "Missing or empty");
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (response.ok) {
      record("RESEND_API_KEY", true, "API key valid");
    } else {
      record("RESEND_API_KEY", false, `HTTP ${response.status}`);
    }
  } catch (error) {
    record(
      "RESEND_API_KEY",
      false,
      error instanceof Error ? error.message : "Request failed",
    );
  }
}

async function testAiGateway() {
  const key = process.env.AI_GATEWAY_API_KEY?.trim();
  if (!key) {
    record("AI_GATEWAY_API_KEY", false, "Missing or empty");
    return;
  }

  try {
    const response = await fetch("https://ai-gateway.vercel.sh/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (response.ok) {
      record("AI_GATEWAY_API_KEY", true, "Gateway key valid");
    } else {
      record("AI_GATEWAY_API_KEY", false, `HTTP ${response.status}`);
    }
  } catch (error) {
    record(
      "AI_GATEWAY_API_KEY",
      false,
      error instanceof Error ? error.message : "Request failed",
    );
  }
}

async function testFirecrawl() {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) {
    record("FIRECRAWL_API_KEY", false, "Missing or empty");
    return;
  }

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/team/credit-usage", {
      headers: { Authorization: `Bearer ${key}` },
    });

    if (response.ok) {
      record("FIRECRAWL_API_KEY", true, "API key valid");
    } else {
      record("FIRECRAWL_API_KEY", false, `HTTP ${response.status}`);
    }
  } catch (error) {
    record(
      "FIRECRAWL_API_KEY",
      false,
      error instanceof Error ? error.message : "Request failed",
    );
  }
}

async function main() {
  required("NEXT_PUBLIC_APP_URL");
  required("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  required("CLERK_WEBHOOK_SECRET");
  required("NEXT_PUBLIC_CLERK_SIGN_IN_URL");
  required("NEXT_PUBLIC_CLERK_SIGN_UP_URL");

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim()) {
    record("NEXT_PUBLIC_POSTHOG_KEY", true, "Optional — not set (OK for dev)");
  } else {
    record("NEXT_PUBLIC_POSTHOG_KEY", true, "Set");
  }

  if (!process.env.GOOGLE_CLIENT_ID?.trim()) {
    record("GOOGLE_CLIENT_ID", true, "Optional for Sprint 1 — not set yet");
  } else {
    record("GOOGLE_CLIENT_ID", true, "Set");
  }

  if (!process.env.INNGEST_EVENT_KEY?.trim()) {
    record("INNGEST_EVENT_KEY", true, "Optional for Sprint 1 — not set yet");
  }

  await testDatabase();
  await testClerk();
  await testBlob();
  await testResend();
  await testAiGateway();
  await testFirecrawl();

  const failed = results.filter((result) => !result.ok);

  console.log("\nLocalSync env check\n");
  for (const result of results) {
    console.log(`${result.ok ? "✓" : "✗"} ${result.name}: ${result.detail}`);
  }

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
