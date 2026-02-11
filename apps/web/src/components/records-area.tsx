import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { ArrowLeft, ArrowRight, MoreVertical, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { listClientsServerFn } from "../server/auth/server-fns";
import {
  listDocumentsServerFn,
  listEngagementsServerFn,
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
  status: string;
  contact: string;
  filetype: string;
  dateAdded: string;
  dateModified: string;
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

function buildDemoRows(offset: number, limit: number): TableDisplayRow[] {
  return Array.from({ length: limit }, (_, index) => ({
    id: `demo-${offset + index + 1}`,
    title: "Example document title",
    status: "Final",
    contact: "ACME Engineering Pty Ltd",
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

export function RecordsArea({
  mode,
  presetClientId,
}: {
  mode: RecordsAreaMode;
  presetClientId?: string;
}) {
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      status: formatStatus(row.status),
      contact:
        mode === "internal"
          ? row.latestUploadedBy === "-"
            ? "General"
            : row.latestUploadedBy
          : mode === "templates"
            ? "Not linked"
            : (clientNameById.get(row.clientId) ?? "Unknown"),
      filetype: formatFiletype(row.documentType),
      dateAdded: formatDate(row.createdAt),
      dateModified: formatDate(row.updatedAt),
    }));
  }, [clientNameById, demoRows, mode, rows, showDemoRows]);
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

  const selectedCount = tableRows.reduce(
    (count, row) => (selectedIds.has(row.id) ? count + 1 : count),
    0,
  );
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

  return (
    <div className="fc-records-shell">
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

      <section className="fc-records-table-shell" data-node-id="24:243">
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
                    const next = new Set(selectedIds);

                    if (checked === true || checked === "indeterminate") {
                      for (const row of tableRows) {
                        next.add(row.id);
                      }
                    } else {
                      for (const row of tableRows) {
                        next.delete(row.id);
                      }
                    }

                    setSelectedIds(next);
                  }}
                />
              </TableHead>
              <TableHead className="fc-records-head-cell fc-col-title">
                <span>TITLE</span>
                <MoreVertical className="fc-header-menu" />
              </TableHead>
              <TableHead className="fc-records-head-cell fc-col-status">
                <span>STATUS</span>
                <MoreVertical className="fc-header-menu" />
              </TableHead>
              <TableHead className="fc-records-head-cell fc-col-contact">
                <span>{mode === "internal" ? "LINKED USER" : "CONTACT"}</span>
                <MoreVertical className="fc-header-menu" />
              </TableHead>
              <TableHead className="fc-records-head-cell fc-col-filetype">
                <span>FILETYPE</span>
                <MoreVertical className="fc-header-menu" />
              </TableHead>
              <TableHead className="fc-records-head-cell fc-col-date">
                <span>DATE ADDED</span>
                <MoreVertical className="fc-header-menu" />
              </TableHead>
              <TableHead className="fc-records-head-cell fc-col-date fc-col-last">
                <span>DATE MODIFIED</span>
                <MoreVertical className="fc-header-menu" />
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
                    key={row.id}
                  >
                    <TableCell className="fc-records-cell fc-cell-select">
                      <Checkbox
                        aria-label={`Select ${row.title}`}
                        checked={selected}
                        className="fc-records-checkbox"
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedIds);

                          if (checked === true || checked === "indeterminate") {
                            next.add(row.id);
                          } else {
                            next.delete(row.id);
                          }

                          if (!isSetEqual(next, selectedIds)) {
                            setSelectedIds(next);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="fc-records-cell fc-cell-title">
                      {row.title}
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

      <footer className="fc-records-footer" data-node-id="53:179">
        <p className="fc-records-count">
          Showing {tableRows.length} of {total} results
        </p>
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
    </div>
  );
}
