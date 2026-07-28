import { Inngest } from "inngest";

export function shouldUseLocalInngestDevServer(nodeEnv = process.env.NODE_ENV) {
  return nodeEnv === "development";
}

export const inngest = new Inngest({
  id: "localsync-ai",
  isDev: shouldUseLocalInngestDevServer(),
});
