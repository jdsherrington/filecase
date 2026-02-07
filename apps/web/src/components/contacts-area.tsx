import {
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@filecase/ui";
import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Circle,
  Contact2,
  Ellipsis,
  Info,
  Search,
  SlidersHorizontal,
  Tags,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { listClientsServerFn } from "../server/auth/server-fns";

type ClientRow = Awaited<ReturnType<typeof listClientsServerFn>>[number];
type ContactsView = "all" | "people" | "companies" | "tags";
type ContactCategory = "company" | "person";

type ContactRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  stage: "Lead" | "Customer";
  tags: string[];
  category: ContactCategory;
  toneClass: string;
};

const TAB_OPTIONS: Array<{
  value: ContactsView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "all", label: "All", icon: Users },
  { value: "people", label: "People", icon: Contact2 },
  { value: "companies", label: "Companies", icon: Building2 },
  { value: "tags", label: "Tags", icon: Tags },
];

const TAG_GROUPS: string[][] = [
  ["Software", "Technology", "Creativity"],
  ["Internet", "B2C", "Web Services"],
  ["Technology", "E-commerce", "Cloud"],
  ["Technology", "Semiconductors", "Hardware"],
  ["Technology", "B2C", "IT Services"],
  ["B2C", "Entertainment", "Broadcasting"],
  ["Software", "Storage", "Collaboration"],
  ["Technology", "Internet", "SAAS"],
  ["Retail", "Luxury", "B2B"],
];

const TONE_CLASSES = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-indigo-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-teal-500",
  "bg-violet-500",
];

const DEMO_CONTACTS: ContactRow[] = [
  {
    id: "demo-adobe",
    name: "Adobe",
    email: "contact@adobe.com",
    phone: "+1 408-536-6000",
    stage: "Lead",
    tags: ["Software", "Technology", "Creativity"],
    category: "company",
    toneClass: "bg-red-500",
  },
  {
    id: "demo-airbnb",
    name: "Airbnb",
    email: "press@airbnb.com",
    phone: "+1 415-800-5959",
    stage: "Lead",
    tags: ["Internet", "B2C", "Web Services"],
    category: "company",
    toneClass: "bg-rose-500",
  },
  {
    id: "demo-amazon",
    name: "Amazon",
    email: "contact@amazon.com",
    phone: "+1 206-266-1000",
    stage: "Lead",
    tags: ["Technology", "E-commerce", "Cloud"],
    category: "company",
    toneClass: "bg-amber-500",
  },
  {
    id: "demo-apple",
    name: "Apple",
    email: "contact@apple.com",
    phone: "+1 408-996-1010",
    stage: "Lead",
    tags: ["Technology", "B2C", "IT Services"],
    category: "company",
    toneClass: "bg-zinc-600",
  },
  {
    id: "demo-broadcom",
    name: "Broadcom",
    email: "info@broadcom.com",
    phone: "+1 408-433-8000",
    stage: "Lead",
    tags: ["Technology", "Semiconductors", "Infrastructure"],
    category: "company",
    toneClass: "bg-red-600",
  },
  {
    id: "demo-dropbox",
    name: "Dropbox",
    email: "info@dropbox.com",
    phone: "+1 415-857-6800",
    stage: "Lead",
    tags: ["Software", "Cloud", "Collaboration"],
    category: "company",
    toneClass: "bg-blue-500",
  },
  {
    id: "demo-google",
    name: "Google",
    email: "contact@google.com",
    phone: "+1 650-253-0000",
    stage: "Lead",
    tags: ["Technology", "Internet", "Web Services"],
    category: "company",
    toneClass: "bg-emerald-500",
  },
  {
    id: "demo-microsoft",
    name: "Microsoft",
    email: "contact@microsoft.com",
    phone: "+1 425-882-8080",
    stage: "Lead",
    tags: ["Technology", "IT Services", "B2B"],
    category: "company",
    toneClass: "bg-sky-500",
  },
  {
    id: "demo-mahmut",
    name: "Mahmut Jomaa",
    email: "mahmut.jomaa@example.com",
    phone: "+1 650-415-2200",
    stage: "Customer",
    tags: ["Founder", "Advisor"],
    category: "person",
    toneClass: "bg-purple-500",
  },
  {
    id: "demo-sara",
    name: "Sara Chen",
    email: "sara.chen@example.com",
    phone: "+1 408-790-1110",
    stage: "Lead",
    tags: ["Investor", "Angel"],
    category: "person",
    toneClass: "bg-indigo-500",
  },
];

function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function syntheticEmail(name: string): string {
  const slug = slugFromName(name);

  if (slug.includes("-")) {
    return `${slug}@example.com`;
  }

  return `contact@${slug}.com`;
}

function syntheticPhone(index: number): string {
  const head = 400 + ((index * 17) % 200);
  const middle = 100 + ((index * 47) % 900);
  const tail = 1000 + ((index * 131) % 9000);

  return `+1 ${head}-${middle}-${tail}`;
}

function inferCategory(name: string): ContactCategory {
  const companyWords = [
    "inc",
    "llc",
    "corp",
    "systems",
    "labs",
    "technologies",
  ];

  const lower = name.toLowerCase();

  if (companyWords.some((word) => lower.includes(word))) {
    return "company";
  }

  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2 && parts.every((part) => /^[A-Z][a-z]/.test(part))) {
    return "person";
  }

  return "company";
}

function toContactRows(clients: ClientRow[] | undefined): ContactRow[] {
  if (!clients || clients.length === 0) {
    return DEMO_CONTACTS;
  }

  return clients.map((client, index) => {
    const group = TAG_GROUPS[index % TAG_GROUPS.length] ?? TAG_GROUPS[0] ?? [];
    const fallback = DEMO_CONTACTS[index % DEMO_CONTACTS.length];

    return {
      id: client.id,
      name: client.name,
      email: client.externalReference?.includes("@")
        ? client.externalReference.toLowerCase()
        : syntheticEmail(client.name),
      phone: fallback?.phone ?? syntheticPhone(index),
      stage: client.status === "archived" ? "Customer" : "Lead",
      tags: group,
      category: inferCategory(client.name),
      toneClass: TONE_CLASSES[index % TONE_CLASSES.length] ?? "bg-slate-500",
    };
  });
}

function rowsForView(rows: ContactRow[], view: ContactsView): ContactRow[] {
  if (view === "people") {
    return rows.filter((row) => row.category === "person");
  }

  if (view === "companies") {
    return rows.filter((row) => row.category === "company");
  }

  if (view === "tags") {
    return rows.filter((row) => row.tags.length > 0);
  }

  return rows;
}

function pageCount(totalItems: number, rowsPerPage: number): number {
  return Math.max(1, Math.ceil(totalItems / rowsPerPage));
}

export function ContactsArea() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ContactsView>("companies");
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const clientsQuery = useQuery(
    queryOptions({
      queryKey: ["contacts-area-clients"],
      queryFn: () => listClientsServerFn(),
    }),
  );

  const contacts = useMemo(
    () => toContactRows(clientsQuery.data),
    [clientsQuery.data],
  );

  const filteredRows = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const scopedRows = rowsForView(contacts, view);

    if (!needle) {
      return scopedRows;
    }

    return scopedRows.filter(
      (row) =>
        row.name.toLowerCase().includes(needle) ||
        row.email.toLowerCase().includes(needle) ||
        row.tags.some((tag) => tag.toLowerCase().includes(needle)),
    );
  }, [contacts, search, view]);

  const totalPages = pageCount(filteredRows.length, rowsPerPage);

  useEffect(() => {
    setPageIndex((currentPage) => Math.min(currentPage, totalPages - 1));
  }, [totalPages]);

  useEffect(() => {
    const validIds = new Set(filteredRows.map((row) => row.id));

    setSelectedIds((currentSelection) => {
      const nextSelection = new Set<string>();

      for (const id of currentSelection) {
        if (validIds.has(id)) {
          nextSelection.add(id);
        }
      }

      return nextSelection;
    });
  }, [filteredRows]);

  const pagedRows = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, pageIndex, rowsPerPage]);

  const hasRows = pagedRows.length > 0;
  const allRowsSelected =
    hasRows && pagedRows.every((row) => selectedIds.has(row.id));
  const someRowsSelected =
    !allRowsSelected && pagedRows.some((row) => selectedIds.has(row.id));

  const pageLabel = `${pageIndex + 1} of ${totalPages}`;

  return (
    <section className="border-b border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)]">
      <header className="border-b border-[color:var(--fc-content-border)] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">
              Contacts
            </h1>
            <Info className="mt-0.5 size-4 text-muted-foreground" />
          </div>
          <Button
            className="h-10 rounded-lg bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
            type="button"
          >
            Add contact
          </Button>
        </div>
      </header>

      <div className="border-b border-[color:var(--fc-content-border)] px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {TAB_OPTIONS.map((tab) => {
              const Icon = tab.icon;
              const active = tab.value === view;

              return (
                <button
                  className={cn(
                    "inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                    active
                      ? "border-border bg-muted text-foreground"
                      : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                  )}
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    setView(tab.value);
                    setPageIndex(0);
                  }}
                >
                  <Icon className="size-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="relative ml-auto w-full min-w-[16rem] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoComplete="off"
              className="h-10 rounded-lg border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPageIndex(0);
              }}
            />
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="overflow-x-auto">
          <Table className="min-w-[980px]">
            <TableHeader>
              <TableRow className="border-[color:var(--fc-content-border)] hover:bg-transparent">
                <TableHead className="w-12 px-0">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      aria-label="Select all contacts in view"
                      checked={
                        allRowsSelected
                          ? true
                          : someRowsSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) => {
                        setSelectedIds((currentSelection) => {
                          const nextSelection = new Set(currentSelection);

                          if (checked === true) {
                            for (const row of pagedRows) {
                              nextSelection.add(row.id);
                            }
                            return nextSelection;
                          }

                          for (const row of pagedRows) {
                            nextSelection.delete(row.id);
                          }

                          return nextSelection;
                        });
                      }}
                    />
                  </div>
                </TableHead>
                <TableHead className="h-11 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Name
                    <ArrowUp className="size-3.5" />
                  </div>
                </TableHead>
                <TableHead className="h-11 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Email
                    <ArrowUpDown className="size-3.5" />
                  </div>
                </TableHead>
                <TableHead className="h-11 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Phone
                    <ArrowUpDown className="size-3.5" />
                  </div>
                </TableHead>
                <TableHead className="h-11 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Stage
                    <ArrowUpDown className="size-3.5" />
                  </div>
                </TableHead>
                <TableHead className="h-11 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    Tags
                    <ArrowUpDown className="size-3.5" />
                  </div>
                </TableHead>
                <TableHead className="h-11 w-14 text-right text-sm text-muted-foreground">
                  <button
                    aria-label="Table settings"
                    className="inline-flex size-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                    type="button"
                  >
                    <SlidersHorizontal className="size-4" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientsQuery.isLoading ? (
                <TableRow className="border-[color:var(--fc-content-border)] hover:bg-transparent">
                  <TableCell
                    className="px-0 py-9 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Loading contacts...
                  </TableCell>
                </TableRow>
              ) : clientsQuery.isError ? (
                <TableRow className="border-[color:var(--fc-content-border)] hover:bg-transparent">
                  <TableCell
                    className="px-0 py-9 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    Could not load contacts. Refresh to try again.
                  </TableCell>
                </TableRow>
              ) : pagedRows.length === 0 ? (
                <TableRow className="border-[color:var(--fc-content-border)] hover:bg-transparent">
                  <TableCell
                    className="px-0 py-9 text-center text-muted-foreground"
                    colSpan={7}
                  >
                    No contacts match this view.
                  </TableCell>
                </TableRow>
              ) : (
                pagedRows.map((row) => (
                  <TableRow
                    className="border-[color:var(--fc-content-border)] hover:bg-[color:var(--fc-table-row-hover)]"
                    key={row.id}
                  >
                    <TableCell className="px-0 py-3">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          aria-label={`Select ${row.name}`}
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={(checked) => {
                            setSelectedIds((currentSelection) => {
                              const nextSelection = new Set(currentSelection);

                              if (checked === true) {
                                nextSelection.add(row.id);
                              } else {
                                nextSelection.delete(row.id);
                              }

                              return nextSelection;
                            });
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex size-5 items-center justify-center rounded-md text-[0.625rem] font-semibold text-white",
                            row.toneClass,
                          )}
                        >
                          {row.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-medium text-foreground">
                          {row.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 text-base text-foreground/90">
                      {row.email}
                    </TableCell>
                    <TableCell className="py-3 text-base text-foreground/90">
                      {row.phone}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-2 text-base text-foreground">
                        <Circle className="size-2 fill-current text-muted-foreground" />
                        {row.stage}
                      </span>
                    </TableCell>
                    <TableCell className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.tags.map((tag) => (
                          <span
                            className="inline-flex h-7 items-center rounded-md border border-[color:var(--fc-content-border)] bg-muted px-2.5 text-sm text-foreground/90"
                            key={`${row.id}-${tag}`}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-3 pr-0 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            aria-label={`Actions for ${row.name}`}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-transparent text-muted-foreground transition-colors hover:border-border hover:text-foreground"
                            type="button"
                          >
                            <Ellipsis className="size-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem>Edit contact</DropdownMenuItem>
                          <DropdownMenuItem>Open timeline</DropdownMenuItem>
                          <DropdownMenuItem>Archive contact</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <footer className="border-t border-[color:var(--fc-content-border)] px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-base text-foreground">
            <label className="sr-only" htmlFor="contacts-rows-per-page">
              Rows per page
            </label>
            <select
              className="h-9 rounded-md border border-[color:var(--fc-content-border)] bg-[color:var(--fc-surface)] px-2 text-sm tabular-nums"
              id="contacts-rows-per-page"
              value={rowsPerPage}
              onChange={(event) => {
                setRowsPerPage(Number(event.target.value));
                setPageIndex(0);
              }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-muted-foreground">rows per page</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-base font-medium tabular-nums text-foreground">
              Page {pageLabel}
            </span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="First page"
                className="size-8 border-[color:var(--fc-content-border)]"
                disabled={pageIndex === 0}
                size="icon"
                type="button"
                variant="outline"
                onClick={() => setPageIndex(0)}
              >
                <ChevronsLeft className="size-4" />
              </Button>
              <Button
                aria-label="Previous page"
                className="size-8 border-[color:var(--fc-content-border)]"
                disabled={pageIndex === 0}
                size="icon"
                type="button"
                variant="outline"
                onClick={() =>
                  setPageIndex((currentPage) => Math.max(0, currentPage - 1))
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                aria-label="Next page"
                className="size-8 border-[color:var(--fc-content-border)]"
                disabled={pageIndex >= totalPages - 1}
                size="icon"
                type="button"
                variant="outline"
                onClick={() =>
                  setPageIndex((currentPage) =>
                    Math.min(totalPages - 1, currentPage + 1),
                  )
                }
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                aria-label="Last page"
                className="size-8 border-[color:var(--fc-content-border)]"
                disabled={pageIndex >= totalPages - 1}
                size="icon"
                type="button"
                variant="outline"
                onClick={() => setPageIndex(totalPages - 1)}
              >
                <ChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
