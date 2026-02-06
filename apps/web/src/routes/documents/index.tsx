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
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { getCurrentUserServerFn } from "../../server/auth/server-fns";
import { listDocumentsServerFn } from "../../server/document-fns";

type DocumentRow = Awaited<
  ReturnType<typeof listDocumentsServerFn>
>["items"][number];

const columnHelper = createColumnHelper<DocumentRow>();
const PAGE_SIZE = 20;

export const Route = createFileRoute("/documents/")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: GlobalDocumentsPage,
});

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

function GlobalDocumentsPage() {
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
    columnHelper.accessor("title", { header: "Title" }),
    columnHelper.accessor("documentType", { header: "Type" }),
    columnHelper.accessor("status", { header: "Status" }),
    columnHelper.accessor("latestFileName", { header: "Latest File" }),
    columnHelper.accessor("updatedAt", {
      header: "Updated",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    columnHelper.display({
      id: "context",
      header: "Context",
      cell: ({ row }) => (
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          params={{
            clientId: row.original.clientId,
            engagementId: row.original.engagementId,
          }}
          to="/clients/$clientId/engagements/$engagementId/documents"
        >
          Open Engagement
        </Link>
      ),
    }),
    columnHelper.display({
      id: "details",
      header: "Details",
      cell: ({ row }) => (
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          params={{ documentId: row.original.id }}
          to="/documents/$documentId"
        >
          Open
        </Link>
      ),
    }),
  ];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Documents</h1>
        <Link className={buttonVariants({ variant: "outline" })} to="/">
          Back to Dashboard
        </Link>
      </header>

      <section className="grid gap-3 rounded-lg border p-4 md:grid-cols-3">
        <Input
          placeholder="Search title or filename"
          value={search}
          onChange={(event) => {
            setOffset(0);
            setSearch(event.target.value);
          }}
        />
        <Input
          placeholder="Document type"
          value={documentType}
          onChange={(event) => {
            setOffset(0);
            setDocumentType(event.target.value);
          }}
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={status}
          onChange={(event) => {
            setOffset(0);
            setStatus(event.target.value as typeof status);
          }}
        >
          <option value="">All statuses</option>
          <option value="uploaded">uploaded</option>
          <option value="in_review">in_review</option>
          <option value="final">final</option>
        </select>
        <Input
          type="date"
          value={uploadedDateStart}
          onChange={(event) => {
            setOffset(0);
            setUploadedDateStart(event.target.value);
          }}
        />
        <Input
          type="date"
          value={uploadedDateEnd}
          onChange={(event) => {
            setOffset(0);
            setUploadedDateEnd(event.target.value);
          }}
        />
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
        >
          <option value="updated_at">Sort: updated_at</option>
          <option value="title">Sort: title</option>
          <option value="created_at">Sort: created_at</option>
          <option value="status">Sort: status</option>
        </select>
        <select
          className="h-10 rounded-md border bg-background px-3 text-sm"
          value={sortDirection}
          onChange={(event) =>
            setSortDirection(event.target.value as typeof sortDirection)
          }
        >
          <option value="desc">desc</option>
          <option value="asc">asc</option>
        </select>
      </section>

      <section className="rounded-lg border p-4">
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  No documents found.
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

      <footer className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {offset + 1}-{Math.min(offset + PAGE_SIZE, total)} of {total}
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
    </main>
  );
}
