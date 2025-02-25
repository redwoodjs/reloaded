# RedwoodSDK

This is a mono repo for the Redwood SDK.

```
├── docs - contains the docs for the SDK, based on Starlight
├── experiments - contains all the projects we've built as experiments
│   ├── applywize - a tool for applying for jobs, this will be the basis for the new tutorial
│   ├── billable - a tool for creating invoices
│   ├── cutable - a tool for cutting boards
│   ├── cutl
│   ├── griffon
│   ├── rsc
│   ├── textify
│   └── yt-dos
├── markdown - contains the old docs. We'll eventually migrate these into the docs
├── pnpm-workspace.yaml - list of all the workspaces in the repo
├── readme.md - this file
├── sdk - the main Redwood SDK package
└── starters - starter projects, meant to help someone get up and running quickly
    ├── drizzle - includes a Drizzle setup for working with Cloudflare d1
    ├── minimal - a minimal projects, no db required
    └── prisma - includes a Prisma setup for working with Cloudflare d1
```

## Getting Started

```bash
pnpm install
```

## Running the Docs Locally

```bash
cd docs
pnpm dev
```

## Running one of the Experiments locally

Each [experiment](./experiments/) should have it's own README with instructions

## Building a Project locally

We have starter specific instructions

- [Minimal](./starters/minimal/README.md) for smaller projects, no db required
- [Prisma](./starters/prisma/README.md) for projects that use Prisma as an ORM, integrates with Cloudflare d1
- [Drizzle](./starters/drizzle/README.md) for projects that use Drizzle as an ORM, integrates with Cloudflare d1
