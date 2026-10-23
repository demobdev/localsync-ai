import type { Metadata } from "next";
import { AgentWorkspacePreview } from "@/components/agent/agent-workspace-preview";

export const metadata: Metadata = {
  title: "Agent workspace preview",
  robots: { index: false, follow: false },
};

export default function AgentWorkspacePreviewPage() {
  return <AgentWorkspacePreview />;
}
