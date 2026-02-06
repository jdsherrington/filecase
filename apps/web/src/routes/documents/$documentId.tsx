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
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link, createFileRoute, redirect } from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { getCurrentUserServerFn } from "../../server/auth/server-fns";
import {
  getDocumentDetailServerFn,
  getDocumentDownloadUrlServerFn,
  replaceDocumentVersionServerFn,
  updateDocumentStatusServerFn,
} from "../../server/document-fns";

type VersionRow = Awaited<
  ReturnType<typeof getDocumentDetailServerFn>
>["versions"][number];

const columnHelper = createColumnHelper<VersionRow>();

export const Route = createFileRoute("/documents/$documentId")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({ to: "/login" });
    }
  },
  component: DocumentDetailPage,
});

function DocumentDetailPage() {
  const { documentId } = Route.useParams();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const documentQuery = useQuery(
    queryOptions({
      queryKey: ["document-detail", documentId],
      queryFn: () => getDocumentDetailServerFn({ data: { documentId } }),
    }),
  );

  const detail = documentQuery.data;

  const downloadMutation = useMutation({
    mutationFn: (versionNumber: number) =>
      getDocumentDownloadUrlServerFn({
        data: {
          documentId,
          versionNumber,
        },
      }),
    onSuccess: (result) => {
      window.location.assign(result.url);
    },
  });

  const replaceMutation = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Please choose a file.");
      }

      const formData = new FormData();
      formData.set("document_id", documentId);
      formData.set("file", file);

      return replaceDocumentVersionServerFn({ data: formData });
    },
    onSuccess: async () => {
      setError(null);
      setFile(null);
      await queryClient.invalidateQueries({
        queryKey: ["document-detail", documentId],
      });
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Replace failed",
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: (nextStatus: "uploaded" | "in_review" | "final") =>
      updateDocumentStatusServerFn({
        data: {
          documentId,
          nextStatus,
        },
      }),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: ["document-detail", documentId],
      });
    },
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Status update failed",
      );
    },
  });

  const columns = [
    columnHelper.accessor("versionNumber", { header: "Version" }),
    columnHelper.accessor("fileName", { header: "File Name" }),
    columnHelper.accessor("mimeType", { header: "MIME" }),
    columnHelper.accessor("fileSizeBytes", { header: "Bytes" }),
    columnHelper.accessor("uploadedBy", { header: "Uploaded By" }),
    columnHelper.accessor("uploadedAt", {
      header: "Uploaded At",
      cell: (info) => new Date(info.getValue()).toLocaleString(),
    }),
    columnHelper.display({
      id: "download",
      header: "Download",
      cell: ({ row }) => (
        <Button
          disabled={downloadMutation.isPending}
          size="sm"
          type="button"
          variant="outline"
          onClick={() => downloadMutation.mutate(row.original.versionNumber)}
        >
          Download
        </Button>
      ),
    }),
  ];

  const table = useReactTable({
    data: detail?.versions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!detail) {
    return (
      <p className="p-6 text-sm text-muted-foreground">Loading document...</p>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{detail.title}</h1>
          <p className="text-sm text-muted-foreground">
            Type: {detail.documentType}
          </p>
          <p className="text-sm text-muted-foreground">
            Status: {detail.status}
          </p>
        </div>
        <Link
          className={buttonVariants({ variant: "outline" })}
          params={{
            clientId: detail.clientId,
            engagementId: detail.engagementId,
          }}
          to="/clients/$clientId/engagements/$engagementId/documents"
        >
          Back
        </Link>
      </header>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Lifecycle</h2>
        <div className="flex items-center gap-2">
          <Button
            disabled={statusMutation.isPending}
            type="button"
            variant="outline"
            onClick={() => statusMutation.mutate("uploaded")}
          >
            Set uploaded
          </Button>
          <Button
            disabled={statusMutation.isPending}
            type="button"
            variant="outline"
            onClick={() => statusMutation.mutate("in_review")}
          >
            Set in_review
          </Button>
          <Button
            disabled={statusMutation.isPending}
            type="button"
            onClick={() => statusMutation.mutate("final")}
          >
            Set final
          </Button>
        </div>
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Replace File / New Version</h2>
        <form
          className="flex items-center gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            replaceMutation.mutate();
          }}
        >
          <Input
            type="file"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
          <Button disabled={replaceMutation.isPending} type="submit">
            {replaceMutation.isPending ? "Uploading..." : "Upload New Version"}
          </Button>
        </form>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">Versions</h2>
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
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>
    </main>
  );
}
