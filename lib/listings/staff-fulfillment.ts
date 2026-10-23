export type StaffReviewStatus = "needs_review" | "in_progress" | "needs_information";

export type StaffReviewState = {
  status: StaffReviewStatus;
  revision: number;
  assignedToUserId: string | null;
  lastNote: string | null;
  updatedAt: string | null;
};

export type StaffReviewAction = "claim" | "request_information" | "resume";

export const EMPTY_STAFF_REVIEW: StaffReviewState = {
  status: "needs_review",
  revision: 0,
  assignedToUserId: null,
  lastNote: null,
  updatedAt: null,
};

export function parseStaffReviewState(value: unknown): StaffReviewState {
  if (value == null) return { ...EMPTY_STAFF_REVIEW };
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Staff review state is unavailable. Reload before continuing.");
  const record = value as Record<string, unknown>;
  const status = record.status;
  const revision = record.revision;
  const assignedToUserId = record.assignedToUserId;
  const lastNote = record.lastNote;
  const updatedAt = record.updatedAt;
  if ((status !== "needs_review" && status !== "in_progress" && status !== "needs_information")
    || !Number.isSafeInteger(revision) || (revision as number) < 0
    || !(assignedToUserId === null || typeof assignedToUserId === "string")
    || !(lastNote === null || typeof lastNote === "string")
    || !(updatedAt === null || typeof updatedAt === "string")) {
    throw new Error("Staff review state is unavailable. Reload before continuing.");
  }
  return { status, revision: revision as number, assignedToUserId, lastNote, updatedAt };
}

function requiredNote(note: string) {
  const value = note.trim();
  if (!value) throw new Error("Add a short operational note before continuing.");
  if (value.length > 500) throw new Error("Operational notes must be 500 characters or fewer.");
  return value;
}

export function transitionStaffReview(input: {
  state: StaffReviewState;
  action: StaffReviewAction;
  actorUserId: string;
  note?: string;
  now: string;
}): StaffReviewState {
  if (!input.actorUserId.trim()) throw new Error("A signed-in staff identity is required.");
  if (!Number.isFinite(Date.parse(input.now))) throw new Error("A valid event time is required.");
  const state = input.state;

  if (input.action === "claim") {
    if (state.status !== "needs_review" || state.assignedToUserId) throw new Error("This case is already claimed or no longer needs review.");
    return { status: "in_progress", revision: state.revision + 1, assignedToUserId: input.actorUserId, lastNote: null, updatedAt: input.now };
  }

  const note = requiredNote(input.note ?? "");
  if (input.action === "request_information") {
    if (state.status !== "in_progress" || state.assignedToUserId !== input.actorUserId) throw new Error("Only the assigned staff member can request information on active work.");
    return { ...state, status: "needs_information", revision: state.revision + 1, lastNote: note, updatedAt: input.now };
  }

  if (state.status !== "needs_information" || state.assignedToUserId !== input.actorUserId) throw new Error("Only the assigned staff member can resume a case awaiting information.");
  return { ...state, status: "in_progress", revision: state.revision + 1, lastNote: note, updatedAt: input.now };
}
