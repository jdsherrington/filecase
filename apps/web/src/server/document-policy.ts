import type { DocumentStatus, UserRole } from "@filecase/shared";

const FORWARD_TRANSITIONS: Readonly<Record<DocumentStatus, DocumentStatus[]>> =
  {
    uploaded: ["in_review"],
    in_review: ["final"],
    final: [],
  };

export function canTransitionDocumentStatus(input: {
  role: UserRole;
  currentStatus: DocumentStatus;
  nextStatus: DocumentStatus;
}): boolean {
  if (input.currentStatus === input.nextStatus) {
    return true;
  }

  if (input.currentStatus === "final" && input.nextStatus === "in_review") {
    return input.role === "admin" || input.role === "manager";
  }

  return FORWARD_TRANSITIONS[input.currentStatus].includes(input.nextStatus);
}
