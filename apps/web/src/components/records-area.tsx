import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";

import { listClientsServerFn } from "../server/auth/server-fns";
import { listDocumentsServerFn } from "../server/document-fns";

type RecordsAreaMode = "records" | "templates" | "internal";
type DateAddedFilter = "all" | "7d" | "30d" | "90d";
type PageSize = "30" | "60" | "90" | "120";
type StatusFilter = "all" | "uploaded" | "in_review" | "final";

type FilterOption<TValue extends string> = {
  label: string;
  value: TValue;
};

type DocumentRow = Awaited<
  ReturnType<typeof listDocumentsServerFn>
>["items"][number];

const columnHelper = createColumnHelper<DocumentRow>();

const PAGE_SIZES: FilterOption<PageSize>[] = [
  { label: "30", value: "30" },
  { label: "60", value: "60" },
  { label: "90", value: "90" },
  { label: "120", value: "120" },
];

const STATUS_OPTIONS: FilterOption<StatusFilter>[] = [
  { label: "All statuses", value: "all" },
  { label: "Uploaded", value: "uploaded" },
  { label: "In review", value: "in_review" },
  { label: "Final", value: "final" },
];

const DATE_ADDED_OPTIONS: FilterOption<DateAddedFilter>[] = [
  { label: "Any time", value: "all" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Last 90 days", value: "90d" },
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

function defaultTypeFilter(mode: RecordsAreaMode): string {
  if (mode === "templates") {
    return "template";
  }

  if (mode === "internal") {
    return "internal";
  }

  return "all";
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
    { label: "All filetypes", value: "all" },
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
  return value.replace("_", " ");
}

function formatDate(value: string): string {
  return new Date(value).toLocaleString();
}

type FilterDropdownProps<TValue extends string> = {
  label: string;
  value: TValue;
  options: FilterOption<TValue>[];
  onChange: (nextValue: TValue) => void;
};

function FilterDropdown<TValue extends string>({
  label,
  value,
  options,
  onChange,
}: FilterDropdownProps<TValue>) {
  const selectedLabel =
    options.find((option) => option.value === value)?.label ??
    options[0]?.label;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="justify-between" type="button" variant="outline">
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as TValue)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RecordsArea({
  mode,
  presetClientId,
}: {
  mode: RecordsAreaMode;
  presetClientId?: string;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateAdded, setDateAdded] = useState<DateAddedFilter>("all");
  const [pageSize, setPageSize] = useState<PageSize>("30");
  const [contactId, setContactId] = useState<string>(
    mode === "templates" ? "none" : (presetClientId ?? "all"),
  );
  const [fileType, setFileType] = useState<string>(defaultTypeFilter(mode));
  const [offset, setOffset] = useState(0);

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
      { label: "All contacts", value: "all" },
      ...items.map((client) => ({
        label: client.name,
        value: client.id,
      })),
    ];
  }, [clientsQuery.data, mode]);

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
        status,
        dateAdded,
        pageSize,
        contactId,
        fileType,
        offset,
      ],
      queryFn: () =>
        listDocumentsServerFn({
          data: {
            q: search || undefined,
            status: status === "all" ? undefined : status,
            uploadedDateStart: toDateAddedStart(dateAdded),
            clientId:
              mode === "templates" ||
              contactId === "all" ||
              contactId === "none"
                ? undefined
                : contactId,
            documentType: fileType === "all" ? undefined : fileType,
            sortBy: "updated_at",
            sortDirection: "desc",
            limit,
            offset,
          },
        }),
    }),
  );

  const rows = documentsQuery.data?.items ?? [];
  const total = documentsQuery.data?.total ?? 0;
  const visibleStart = total === 0 ? 0 : offset + 1;
  const visibleEnd = Math.min(offset + limit, total);

  const columns = useMemo(
    () =>
      mode === "internal"
        ? [
            columnHelper.accessor("title", {
              header: "Record title",
            }),
            columnHelper.accessor("documentType", {
              header: "Filetype",
            }),
            columnHelper.accessor("status", {
              header: "Status",
              cell: (info) => (
                <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {formatStatus(info.getValue())}
                </span>
              ),
            }),
            columnHelper.accessor("latestUploadedBy", {
              header: "Linked user",
              cell: (info) =>
                info.row.original.latestUploadedBy === "-"
                  ? "General"
                  : info.row.original.latestUploadedBy,
            }),
            columnHelper.accessor("updatedAt", {
              header: "Date modified",
              cell: (info) => formatDate(info.getValue()),
            }),
            columnHelper.accessor("createdAt", {
              header: "Date added",
              cell: (info) => formatDate(info.getValue()),
            }),
          ]
        : [
            columnHelper.accessor("title", {
              header: "Record title",
            }),
            columnHelper.accessor("documentType", {
              header: "Filetype",
            }),
            columnHelper.accessor("status", {
              header: "Status",
              cell: (info) => (
                <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {formatStatus(info.getValue())}
                </span>
              ),
            }),
            columnHelper.accessor("clientId", {
              header: "Client name",
              cell: (info) =>
                mode === "templates"
                  ? "Not linked"
                  : (clientNameById.get(info.getValue()) ?? "Unknown"),
            }),
            columnHelper.accessor("updatedAt", {
              header: "Date modified",
              cell: (info) => formatDate(info.getValue()),
            }),
            columnHelper.accessor("createdAt", {
              header: "Date added",
              cell: (info) => formatDate(info.getValue()),
            }),
          ],
    [clientNameById, mode],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            autoComplete="off"
            className="w-full min-w-[17rem] flex-1"
            placeholder={areaSearchPlaceholder(mode)}
            value={search}
            onChange={(event) => {
              setOffset(0);
              setSearch(event.target.value);
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOffset(0);
              setSearch("");
              setStatus("all");
              setDateAdded("all");
              setPageSize("30");
              setContactId(
                mode === "templates" ? "none" : (presetClientId ?? "all"),
              );
              setFileType(defaultTypeFilter(mode));
            }}
          >
            Clear filters/search
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterDropdown
            label="Contact"
            options={clientOptions}
            value={contactId}
            onChange={(nextValue) => {
              setOffset(0);
              setContactId(nextValue);
            }}
          />
          <FilterDropdown
            label="Status"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(nextValue) => {
              setOffset(0);
              setStatus(nextValue);
            }}
          />
          <FilterDropdown
            label="Date added"
            options={DATE_ADDED_OPTIONS}
            value={dateAdded}
            onChange={(nextValue) => {
              setOffset(0);
              setDateAdded(nextValue);
            }}
          />
          <FilterDropdown
            label="Filetype"
            options={typeOptions(mode)}
            value={fileType}
            onChange={(nextValue) => {
              setOffset(0);
              setFileType(nextValue);
            }}
          />
          <FilterDropdown
            label="Rows per page"
            options={PAGE_SIZES}
            value={pageSize}
            onChange={(nextValue) => {
              setOffset(0);
              setPageSize(nextValue);
            }}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)]">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {documentsQuery.isLoading ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columns.length}
                >
                  {areaLoadingMessage(mode)}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columns.length}
                >
                  {areaEmptyMessage(mode)}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No results"
            : `Showing ${visibleStart}-${visibleEnd} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={offset === 0}
            type="button"
            variant="outline"
            onClick={() => setOffset((current) => Math.max(0, current - limit))}
          >
            Previous
          </Button>
          <Button
            disabled={offset + limit >= total}
            type="button"
            variant="outline"
            onClick={() => setOffset((current) => current + limit)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}
