type BackgroundJobDispatch = {
  send: () => Promise<unknown>;
  runInline: () => Promise<unknown>;
};

/**
 * Queue durable work when Inngest is available, while keeping local workflows
 * usable when the event service is unavailable or misconfigured.
 */
export async function dispatchBackgroundJob({
  send,
  runInline,
}: BackgroundJobDispatch): Promise<"queued" | "inline"> {
  try {
    await send();
    return "queued";
  } catch {
    await runInline();
    return "inline";
  }
}
