const INVALID_KEY_CHARS = /[^a-zA-Z0-9._-]/g;

export function sanitizeFileName(fileName: string): string {
  const baseName = fileName.split("/").pop()?.split("\\").pop() ?? "file";
  const sanitized = baseName.replace(INVALID_KEY_CHARS, "_");
  return sanitized.length > 0 ? sanitized : "file";
}

export type DocumentKeyInput = {
  firmId: string;
  clientId: string;
  engagementId: string;
  documentId: string;
  versionNumber: number;
  fileName: string;
};

export function buildDocumentVersionObjectKey(input: DocumentKeyInput): string {
  const safeName = sanitizeFileName(input.fileName);

  return [
    "firms",
    input.firmId,
    "clients",
    input.clientId,
    "engagements",
    input.engagementId,
    "documents",
    input.documentId,
    `v${input.versionNumber}`,
    safeName,
  ].join("/");
}
