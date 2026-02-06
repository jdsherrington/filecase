import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  buttonVariants,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  Link,
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  getCurrentUserServerFn,
  listClientsServerFn,
} from "../server/auth/server-fns";

type ClientRow = Awaited<ReturnType<typeof listClientsServerFn>>[number];

const clientsQueryOptions = queryOptions({
  queryKey: ["clients"],
  queryFn: () => listClientsServerFn(),
});

const columnHelper = createColumnHelper<ClientRow>();

const columns = [
  columnHelper.accessor("name", {
    header: "Name",
  }),
  columnHelper.accessor("externalReference", {
    header: "Reference",
    cell: (info) => info.getValue() ?? "-",
  }),
  columnHelper.accessor("status", {
    header: "Status",
  }),
  columnHelper.display({
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          params={{ clientId: row.original.id }}
          to="/clients/$clientId/engagements"
        >
          Engagements
        </Link>
        <Link
          className={buttonVariants({ variant: "outline", size: "sm" })}
          params={{ clientId: row.original.id }}
          to="/clients/$clientId/documents"
        >
          Documents
        </Link>
      </div>
    ),
  }),
];

export const Route = createFileRoute("/clients")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(clientsQueryOptions);
  },
  component: ClientsRoutePage,
});

function ClientsRoutePage() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const isClientsIndex = pathname === "/clients" || pathname === "/clients/";

  if (!isClientsIndex) {
    return <Outlet />;
  }

  return <ClientsPage />;
}

function ClientsPage() {
  const clientsQuery = useQuery(clientsQueryOptions);
  const rows = clientsQuery.data ?? [];

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Clients</h1>
        <Link className={buttonVariants({ variant: "outline" })} to="/">
          Back to Dashboard
        </Link>
      </header>

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
                <TableCell
                  className="text-muted-foreground"
                  colSpan={columns.length}
                >
                  No clients found.
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
    </main>
  );
}
