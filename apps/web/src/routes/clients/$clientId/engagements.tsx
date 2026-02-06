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

import { getCurrentUserServerFn } from "../../../server/auth/server-fns";
import { listEngagementsServerFn } from "../../../server/document-fns";

type EngagementRow = Awaited<
  ReturnType<typeof listEngagementsServerFn>
>[number];

const columnHelper = createColumnHelper<EngagementRow>();

export const Route = createFileRoute("/clients/$clientId/engagements")({
  beforeLoad: async () => {
    const user = await getCurrentUserServerFn();

    if (!user) {
      throw redirect({
        to: "/login",
      });
    }
  },
  component: ClientEngagementsRoutePage,
});

function ClientEngagementsRoutePage() {
  const { clientId } = Route.useParams();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const routePath = `/clients/${clientId}/engagements`;
  const isEngagementsIndex =
    pathname === routePath || pathname === `${routePath}/`;

  if (!isEngagementsIndex) {
    return <Outlet />;
  }

  return <ClientEngagementsPage />;
}

function ClientEngagementsPage() {
  const { clientId } = Route.useParams();
  const engagementsQuery = useQuery(
    queryOptions({
      queryKey: ["engagements", clientId],
      queryFn: () => listEngagementsServerFn({ data: { clientId } }),
    }),
  );

  const rows = engagementsQuery.data ?? [];

  const columns = [
    columnHelper.accessor("name", { header: "Name" }),
    columnHelper.accessor("financialYear", { header: "FY" }),
    columnHelper.accessor("status", { header: "Status" }),
    columnHelper.display({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            params={{ clientId, engagementId: row.original.id }}
            to="/clients/$clientId/engagements/$engagementId"
          >
            Overview
          </Link>
          <Link
            className={buttonVariants({ variant: "outline", size: "sm" })}
            params={{ clientId, engagementId: row.original.id }}
            to="/clients/$clientId/engagements/$engagementId/documents"
          >
            Documents
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
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-12">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Engagements</h1>
        <Link className={buttonVariants({ variant: "outline" })} to="/clients">
          Back to Clients
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
                  No engagements found.
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
