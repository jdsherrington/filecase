# Filecase - Document Management System

Monorepo for the document management application Filecase.

So far, the backend consists of NestJS as the framework, Clerk for authentication, Neon as the serverless Postgres DB provider, Drizzle ORM for type-safe SQL queries, and Swagger to standardize REST API design and documentation.

Frontend not yet developed, but will use TanStack Start with React for SSR.

## Workspaces

- `apps/api`: NestJS backend
- `apps/web`: TanStack Start (React) frontend
- `packages/shared-types`: Shared TypeScript types

## Prerequisites

- [Bun](https://bun.sh/)

## Development

To start backend server:

```bash
bun dev:api
```

To start frontend server:

```bash
bun dev:web
```
