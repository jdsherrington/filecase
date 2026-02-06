import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { listDocumentsServerFn } from "../server/document-fns";

type DocumentRow = Awaited<
  ReturnType<typeof listDocumentsServerFn>
>["items"][number];

const columnHelper = createColumnHelper<DocumentRow>();
const PAGE_SIZE = 20;

function toIsoDateStart(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T00:00:00.000Z`).toISOString();
}

function toIsoDateEnd(value: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return new Date(`${value}T23:59:59.999Z`).toISOString();
}

function shortenId(id: string): string {
  return `${id.slice(0, 8)}...${id.slice(-4)}`;
}

function formatStatus(status: string): string {
  return status.replace("_", " ");
}

export function DocumentsExplorer() {
  const [status, setStatus] = useState<"uploaded" | "in_review" | "final" | "">(
    "",
  );
  const [documentType, setDocumentType] = useState("");
  const [search, setSearch] = useState("");
  const [uploadedDateStart, setUploadedDateStart] = useState("");
  const [uploadedDateEnd, setUploadedDateEnd] = useState("");
  const [sortBy, setSortBy] = useState<
    "updated_at" | "title" | "created_at" | "status"
  >("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [offset, setOffset] = useState(0);

  const documentsQuery = useQuery(
    queryOptions({
      queryKey: [
        "documents-global",
        status,
        documentType,
        search,
        uploadedDateStart,
        uploadedDateEnd,
        sortBy,
        sortDirection,
        offset,
      ],
      queryFn: () =>
        listDocumentsServerFn({
          data: {
            status: status || undefined,
            documentType: documentType || undefined,
            q: search || undefined,
            uploadedDateStart: toIsoDateStart(uploadedDateStart),
            uploadedDateEnd: toIsoDateEnd(uploadedDateEnd),
            sortBy,
            sortDirection,
            limit: PAGE_SIZE,
            offset,
          },
        }),
    }),
  );

  const rows = documentsQuery.data?.items ?? [];
  const total = documentsQuery.data?.total ?? 0;

  const columns = [
    columnHelper.accessor("title", {
      header: "Document",
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-foreground">{row.original.title}</p>
          <p className="text-xs text-muted-foreground">
            {row.original.latestFileName}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor("documentType", { header: "Type" }),
    columnHelper.accessor("status", {
      header: "Status",
      cell: (info) => (
        <span className="inline-flex rounded-full border border-border px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
          {formatStatus(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor("clientId", {
      header: "Client",
      cell: (info) => (
        <code className="text-xs text-muted-foreground" title={info.getValue()}>
          {shortenId(info.getValue())}
        </code>
      ),
    }),
    columnHelper.accessor("engagementId", {
      header: "Engagement",
      cell: (info) => (
        <code className="text-xs text-muted-foreground" title={info.getValue()}>
          {shortenId(info.getValue())}
        </code>
      ),
    }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: (info) => (
        <span className="text-sm text-muted-foreground">
          {new Date(info.getValue()).toLocaleString()}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            params={{
              clientId: row.original.clientId,
              engagementId: row.original.engagementId,
            }}
            to="/clients/$clientId/engagements/$engagementId/documents"
          >
            Engagement
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            params={{ documentId: row.original.id }}
            to="/documents/$documentId"
          >
            Open
          </Link>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <section className="grid gap-3 rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] p-4 md:grid-cols-2 xl:grid-cols-4">
        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="documents-search"
        >
          Search
          <Input
            autoComplete="off"
            id="documents-search"
            name="search"
            placeholder="Title or filename…"
            value={search}
            onChange={(event) => {
              setOffset(0);
              setSearch(event.target.value);
            }}
          />
        </label>

        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="documents-type"
        >
          Document Type
          <Input
            autoComplete="off"
            id="documents-type"
            name="documentType"
            placeholder="e.g. Tax Return…"
            value={documentType}
            onChange={(event) => {
              setOffset(0);
              setDocumentType(event.target.value);
            }}
          />
        </label>

        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="documents-status"
        >
          Status
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            id="documents-status"
            name="status"
            value={status}
            onChange={(event) => {
              setOffset(0);
              setStatus(event.target.value as typeof status);
            }}
          >
            <option value="">All statuses</option>
            <option value="uploaded">uploaded</option>
            <option value="in_review">in review</option>
            <option value="final">final</option>
          </select>
        </label>

        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="documents-sort"
        >
          Sort
          <select
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            id="documents-sort"
            name="sort"
            value={`${sortBy}:${sortDirection}`}
            onChange={(event) => {
              const [nextSortBy, nextDirection] = event.target.value.split(
                ":",
              ) as [typeof sortBy, typeof sortDirection];
              setSortBy(nextSortBy);
              setSortDirection(nextDirection);
            }}
          >
            <option value="updated_at:desc">Updated (newest)</option>
            <option value="updated_at:asc">Updated (oldest)</option>
            <option value="created_at:desc">Created (newest)</option>
            <option value="created_at:asc">Created (oldest)</option>
            <option value="title:asc">Title (A-Z)</option>
            <option value="title:desc">Title (Z-A)</option>
            <option value="status:asc">Status (A-Z)</option>
          </select>
        </label>

        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="documents-uploaded-from"
        >
          Uploaded From
          <Input
            autoComplete="off"
            id="documents-uploaded-from"
            name="uploadedDateStart"
            type="date"
            value={uploadedDateStart}
            onChange={(event) => {
              setOffset(0);
              setUploadedDateStart(event.target.value);
            }}
          />
        </label>

        <label
          className="space-y-1 text-xs font-medium uppercase tracking-wide text-muted-foreground"
          htmlFor="documents-uploaded-to"
        >
          Uploaded To
          <Input
            autoComplete="off"
            id="documents-uploaded-to"
            name="uploadedDateEnd"
            type="date"
            value={uploadedDateEnd}
            onChange={(event) => {
              setOffset(0);
              setUploadedDateEnd(event.target.value);
            }}
          />
        </label>

        <div className="flex items-end md:col-span-2 xl:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOffset(0);
              setStatus("");
              setDocumentType("");
              setSearch("");
              setUploadedDateStart("");
              setUploadedDateEnd("");
              setSortBy("updated_at");
              setSortDirection("desc");
            }}
          >
            Reset filters
          </Button>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)]">
        <div className="overflow-auto">
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
                    Loading documents…
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    className="text-muted-foreground"
                    colSpan={columns.length}
                  >
                    No documents match these filters.
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
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total === 0
            ? "No results"
            : `Showing ${offset + 1}-${Math.min(offset + PAGE_SIZE, total)} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <Button
            disabled={offset === 0}
            type="button"
            variant="outline"
            onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}
          >
            Previous
          </Button>
          <Button
            disabled={offset + PAGE_SIZE >= total}
            type="button"
            variant="outline"
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
          >
            Next
          </Button>
        </div>
      </footer>
    </div>
  );
}
