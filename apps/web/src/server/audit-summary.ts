export function formatAuditSummary(input: {
  action: string;
  entityType: string;
  metadata: Record<string, unknown>;
}): string {
  if (input.action === "upload") {
    return `Uploaded ${String(input.metadata.file_name ?? "file")}`;
  }

  if (input.action === "download") {
    return `Downloaded version ${String(input.metadata.version_number ?? "-")}`;
  }

  if (input.action === "status_change") {
    return `Status ${String(input.metadata.previous_status ?? "-")} -> ${String(input.metadata.new_status ?? "-")}`;
  }

  if (input.action === "bulk_update") {
    return `Bulk update ${String(input.metadata.count ?? "0")} documents`;
  }

  if (input.action === "permission_change") {
    return `${String(input.metadata.change ?? "change")} ${input.entityType}`;
  }

  if (input.action === "auth.login") {
    return "User logged in";
  }

  if (input.action === "auth.logout") {
    return "User logged out";
  }

  return `${input.action} on ${input.entityType}`;
}
