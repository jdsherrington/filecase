import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@filecase/ui";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import JSZip from "jszip";
import { ArrowLeft, ArrowRight, MoreVertical, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { listClientsServerFn } from "../server/auth/server-fns";
import {
  bulkUpdateDocumentProfileServerFn,
  bulkUpdateDocumentStatusServerFn,
  getDocumentDownloadUrlServerFn,
  listDocumentsServerFn,
  listEngagementsServerFn,
  updateDocumentDetailsServerFn,
  updateDocumentStatusServerFn,
  uploadInitialDocumentServerFn,
} from "../server/document-fns";

type RecordsAreaMode = "records" | "templates" | "internal";
type DateAddedFilter = "all" | "7d" | "30d" | "90d";
type PageSize = "30" | "60" | "90" | "120";
type StatusFilter = "uploaded" | "in_review" | "final";
type SelectValueWithAll = "all" | StatusFilter;

type FilterOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type DocumentRow = Awaited<
  ReturnType<typeof listDocumentsServerFn>
>["items"][number];
type ClientRow = Awaited<ReturnType<typeof listClientsServerFn>>[number];
type EngagementRow = Awaited<
  ReturnType<typeof listEngagementsServerFn>
>[number];
type TableDisplayRow = {
  id: string;
  title: string;
  documentType: string;
  status: string;
  statusValue: StatusFilter;
  contact: string;
  clientId: string;
  engagementId: string;
  latestVersion: number;
  isDemo: boolean;
  filetype: string;
  dateAdded: string;
  dateModified: string;
};

type BulkEditSelection = {
  documentIds: string[];
  count: number;
  clientId: string;
  engagementId: string;
  status: StatusFilter | "";
};

const PAGE_SIZES: FilterOption<PageSize>[] = [
  { label: "30 rows per page", value: "30" },
  { label: "60 rows per page", value: "60" },
  { label: "90 rows per page", value: "90" },
  { label: "120 rows per page", value: "120" },
];

const STATUS_OPTIONS: FilterOption<SelectValueWithAll>[] = [
  { label: "Status", value: "all" },
  { label: "Uploaded", value: "uploaded" },
  { label: "In review", value: "in_review" },
  { label: "Final", value: "final" },
];

const DATE_ADDED_OPTIONS: FilterOption<DateAddedFilter>[] = [
  { label: "Added 7 days ago", value: "7d" },
  { label: "Added 30 days ago", value: "30d" },
  { label: "Added 90 days ago", value: "90d" },
  { label: "Any date", value: "all" },
];

function toUtcDayStart(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

function toDateAddedStart(value: DateAddedFilter): string | undefined {
  if (value === "all") {
    return undefined;
  }

  const days = Number.parseInt(value.replace("d", ""), 10);
  const boundary = new Date();
  boundary.setUTCDate(boundary.getUTCDate() - days);

  return toUtcDayStart(boundary);
}

function typeOptions(mode: RecordsAreaMode): FilterOption<string>[] {
  if (mode === "templates") {
    return [{ label: "Template", value: "template" }];
  }

  if (mode === "internal") {
    return [
      { label: "Internal", value: "internal" },
      { label: "Policy", value: "policy" },
      { label: "HR", value: "hr" },
    ];
  }

  return [
    { label: "Template", value: "template" },
    { label: "Internal", value: "internal" },
    { label: "Policy", value: "policy" },
    { label: "HR", value: "hr" },
  ];
}

function areaSearchPlaceholder(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "Search templates";
  }

  if (mode === "internal") {
    return "Search internal records";
  }

  return "Search records";
}

function areaLoadingMessage(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "Loading templates...";
  }

  if (mode === "internal") {
    return "Loading internal records...";
  }

  return "Loading records...";
}

function areaEmptyMessage(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "No templates match these filters.";
  }

  if (mode === "internal") {
    return "No internal records match these filters.";
  }

  return "No records match these filters.";
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  const date = new Date(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  const hour24 = date.getHours();
  const hour12 = hour24 % 12 || 12;
  const hours = String(hour12).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes} ${period}`;
}

function formatFiletype(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "-";
  }

  if (trimmed.startsWith(".")) {
    return trimmed.toUpperCase();
  }

  return `.${trimmed.toUpperCase()}`;
}

function sanitizeFileNameSegment(value: string): string {
  const sanitized = value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-");
  return sanitized.length > 0 ? sanitized : "record";
}

function zipFileName(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return `records-${year}${month}${day}-${hours}${minutes}${seconds}.zip`;
}

function singleValueOrEmpty(values: string[]): string {
  const first = values[0];
  if (!first) {
    return "";
  }

  return values.every((value) => value === first) ? first : "";
}

function buildDemoRows(offset: number, limit: number): TableDisplayRow[] {
  return Array.from({ length: limit }, (_, index) => ({
    id: `demo-${offset + index + 1}`,
    title: "Example document title",
    documentType: "pdf",
    status: "Final",
    statusValue: "final",
    contact: "ACME Engineering Pty Ltd",
    clientId: "",
    engagementId: "",
    latestVersion: 1,
    isDemo: true,
    filetype: ".PDF",
    dateAdded: "06/02/2026 01:54 PM",
    dateModified: "08/02/2026 10:04 AM",
  }));
}

type FilterSelectProps<TValue extends string> = {
  value: TValue;
  options: FilterOption<TValue>[];
  activeWhen?: (value: TValue) => boolean;
  className?: string;
  onValueChange: (value: TValue) => void;
};

function FilterSelect<TValue extends string>({
  value,
  options,
  activeWhen,
  className,
  onValueChange,
}: FilterSelectProps<TValue>) {
  const isActive = activeWhen ? activeWhen(value) : true;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "fc-filter-control",
          isActive ? "fc-filter-control-active" : "fc-filter-control-muted",
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="fc-filter-content">
        {options.map((option) => (
          <SelectItem
            className="fc-filter-item"
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatCreateRecordError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Failed to add record.";
  }

  if (error.message === "FORBIDDEN") {
    return "You do not have permission to add records to that engagement.";
  }

  if (error.message === "NOT_FOUND") {
    return "The selected client or engagement was not found.";
  }

  if (error.message === "FILE_TOO_LARGE") {
    return "The selected file is too large.";
  }

  if (error.message === "UNSUPPORTED_MIME_TYPE") {
    return "This file type is not supported.";
  }

  if (error.message.startsWith("MISSING_FIELD:")) {
    return "Please complete all required fields.";
  }

  if (error.message.startsWith("MISSING_FILE:")) {
    return "Please choose a file to upload.";
  }

  return error.message.length > 0 ? error.message : "Failed to add record.";
}

function formatContextActionError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Action failed.";
  }

  if (error.message === "FORBIDDEN") {
    return "You do not have permission to perform that action.";
  }

  if (error.message === "NOT_FOUND") {
    return "That record is no longer available.";
  }

  if (error.message === "INVALID_STATUS_TRANSITION") {
    return "That status change is not allowed.";
  }

  if (error.message === "NO_DOCUMENTS") {
    return "No records are selected.";
  }

  if (error.message === "DOWNLOAD_FETCH_FAILED") {
    return "Could not download one or more record files.";
  }

  return error.message.length > 0 ? error.message : "Action failed.";
}

function formatEditRecordError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Failed to update record.";
  }

  if (error.message === "FORBIDDEN") {
    return "You do not have permission to edit this record.";
  }

  if (error.message === "NOT_FOUND") {
    return "This record could not be found.";
  }

  if (error.message === "MISSING_FIELD") {
    return "Please complete all required fields.";
  }

  return error.message.length > 0 ? error.message : "Failed to update record.";
}

type EditableRecord = {
  id: string;
  title: string;
  documentType: string;
};

type AddRecordDialogProps = {
  clients: ClientRow[];
  mode: RecordsAreaMode;
  open: boolean;
  onOpenChange: (nextOpen: boolean) => void;
  onRecordCreated: () => Promise<void>;
};

function defaultDocumentTypeForMode(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "template";
  }

  if (mode === "internal") {
    return "internal";
  }

  return "";
}

function AddRecordDialog({
  clients,
  mode,
  open,
  onOpenChange,
  onRecordCreated,
}: AddRecordDialogProps) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState(
    defaultDocumentTypeForMode(mode),
  );
  const [clientId, setClientId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setTitle("");
    setDocumentType(defaultDocumentTypeForMode(mode));
    setClientId("");
    setEngagementId("");
    setFile(null);
    setFileInputKey((current) => current + 1);
    setError(null);
  };

  useEffect(() => {
    setDocumentType(defaultDocumentTypeForMode(mode));
  }, [mode]);

  const engagementsQuery = useQuery(
    queryOptions({
      enabled: open && clientId.length > 0,
      queryKey: ["records-area-engagements", clientId],
      queryFn: () => listEngagementsServerFn({ data: { clientId } }),
    }),
  );

  const addRecordMutation = useMutation({
    mutationFn: async () => {
      const trimmedTitle = title.trim();
      const trimmedDocumentType = documentType.trim();

      if (trimmedTitle.length === 0) {
        throw new Error("MISSING_FIELD:title");
      }

      if (trimmedDocumentType.length === 0) {
        throw new Error("MISSING_FIELD:document_type");
      }

      if (clientId.length === 0) {
        throw new Error("MISSING_FIELD:client_id");
      }

      if (engagementId.length === 0) {
        throw new Error("MISSING_FIELD:engagement_id");
      }

      if (!file) {
        throw new Error("MISSING_FILE:file");
      }

      const formData = new FormData();
      formData.set("title", trimmedTitle);
      formData.set("document_type", trimmedDocumentType);
      formData.set("client_id", clientId);
      formData.set("engagement_id", engagementId);
      formData.set("file", file);

      return uploadInitialDocumentServerFn({ data: formData });
    },
    onSuccess: async () => {
      setError(null);
      await onRecordCreated();
      onOpenChange(false);
      resetForm();
    },
    onError: (mutationError) => {
      setError(formatCreateRecordError(mutationError));
    },
  });

  const engagementOptions: EngagementRow[] = engagementsQuery.data ?? [];
  const hasAllRequiredFields =
    title.trim().length > 0 &&
    documentType.trim().length > 0 &&
    clientId.length > 0 &&
    engagementId.length > 0 &&
    file !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);

        if (!nextOpen) {
          addRecordMutation.reset();
          resetForm();
        }
      }}
    >
      <DialogContent className="border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-0 sm:max-w-xl">
        <DialogHeader className="rounded-t-lg border-b border-[color:var(--fc-content-border)] bg-[color:color-mix(in_oklch,var(--foreground)_6%,var(--fc-surface)_94%)] px-5 py-4">
          <DialogTitle className="text-sm font-semibold tracking-[0.04em] uppercase">
            Add Record
          </DialogTitle>
          <DialogDescription className="text-xs">
            Upload a new record and link it to a client engagement.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            addRecordMutation.mutate();
          }}
        >
          <div className="space-y-1">
            <label
              className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
              htmlFor="add-record-title"
            >
              Record Title
            </label>
            <Input
              autoComplete="off"
              className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
              id="add-record-title"
              placeholder="e.g. Q4 Payroll Summary"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
                htmlFor="add-record-type"
              >
                Filetype
              </label>
              <Input
                autoComplete="off"
                className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
                id="add-record-type"
                placeholder="e.g. Policy"
                required
                value={documentType}
                onChange={(event) => setDocumentType(event.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label
                className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
                htmlFor="add-record-client"
              >
                Client
              </label>
              <Select
                value={clientId}
                onValueChange={(nextValue) => {
                  setClientId(nextValue);
                  setEngagementId("");
                }}
              >
                <SelectTrigger
                  aria-label="Client"
                  className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
                  id="add-record-client"
                >
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="border-[color:var(--fc-content-border)]">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
                htmlFor="add-record-engagement"
              >
                Engagement
              </label>
              <Select
                disabled={
                  addRecordMutation.isPending ||
                  clientId.length === 0 ||
                  engagementsQuery.isLoading ||
                  engagementOptions.length === 0
                }
                value={engagementId}
                onValueChange={(nextValue) => setEngagementId(nextValue)}
              >
                <SelectTrigger
                  aria-label="Engagement"
                  className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
                  id="add-record-engagement"
                >
                  <SelectValue
                    placeholder={
                      clientId.length === 0
                        ? "Choose a client first"
                        : engagementsQuery.isLoading
                          ? "Loading engagements..."
                          : engagementOptions.length === 0
                            ? "No engagements available"
                            : "Select engagement"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="border-[color:var(--fc-content-border)]">
                  {engagementOptions.map((engagement) => (
                    <SelectItem key={engagement.id} value={engagement.id}>
                      {engagement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
                htmlFor="add-record-file"
              >
                File
              </label>
              <Input
                key={fileInputKey}
                className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm file:mr-3 file:border-0 file:bg-transparent file:text-xs file:font-semibold file:text-foreground"
                id="add-record-file"
                name="file"
                required
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 border-t border-[color:var(--fc-content-border)] pt-4">
            <Button
              className="h-9 border-[color:var(--fc-content-border)] text-xs"
              disabled={addRecordMutation.isPending}
              type="button"
              variant="outline"
              onClick={() => {
                addRecordMutation.reset();
                resetForm();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-9 gap-1.5 px-4 text-xs font-semibold"
              disabled={!hasAllRequiredFields || addRecordMutation.isPending}
              type="submit"
            >
              {addRecordMutation.isPending ? "Adding..." : "Add Record"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type EditRecordDialogProps = {
  open: boolean;
  record: EditableRecord | null;
  onOpenChange: (nextOpen: boolean) => void;
  onRecordUpdated: () => Promise<void>;
};

function EditRecordDialog({
  open,
  record,
  onOpenChange,
  onRecordUpdated,
}: EditRecordDialogProps) {
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    setTitle(record.title);
    setDocumentType(record.documentType);
    setError(null);
  }, [open, record]);

  const editRecordMutation = useMutation({
    mutationFn: async () => {
      if (!record) {
        throw new Error("NOT_FOUND");
      }

      return updateDocumentDetailsServerFn({
        data: {
          documentId: record.id,
          title: title.trim(),
          documentType: documentType.trim(),
        },
      });
    },
    onSuccess: async () => {
      setError(null);
      await onRecordUpdated();
      onOpenChange(false);
    },
    onError: (mutationError) => {
      setError(formatEditRecordError(mutationError));
    },
  });

  const canSubmit = title.trim().length > 0 && documentType.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          editRecordMutation.reset();
          setError(null);
        }
      }}
    >
      <DialogContent className="border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-0 sm:max-w-xl">
        <DialogHeader className="rounded-t-lg border-b border-[color:var(--fc-content-border)] bg-[color:color-mix(in_oklch,var(--foreground)_6%,var(--fc-surface)_94%)] px-5 py-4">
          <DialogTitle className="text-sm font-semibold tracking-[0.04em] uppercase">
            Edit Profile
          </DialogTitle>
          <DialogDescription className="text-xs">
            Update this record&apos;s details.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            editRecordMutation.mutate();
          }}
        >
          <div className="space-y-1">
            <label
              className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
              htmlFor="edit-record-title"
            >
              Record Title
            </label>
            <Input
              autoComplete="off"
              className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
              id="edit-record-title"
              placeholder="e.g. Q4 Payroll Summary"
              required
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label
              className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
              htmlFor="edit-record-type"
            >
              Filetype
            </label>
            <Input
              autoComplete="off"
              className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
              id="edit-record-type"
              placeholder="e.g. Policy"
              required
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 border-t border-[color:var(--fc-content-border)] pt-4">
            <Button
              className="h-9 border-[color:var(--fc-content-border)] text-xs"
              disabled={editRecordMutation.isPending}
              type="button"
              variant="outline"
              onClick={() => {
                editRecordMutation.reset();
                setError(null);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-9 gap-1.5 px-4 text-xs font-semibold"
              disabled={!canSubmit || editRecordMutation.isPending}
              type="submit"
            >
              {editRecordMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type BulkEditRecordDialogProps = {
  clients: ClientRow[];
  open: boolean;
  selection: BulkEditSelection | null;
  onOpenChange: (nextOpen: boolean) => void;
  onRecordsUpdated: () => Promise<void>;
};

function BulkEditRecordDialog({
  clients,
  open,
  selection,
  onOpenChange,
  onRecordsUpdated,
}: BulkEditRecordDialogProps) {
  const [clientId, setClientId] = useState("");
  const [engagementId, setEngagementId] = useState("");
  const [status, setStatus] = useState<StatusFilter | "">("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !selection) {
      return;
    }

    setClientId(selection.clientId);
    setEngagementId(selection.engagementId);
    setStatus(selection.status);
    setError(null);
  }, [open, selection]);

  const engagementsQuery = useQuery(
    queryOptions({
      enabled: open && clientId.length > 0,
      queryKey: ["records-area-bulk-edit-engagements", clientId],
      queryFn: () => listEngagementsServerFn({ data: { clientId } }),
    }),
  );

  const engagementOptions: EngagementRow[] = engagementsQuery.data ?? [];

  useEffect(() => {
    if (engagementId.length === 0) {
      return;
    }

    if (!engagementOptions.some((engagement) => engagement.id === engagementId)) {
      setEngagementId("");
    }
  }, [engagementId, engagementOptions]);

  const bulkEditMutation = useMutation({
    mutationFn: async () => {
      if (!selection || selection.documentIds.length === 0) {
        throw new Error("NO_DOCUMENTS");
      }

      if (
        status !== "uploaded" &&
        status !== "in_review" &&
        status !== "final"
      ) {
        throw new Error("MISSING_FIELD:status");
      }

      return bulkUpdateDocumentProfileServerFn({
        data: {
          documentIds: selection.documentIds,
          clientId,
          engagementId,
          status,
        },
      });
    },
    onSuccess: async () => {
      setError(null);
      await onRecordsUpdated();
      onOpenChange(false);
    },
    onError: (mutationError) => {
      setError(formatContextActionError(mutationError));
    },
  });

  const canSubmit =
    (selection?.documentIds.length ?? 0) > 0 &&
    clientId.length > 0 &&
    engagementId.length > 0 &&
    status.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          bulkEditMutation.reset();
          setError(null);
        }
      }}
    >
      <DialogContent className="border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-0 sm:max-w-xl">
        <DialogHeader className="rounded-t-lg border-b border-[color:var(--fc-content-border)] bg-[color:color-mix(in_oklch,var(--foreground)_6%,var(--fc-surface)_94%)] px-5 py-4">
          <DialogTitle className="text-sm font-semibold tracking-[0.04em] uppercase">
            Bulk Edit Profile
          </DialogTitle>
          <DialogDescription className="text-xs">
            Apply changes to {selection?.count ?? 0} selected records.
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            if (!canSubmit) {
              setError("Please complete all required fields.");
              return;
            }

            bulkEditMutation.mutate();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label
                className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
                htmlFor="bulk-edit-client"
              >
                Client
              </label>
              <Select
                value={clientId}
                onValueChange={(nextValue) => {
                  setClientId(nextValue);
                  setEngagementId("");
                }}
              >
                <SelectTrigger
                  aria-label="Client"
                  className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
                  id="bulk-edit-client"
                >
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent className="border-[color:var(--fc-content-border)]">
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
                htmlFor="bulk-edit-engagement"
              >
                Engagement
              </label>
              <Select
                disabled={
                  bulkEditMutation.isPending ||
                  clientId.length === 0 ||
                  engagementsQuery.isLoading ||
                  engagementOptions.length === 0
                }
                value={engagementId}
                onValueChange={(nextValue) => setEngagementId(nextValue)}
              >
                <SelectTrigger
                  aria-label="Engagement"
                  className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
                  id="bulk-edit-engagement"
                >
                  <SelectValue
                    placeholder={
                      clientId.length === 0
                        ? "Choose a client first"
                        : engagementsQuery.isLoading
                          ? "Loading engagements..."
                          : engagementOptions.length === 0
                            ? "No engagements available"
                            : "Select engagement"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="border-[color:var(--fc-content-border)]">
                  {engagementOptions.map((engagement) => (
                    <SelectItem key={engagement.id} value={engagement.id}>
                      {engagement.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <label
              className="text-[0.68rem] font-semibold tracking-[0.055em] uppercase text-muted-foreground"
              htmlFor="bulk-edit-status"
            >
              Status
            </label>
            <Select
              value={status}
              onValueChange={(nextValue) => setStatus(nextValue as StatusFilter)}
            >
              <SelectTrigger
                aria-label="Status"
                className="h-10 border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] text-sm"
                id="bulk-edit-status"
              >
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="border-[color:var(--fc-content-border)]">
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 border-t border-[color:var(--fc-content-border)] pt-4">
            <Button
              className="h-9 border-[color:var(--fc-content-border)] text-xs"
              disabled={bulkEditMutation.isPending}
              type="button"
              variant="outline"
              onClick={() => {
                bulkEditMutation.reset();
                setError(null);
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-9 gap-1.5 px-4 text-xs font-semibold"
              disabled={!canSubmit || bulkEditMutation.isPending}
              type="submit"
            >
              {bulkEditMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function modeDocumentTypeBaseline(mode: RecordsAreaMode): string[] | undefined {
  if (mode === "templates") {
    return ["template"];
  }

  if (mode === "internal") {
    return ["internal"];
  }

  return undefined;
}

function defaultDateAddedFilter(): DateAddedFilter {
  return "7d";
}

function defaultPageSize(): PageSize {
  return "30";
}

function defaultContactFilter(
  mode: RecordsAreaMode,
  presetClientId?: string,
): string {
  if (mode === "templates") {
    return "none";
  }

  return presetClientId && presetClientId.length > 0 ? presetClientId : "all";
}

function defaultFileTypeFilter(_mode: RecordsAreaMode): string {
  return "all";
}

function isSetEqual(left: Set<string>, right: Set<string>): boolean {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function isEditableElement(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  if (element.isContentEditable) {
    return true;
  }

  const tagName = element.tagName;
  if (tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT") {
    return true;
  }

  return Boolean(element.closest("[contenteditable='true']"));
}

export function RecordsArea({
  mode,
  presetClientId,
}: {
  mode: RecordsAreaMode;
  presetClientId?: string;
}) {
  const recordsShellRef = useRef<HTMLDivElement | null>(null);
  const tableShellRef = useRef<HTMLElement | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const contactDefaultValue = defaultContactFilter(mode, presetClientId);
  const dateDefaultValue = defaultDateAddedFilter();
  const pageSizeDefaultValue = defaultPageSize();
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState<SelectValueWithAll>("all");
  const [dateAdded, setDateAdded] = useState<DateAddedFilter>(dateDefaultValue);
  const [pageSize, setPageSize] = useState<PageSize>(pageSizeDefaultValue);
  const [contactValue, setContactValue] = useState<string>(contactDefaultValue);
  const [fileTypeValue, setFileTypeValue] = useState<string>(
    defaultFileTypeFilter(mode),
  );
  const [offset, setOffset] = useState(0);
  const [addRecordOpen, setAddRecordOpen] = useState(false);
  const [editRecordOpen, setEditRecordOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditSelection, setBulkEditSelection] =
    useState<BulkEditSelection | null>(null);
  const [recordBeingEdited, setRecordBeingEdited] = useState<EditableRecord | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(
    null,
  );
  const [activeContextRowId, setActiveContextRowId] = useState<string | null>(
    null,
  );
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({
    x: 0,
    y: 0,
  });
  const [contextActionError, setContextActionError] = useState<string | null>(
    null,
  );
  const [hasTableHorizontalOffset, setHasTableHorizontalOffset] = useState(false);

  useEffect(() => {
    setContactValue(contactDefaultValue);
  }, [contactDefaultValue]);

  const clientsQuery = useQuery(
    queryOptions({
      queryKey: ["records-area-clients"],
      queryFn: () => listClientsServerFn(),
    }),
  );

  const clientOptions = useMemo<FilterOption<string>[]>(() => {
    if (mode === "templates") {
      return [{ label: "Not linked", value: "none" }];
    }

    const items = clientsQuery.data ?? [];

    return [
      { label: "Contact/s", value: "all" },
      ...items.map((client) => ({
        label: client.name,
        value: client.id,
      })),
    ];
  }, [clientsQuery.data, mode]);

  const fileTypeOptions = useMemo<FilterOption<string>[]>(
    () => [{ label: "File Type", value: "all" }, ...typeOptions(mode)],
    [mode],
  );

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>();

    for (const client of clientsQuery.data ?? []) {
      map.set(client.id, client.name);
    }

    return map;
  }, [clientsQuery.data]);

  const limit = Number.parseInt(pageSize, 10);

  const documentsQuery = useQuery(
    queryOptions({
      queryKey: [
        "records-area-documents",
        mode,
        search,
        statusValue,
        dateAdded,
        pageSize,
        contactValue,
        fileTypeValue,
        offset,
      ],
      queryFn: () =>
        listDocumentsServerFn({
          data: {
            q: search || undefined,
            statuses:
              statusValue === "all" ? undefined : [statusValue as StatusFilter],
            uploadedDateStart: toDateAddedStart(dateAdded),
            clientIds:
              mode === "templates" || contactValue === "all"
                ? undefined
                : [contactValue],
            documentTypes:
              fileTypeValue === "all"
                ? modeDocumentTypeBaseline(mode)
                : [fileTypeValue],
            sortBy: "updated_at",
            sortDirection: "desc",
            limit,
            offset,
          },
        }),
    }),
  );

  const rows = documentsQuery.data?.items ?? [];
  const sourceTotal = documentsQuery.data?.total ?? 0;
  const showDemoRows =
    mode === "records" &&
    !documentsQuery.isLoading &&
    rows.length === 0 &&
    sourceTotal === 0 &&
    search.trim().length === 0 &&
    statusValue === "all" &&
    dateAdded === dateDefaultValue &&
    fileTypeValue === "all" &&
    contactValue === contactDefaultValue;
  const demoRows = useMemo(() => buildDemoRows(offset, limit), [limit, offset]);
  const tableRows = useMemo<TableDisplayRow[]>(() => {
    if (showDemoRows) {
      return demoRows;
    }

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      documentType: row.documentType,
      status: formatStatus(row.status),
      statusValue: row.status,
      contact:
        mode === "internal"
          ? row.latestUploadedBy === "-"
            ? "General"
            : row.latestUploadedBy
          : mode === "templates"
            ? "Not linked"
            : (clientNameById.get(row.clientId) ?? "Unknown"),
      clientId: row.clientId,
      engagementId: row.engagementId,
      latestVersion: row.latestVersion,
      isDemo: false,
      filetype: formatFiletype(row.documentType),
      dateAdded: formatDate(row.createdAt),
      dateModified: formatDate(row.updatedAt),
    }));
  }, [clientNameById, demoRows, mode, rows, showDemoRows]);
  const tableRowsById = useMemo(
    () => new Map(tableRows.map((row) => [row.id, row])),
    [tableRows],
  );
  const tableRowIndexes = useMemo(
    () => new Map(tableRows.map((row, index) => [row.id, index])),
    [tableRows],
  );
  const total = showDemoRows ? 87 : sourceTotal;
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const pageNumber = Math.floor(offset / limit) + 1;
  const hasNextPage = offset + limit < total;

  useEffect(() => {
    setSelectedIds((current) => {
      const availableIds = new Set(tableRows.map((row) => row.id));
      const preserved = new Set(
        [...current].filter((id) => availableIds.has(id)),
      );

      if (tableRows.length === 0) {
        return current.size === 0 ? current : preserved;
      }

      if (preserved.size > 0) {
        return isSetEqual(current, preserved) ? current : preserved;
      }

      const seeded = new Set(
        [tableRows[4], tableRows[5], tableRows[9]]
          .filter((row): row is TableDisplayRow => Boolean(row))
          .map((row) => row.id),
      );

      return isSetEqual(current, seeded) ? current : seeded;
    });
  }, [tableRows]);

  useEffect(() => {
    setSelectionAnchorId((currentAnchorId) => {
      const topMostSelectedId =
        tableRows.find((row) => selectedIds.has(row.id))?.id ?? null;

      return currentAnchorId === topMostSelectedId
        ? currentAnchorId
        : topMostSelectedId;
    });
  }, [selectedIds, tableRows]);

  useEffect(() => {
    if (!activeContextRowId) {
      return;
    }

    if (!tableRowsById.has(activeContextRowId)) {
      setActiveContextRowId(null);
      setContextMenuOpen(false);
    }
  }, [activeContextRowId, tableRowsById]);

  useEffect(() => {
    const shell = tableShellRef.current;
    const scroller = shell?.querySelector<HTMLDivElement>(":scope > div");
    if (!scroller) {
      setHasTableHorizontalOffset(false);
      return;
    }

    const updateShadowState = () => {
      const next = scroller.scrollLeft > 0;
      setHasTableHorizontalOffset((current) =>
        current === next ? current : next,
      );
    };

    updateShadowState();
    scroller.addEventListener("scroll", updateShadowState, { passive: true });
    window.addEventListener("resize", updateShadowState);

    return () => {
      scroller.removeEventListener("scroll", updateShadowState);
      window.removeEventListener("resize", updateShadowState);
    };
  }, [tableRows]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || addRecordOpen || editRecordOpen || bulkEditOpen) {
        return;
      }

      const shell = recordsShellRef.current;
      if (!shell) {
        return;
      }

      const targetElement =
        event.target instanceof HTMLElement ? event.target : null;
      const activeElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      const withinRecordsShell =
        (targetElement !== null && shell.contains(targetElement)) ||
        (activeElement !== null && shell.contains(activeElement));

      if (!withinRecordsShell) {
        return;
      }

      if (isEditableElement(targetElement) || isEditableElement(activeElement)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setContextMenuOpen(false);
        setActiveContextRowId(null);
        setSelectedIds((current) => (current.size === 0 ? current : new Set()));
        setSelectionAnchorId(null);
        return;
      }

      const isSelectAllHotkey =
        !event.altKey &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "a";
      if (!isSelectAllHotkey) {
        return;
      }

      event.preventDefault();
      setContextMenuOpen(false);
      setActiveContextRowId(null);
      setSelectedIds((current) => {
        const next = new Set(tableRows.map((row) => row.id));
        return isSetEqual(current, next) ? current : next;
      });
      setSelectionAnchorId(tableRows[0]?.id ?? null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [addRecordOpen, bulkEditOpen, editRecordOpen, tableRows]);

  const selectedCount = tableRows.reduce(
    (count, row) => (selectedIds.has(row.id) ? count + 1 : count),
    0,
  );
  const selectedRows = useMemo(
    () => tableRows.filter((row) => selectedIds.has(row.id)),
    [selectedIds, tableRows],
  );
  const contextRows = useMemo(() => {
    if (!activeContextRowId) {
      return [];
    }

    const activeRow = tableRowsById.get(activeContextRowId);
    if (!activeRow) {
      return [];
    }

    if (selectedRows.length > 1 && selectedIds.has(activeContextRowId)) {
      return selectedRows;
    }

    return [activeRow];
  }, [activeContextRowId, selectedIds, selectedRows, tableRowsById]);
  const isBulkContextSelection = contextRows.length > 1;
  const activeContextRow = isBulkContextSelection
    ? null
    : (contextRows[0] ?? null);
  const contextDocumentIds = contextRows.map((row) => row.id);
  const contextHasDemoRow = contextRows.some((row) => row.isDemo);
  const allSelected =
    tableRows.length > 0 && selectedCount === tableRows.length;
  const someSelected = selectedCount > 0 && selectedCount < tableRows.length;

  const clearFilters = () => {
    setOffset(0);
    setSearch("");
    setStatusValue("all");
    setDateAdded(dateDefaultValue);
    setPageSize(pageSizeDefaultValue);
    setContactValue(contactDefaultValue);
    setFileTypeValue(defaultFileTypeFilter(mode));
  };

  const refreshRecordsAfterCreate = async () => {
    setOffset(0);
    await queryClient.invalidateQueries({
      queryKey: ["records-area-documents"],
    });
  };

  const refreshRecordsAfterEdit = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["records-area-documents"],
    });
  };

  const statusMutation = useMutation({
    mutationFn: (input: { documentId: string; nextStatus: StatusFilter }) =>
      updateDocumentStatusServerFn({
        data: {
          documentId: input.documentId,
          nextStatus: input.nextStatus,
        },
      }),
    onSuccess: async () => {
      setContextActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["records-area-documents"],
      });
    },
    onError: (error) => {
      setContextActionError(formatContextActionError(error));
    },
  });

  const bulkStatusMutation = useMutation({
    mutationFn: (input: { documentIds: string[]; nextStatus: StatusFilter }) =>
      bulkUpdateDocumentStatusServerFn({
        data: {
          documentIds: input.documentIds,
          nextStatus: input.nextStatus,
        },
      }),
    onSuccess: async () => {
      setContextActionError(null);
      await queryClient.invalidateQueries({
        queryKey: ["records-area-documents"],
      });
    },
    onError: (error) => {
      setContextActionError(formatContextActionError(error));
    },
  });

  const downloadMutation = useMutation({
    mutationFn: (input: { documentId: string; versionNumber: number }) =>
      getDocumentDownloadUrlServerFn({
        data: {
          documentId: input.documentId,
          versionNumber: input.versionNumber,
        },
      }),
    onSuccess: (result) => {
      setContextActionError(null);
      window.location.assign(result.url);
    },
    onError: (error) => {
      setContextActionError(formatContextActionError(error));
    },
  });

  const bulkDownloadMutation = useMutation({
    mutationFn: async (
      input: Array<{ id: string; title: string; versionNumber: number }>,
    ) => {
      if (input.length === 0) {
        throw new Error("NO_DOCUMENTS");
      }

      const zip = new JSZip();
      const seenNameCounts = new Map<string, number>();

      await Promise.all(
        input.map(async (item) => {
          const download = await getDocumentDownloadUrlServerFn({
            data: {
              documentId: item.id,
              versionNumber: item.versionNumber,
            },
          });

          const response = await fetch(download.url);
          if (!response.ok) {
            throw new Error("DOWNLOAD_FETCH_FAILED");
          }

          const fileBuffer = await response.arrayBuffer();
          const rawName = download.fileName.trim().length
            ? download.fileName
            : `${item.title}.bin`;
          const cleanName = sanitizeFileNameSegment(rawName);
          const previousCount = seenNameCounts.get(cleanName) ?? 0;
          const nextCount = previousCount + 1;
          seenNameCounts.set(cleanName, nextCount);

          const zipName =
            previousCount === 0
              ? cleanName
              : `${cleanName.replace(/(\.[^.]+)?$/, "")}-${nextCount}${cleanName.match(/(\.[^.]+)$/)?.[0] ?? ""}`;

          zip.file(zipName, fileBuffer);
        }),
      );

      return zip.generateAsync({ type: "blob" });
    },
    onSuccess: (zipBlob) => {
      setContextActionError(null);
      const objectUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = zipFileName();
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    },
    onError: (error) => {
      setContextActionError(formatContextActionError(error));
    },
  });

  const copyRecordLink = async (row: TableDisplayRow) => {
    if (row.isDemo || typeof window === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/documents/${row.id}`,
      );
      setContextActionError(null);
    } catch {
      setContextActionError("Could not copy the record link.");
    }
  };

  const selectSingleRow = (rowId: string) => {
    setSelectionAnchorId(rowId);
    setSelectedIds((current) => {
      const next = new Set([rowId]);
      return isSetEqual(current, next) ? current : next;
    });
  };

  const addRowToSelection = (rowId: string) => {
    setSelectionAnchorId((currentAnchorId) => currentAnchorId ?? rowId);
    setSelectedIds((current) => {
      if (current.has(rowId)) {
        return current;
      }

      const next = new Set(current);
      next.add(rowId);
      return next;
    });
  };

  const selectRangeToRow = (rowId: string) => {
    const rowIndex = tableRowIndexes.get(rowId);
    const selectedIndexes = tableRows
      .map((row, index) => (selectedIds.has(row.id) ? index : -1))
      .filter((index) => index >= 0);
    let anchorId =
      selectionAnchorId ??
      tableRows.find((row) => selectedIds.has(row.id))?.id ??
      rowId;

    if (rowIndex !== undefined && selectedIndexes.length > 1) {
      const topSelectedIndex = selectedIndexes[0];
      const bottomSelectedIndex = selectedIndexes[selectedIndexes.length - 1];

      if (topSelectedIndex !== undefined && bottomSelectedIndex !== undefined) {
        if (rowIndex < topSelectedIndex) {
          const bottomSelectedRow = tableRows[bottomSelectedIndex];
          if (bottomSelectedRow) {
            anchorId = bottomSelectedRow.id;
          }
        } else if (rowIndex > bottomSelectedIndex) {
          const topSelectedRow = tableRows[topSelectedIndex];
          if (topSelectedRow) {
            anchorId = topSelectedRow.id;
          }
        }
      }
    }

    const anchorIndex = tableRowIndexes.get(anchorId);

    if (anchorIndex === undefined || rowIndex === undefined) {
      selectSingleRow(rowId);
      return;
    }

    const rangeStart = Math.min(anchorIndex, rowIndex);
    const rangeEnd = Math.max(anchorIndex, rowIndex);
    const next = new Set(
      tableRows
        .slice(rangeStart, rangeEnd + 1)
        .map((tableRow) => tableRow.id),
    );

    setSelectionAnchorId(anchorId);
    setSelectedIds((current) => (isSetEqual(current, next) ? current : next));
  };

  const toggleRowSelection = (rowId: string) => {
    setSelectionAnchorId((currentAnchorId) =>
      currentAnchorId ? currentAnchorId : rowId,
    );
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }

      return isSetEqual(next, current) ? current : next;
    });
  };

  const selectContextRow = (rowId: string) => {
    setContextActionError(null);
    setActiveContextRowId(rowId);
    setSelectionAnchorId((currentAnchorId) => currentAnchorId ?? rowId);
    setSelectedIds((current) => {
      if (current.size > 1 && current.has(rowId)) {
        return current;
      }

      const next = new Set([rowId]);
      return isSetEqual(current, next) ? current : next;
    });
  };

  const openContextMenuAt = (x: number, y: number) => {
    setContextMenuPosition({ x, y });
    setContextMenuOpen(true);
  };

  const openEditRecordDialog = (row: TableDisplayRow) => {
    if (row.isDemo) {
      return;
    }

    setContextMenuOpen(false);
    setRecordBeingEdited({
      id: row.id,
      title: row.title,
      documentType: row.documentType,
    });
    setEditRecordOpen(true);
  };

  const openBulkEditDialog = (rows: TableDisplayRow[]) => {
    const editableRows = rows.filter((row) => !row.isDemo);
    if (editableRows.length === 0) {
      return;
    }

    setContextMenuOpen(false);
    setBulkEditSelection({
      documentIds: editableRows.map((row) => row.id),
      count: editableRows.length,
      clientId: singleValueOrEmpty(editableRows.map((row) => row.clientId)),
      engagementId: singleValueOrEmpty(
        editableRows.map((row) => row.engagementId),
      ),
      status: singleValueOrEmpty(editableRows.map((row) => row.statusValue)) as
        | StatusFilter
        | "",
    });
    setBulkEditOpen(true);
  };

  const applyContextStatusChange = (nextStatus: StatusFilter) => {
    if (contextRows.length === 0 || contextHasDemoRow) {
      return;
    }

    if (isBulkContextSelection) {
      bulkStatusMutation.mutate({
        documentIds: contextDocumentIds,
        nextStatus,
      });
      return;
    }

    const row = contextRows[0];
    if (!row) {
      return;
    }

    statusMutation.mutate({
      documentId: row.id,
      nextStatus,
    });
  };

  const downloadLatestVersionsZip = () => {
    if (contextRows.length === 0 || contextHasDemoRow) {
      return;
    }

    if (!isBulkContextSelection) {
      const row = contextRows[0];
      if (!row) {
        return;
      }

      downloadMutation.mutate({
        documentId: row.id,
        versionNumber: row.latestVersion,
      });
      return;
    }

    bulkDownloadMutation.mutate(
      contextRows.map((row) => ({
        id: row.id,
        title: row.title,
        versionNumber: row.latestVersion,
      })),
    );
  };

  const contextStatusPending =
    statusMutation.isPending || bulkStatusMutation.isPending;
  const contextDownloadPending =
    downloadMutation.isPending || bulkDownloadMutation.isPending;
  const contextAllRowsAlreadyStatus = (status: StatusFilter) =>
    contextRows.length > 0 &&
    contextRows.every((row) => row.statusValue === status);

  return (
    <div className="fc-records-shell" ref={recordsShellRef}>
      <section className="fc-records-toolbar" data-node-id="24:194">
        <div className="fc-records-search-row" data-node-id="24:202">
          <Button
            className="fc-add-record-button"
            type="button"
            variant="ghost"
            onClick={() => setAddRecordOpen(true)}
          >
            <span>+ Add Record</span>
          </Button>

          <div className="fc-search-wrap" data-node-id="24:203">
            <Search aria-hidden="true" className="fc-search-icon" />
            <Input
              aria-label={areaSearchPlaceholder(mode)}
              autoComplete="off"
              className="fc-search-input"
              placeholder={areaSearchPlaceholder(mode)}
              type="search"
              value={search}
              onChange={(event) => {
                setOffset(0);
                setSearch(event.target.value);
              }}
            />
          </div>
        </div>

        <div className="fc-records-filters" data-node-id="24:195">
          <FilterSelect
            activeWhen={(value) => value !== "all" && value !== "none"}
            className="fc-filter-contact"
            options={clientOptions}
            value={contactValue}
            onValueChange={(nextValue) => {
              setOffset(0);
              setContactValue(nextValue);
            }}
          />

          <FilterSelect
            activeWhen={(value) => value !== "all"}
            className="fc-filter-status"
            options={STATUS_OPTIONS}
            value={statusValue}
            onValueChange={(nextValue) => {
              setOffset(0);
              setStatusValue(nextValue);
            }}
          />

          <FilterSelect
            activeWhen={(value) => value !== "all"}
            className="fc-filter-date"
            options={DATE_ADDED_OPTIONS}
            value={dateAdded}
            onValueChange={(nextValue) => {
              setOffset(0);
              setDateAdded(nextValue);
            }}
          />

          <FilterSelect
            activeWhen={(value) => value !== "all"}
            className="fc-filter-filetype"
            options={fileTypeOptions}
            value={fileTypeValue}
            onValueChange={(nextValue) => {
              setOffset(0);
              setFileTypeValue(nextValue);
            }}
          />

          <FilterSelect
            className="fc-filter-pagesize"
            options={PAGE_SIZES}
            value={pageSize}
            onValueChange={(nextValue) => {
              setOffset(0);
              setPageSize(nextValue);
            }}
          />

          <Button
            className="fc-reset-filters"
            type="button"
            variant="outline"
            onClick={clearFilters}
          >
            Reset Filters
          </Button>
        </div>
      </section>

      <DropdownMenu open={contextMenuOpen} onOpenChange={setContextMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            aria-hidden="true"
            className="fc-record-context-anchor"
            style={{
              left: `${contextMenuPosition.x}px`,
              top: `${contextMenuPosition.y}px`,
            }}
            tabIndex={-1}
            type="button"
          />
        </DropdownMenuTrigger>

        <section
          className="fc-records-table-shell"
          data-scrolled-x={hasTableHorizontalOffset ? "true" : "false"}
          data-node-id="24:243"
          ref={tableShellRef}
          onContextMenuCapture={(event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
              setActiveContextRowId(null);
              setContextMenuOpen(false);
              return;
            }

            const rowElement = target.closest<HTMLTableRowElement>(
              "tr[data-record-id]",
            );
            const rowId = rowElement?.dataset.recordId;

            if (!rowId) {
              setActiveContextRowId(null);
              setContextMenuOpen(false);
              return;
            }

            event.preventDefault();
            selectContextRow(rowId);
            openContextMenuAt(event.clientX, event.clientY);
          }}
        >
          <Table className="fc-records-table">
            <TableHeader>
              <TableRow className="fc-records-head-row" data-node-id="24:244">
                <TableHead className="fc-records-head-cell fc-col-select">
                  <Checkbox
                    aria-label={
                      allSelected ? "Deselect all rows" : "Select all rows"
                    }
                    checked={
                      allSelected ? true : someSelected ? "indeterminate" : false
                    }
                    className="fc-records-checkbox"
                    onCheckedChange={(checked) => {
                      setSelectedIds((current) => {
                        const next = new Set(current);

                        if (checked === true || checked === "indeterminate") {
                          for (const row of tableRows) {
                            next.add(row.id);
                          }
                        } else {
                          for (const row of tableRows) {
                            next.delete(row.id);
                          }
                        }

                        return isSetEqual(current, next) ? current : next;
                      });
                    }}
                  />
                </TableHead>
                <TableHead className="fc-records-head-cell fc-col-title">
                  <div className="fc-records-head-content">
                    <span>TITLE</span>
                    <MoreVertical className="fc-header-menu" />
                  </div>
                </TableHead>
                <TableHead className="fc-records-head-cell fc-col-status">
                  <div className="fc-records-head-content">
                    <span>STATUS</span>
                    <MoreVertical className="fc-header-menu" />
                  </div>
                </TableHead>
                <TableHead className="fc-records-head-cell fc-col-contact">
                  <div className="fc-records-head-content">
                    <span>{mode === "internal" ? "LINKED USER" : "CONTACT"}</span>
                    <MoreVertical className="fc-header-menu" />
                  </div>
                </TableHead>
                <TableHead className="fc-records-head-cell fc-col-filetype">
                  <div className="fc-records-head-content">
                    <span>FILETYPE</span>
                    <MoreVertical className="fc-header-menu" />
                  </div>
                </TableHead>
                <TableHead className="fc-records-head-cell fc-col-date">
                  <div className="fc-records-head-content">
                    <span>DATE ADDED</span>
                    <MoreVertical className="fc-header-menu" />
                  </div>
                </TableHead>
                <TableHead className="fc-records-head-cell fc-col-date fc-col-last">
                  <div className="fc-records-head-content">
                    <span>DATE MODIFIED</span>
                    <MoreVertical className="fc-header-menu" />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {documentsQuery.isLoading ? (
                <TableRow className="fc-records-row">
                  <TableCell className="fc-records-message" colSpan={7}>
                    {areaLoadingMessage(mode)}
                  </TableCell>
                </TableRow>
              ) : tableRows.length === 0 ? (
                <TableRow className="fc-records-row">
                  <TableCell className="fc-records-message" colSpan={7}>
                    {areaEmptyMessage(mode)}
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row) => {
                  const selected = selectedIds.has(row.id);

                  return (
                    <TableRow
                      className={cn(
                        "fc-records-row",
                        selected && "fc-records-row-selected",
                      )}
                      data-record-id={row.id}
                      key={row.id}
                      onClick={(event) => {
                        if (event.button !== 0 || event.defaultPrevented) {
                          return;
                        }

                        if (event.shiftKey) {
                          selectRangeToRow(row.id);
                          return;
                        }

                        if (event.metaKey || event.ctrlKey) {
                          toggleRowSelection(row.id);
                          return;
                        }

                        if (
                          event.target instanceof Element &&
                          event.target.closest("[data-record-checkbox-cell='true']")
                        ) {
                          toggleRowSelection(row.id);
                          return;
                        }

                        selectSingleRow(row.id);
                      }}
                      onPointerDown={(event) => {
                        if (event.button !== 2) {
                          return;
                        }

                        selectContextRow(row.id);
                      }}
                    >
                      <TableCell
                        className="fc-records-cell fc-cell-select"
                        data-record-checkbox-cell="true"
                      >
                        <Checkbox
                          aria-label={`Select ${row.title}`}
                          checked={selected}
                          className="fc-records-checkbox"
                          onClick={(event) => event.stopPropagation()}
                          onCheckedChange={(checked) => {
                            if (checked === true || checked === "indeterminate") {
                              addRowToSelection(row.id);
                              return;
                            }

                            setSelectedIds((current) => {
                              if (!current.has(row.id)) {
                                return current;
                              }

                              const next = new Set(current);
                              next.delete(row.id);
                              return next;
                            });
                          }}
                        />
                      </TableCell>
                      <TableCell className="fc-records-cell fc-cell-title">
                        {row.isDemo ? (
                          <span>{row.title}</span>
                        ) : (
                          <Link
                            className="fc-record-title-link"
                            data-record-title-link="true"
                            params={{ documentId: row.id }}
                            to="/documents/$documentId"
                            onClick={(event) => {
                              event.stopPropagation();
                            }}
                          >
                            {row.title}
                          </Link>
                        )}
                      </TableCell>
                      <TableCell className="fc-records-cell fc-cell-status">
                        {row.status}
                      </TableCell>
                      <TableCell className="fc-records-cell fc-cell-contact">
                        {row.contact}
                      </TableCell>
                      <TableCell className="fc-records-cell fc-cell-filetype">
                        {row.filetype}
                      </TableCell>
                      <TableCell className="fc-records-cell fc-cell-date">
                        {row.dateAdded}
                      </TableCell>
                      <TableCell className="fc-records-cell fc-cell-date fc-col-last">
                        {row.dateModified}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </section>

        <DropdownMenuContent
          align="start"
          className="fc-record-context-menu"
          side="bottom"
          sideOffset={2}
        >
          <DropdownMenuLabel className="fc-record-context-label">
            {isBulkContextSelection
              ? `${contextRows.length} records selected`
              : (activeContextRow?.title ?? "Record Actions")}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="fc-record-context-separator" />
          {isBulkContextSelection ? null : (
            <DropdownMenuItem
              className="fc-record-context-item"
              disabled={!activeContextRow || activeContextRow.isDemo}
              onSelect={() => {
                if (!activeContextRow) {
                  return;
                }

                void navigate({
                  to: "/documents/$documentId",
                  params: { documentId: activeContextRow.id },
                });
              }}
            >
              Open record
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="fc-record-context-item"
            disabled={contextRows.length === 0 || contextHasDemoRow}
            onSelect={() => {
              if (contextRows.length === 0) {
                return;
              }

              if (isBulkContextSelection) {
                openBulkEditDialog(contextRows);
                return;
              }

              const row = contextRows[0];
              if (!row) {
                return;
              }

              openEditRecordDialog(row);
            }}
          >
            {isBulkContextSelection ? "Bulk Edit Profile" : "Edit Profile"}
          </DropdownMenuItem>
          <DropdownMenuItem
            className="fc-record-context-item"
            disabled={
              contextRows.length === 0 || contextHasDemoRow || contextDownloadPending
            }
            onSelect={() => {
              downloadLatestVersionsZip();
            }}
          >
            {isBulkContextSelection
              ? "Download latest versions (.ZIP)"
              : "Download latest version"}
          </DropdownMenuItem>
          {isBulkContextSelection ? null : (
            <DropdownMenuItem
              className="fc-record-context-item"
              disabled={
                !activeContextRow ||
                activeContextRow.isDemo ||
                activeContextRow.clientId.length === 0 ||
                activeContextRow.engagementId.length === 0
              }
              onSelect={() => {
                if (!activeContextRow) {
                  return;
                }

                void navigate({
                  to: "/clients/$clientId/engagements/$engagementId/documents",
                  params: {
                    clientId: activeContextRow.clientId,
                    engagementId: activeContextRow.engagementId,
                  },
                });
              }}
            >
              Open engagement
            </DropdownMenuItem>
          )}
          {isBulkContextSelection ? null : (
            <DropdownMenuItem
              className="fc-record-context-item"
              disabled={!activeContextRow || activeContextRow.isDemo}
              onSelect={() => {
                if (!activeContextRow) {
                  return;
                }

                void copyRecordLink(activeContextRow);
              }}
            >
              Copy record link
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator className="fc-record-context-separator" />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger
              className="fc-record-context-item"
              disabled={
                contextRows.length === 0 || contextHasDemoRow || contextStatusPending
              }
            >
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="fc-record-context-menu">
              <DropdownMenuItem
                className="fc-record-context-item"
                disabled={
                  contextRows.length === 0 ||
                  contextHasDemoRow ||
                  contextStatusPending ||
                  contextAllRowsAlreadyStatus("uploaded")
                }
                onSelect={() => applyContextStatusChange("uploaded")}
              >
                Uploaded
              </DropdownMenuItem>
              <DropdownMenuItem
                className="fc-record-context-item"
                disabled={
                  contextRows.length === 0 ||
                  contextHasDemoRow ||
                  contextStatusPending ||
                  contextAllRowsAlreadyStatus("in_review")
                }
                onSelect={() => applyContextStatusChange("in_review")}
              >
                In review
              </DropdownMenuItem>
              <DropdownMenuItem
                className="fc-record-context-item"
                disabled={
                  contextRows.length === 0 ||
                  contextHasDemoRow ||
                  contextStatusPending ||
                  contextAllRowsAlreadyStatus("final")
                }
                onSelect={() => applyContextStatusChange("final")}
              >
                Final
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      {contextActionError ? (
        <p className="fc-records-action-error">{contextActionError}</p>
      ) : null}

      <footer className="fc-records-footer" data-node-id="53:179">
        <div className="fc-records-footer-meta">
          <p
            className={cn(
              "fc-selected-records-pill",
              selectedCount > 1 && "fc-selected-records-pill-visible",
            )}
          >
            {selectedCount} records selected
          </p>
          <p
            className={cn(
              "fc-records-count",
              selectedCount > 1 && "fc-records-count-shifted",
            )}
          >
            Showing {tableRows.length} of {total} results
          </p>
        </div>
        <div className="fc-records-pagination" data-node-id="53:181">
          <Button
            aria-label="Previous page"
            className="fc-page-arrow"
            disabled={offset === 0}
            type="button"
            variant="ghost"
            onClick={() => setOffset((current) => Math.max(0, current - limit))}
          >
            <ArrowLeft className="size-[16px]" />
          </Button>
          <p className="fc-page-label">
            Page {pageNumber} of {pageCount}
          </p>
          <Button
            aria-label="Next page"
            className="fc-page-arrow"
            disabled={!hasNextPage}
            type="button"
            variant="ghost"
            onClick={() =>
              setOffset((current) =>
                Math.min(current + limit, Math.max(0, total - limit)),
              )
            }
          >
            <ArrowRight className="size-[16px]" />
          </Button>
        </div>
      </footer>

      <AddRecordDialog
        clients={clientsQuery.data ?? []}
        mode={mode}
        open={addRecordOpen}
        onOpenChange={setAddRecordOpen}
        onRecordCreated={refreshRecordsAfterCreate}
      />
      <EditRecordDialog
        open={editRecordOpen}
        record={recordBeingEdited}
        onOpenChange={(nextOpen) => {
          setEditRecordOpen(nextOpen);
          if (!nextOpen) {
            setRecordBeingEdited(null);
          }
        }}
        onRecordUpdated={refreshRecordsAfterEdit}
      />
      <BulkEditRecordDialog
        clients={clientsQuery.data ?? []}
        open={bulkEditOpen}
        selection={bulkEditSelection}
        onOpenChange={(nextOpen) => {
          setBulkEditOpen(nextOpen);
          if (!nextOpen) {
            setBulkEditSelection(null);
          }
        }}
        onRecordsUpdated={refreshRecordsAfterEdit}
      />
    </div>
  );
}
