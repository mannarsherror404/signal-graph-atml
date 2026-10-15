# Signal Graph News

Signal Graph News is organized as a small frontend/backend monorepo.

## Structure

```text
signal_graph_webapp/
├── frontend/              Web product
│   ├── app/               Landing page, demo, and recommendation UI
│   ├── public/            Local article images and public assets
│   ├── tests/             Rendered-page tests
│   ├── build/             Sites build integration
│   ├── dist/              Generated production build
│   └── .openai/           Sites hosting configuration
├── backend/               Server and persistence layer
│   ├── worker/            Cloudflare/Vinext server entry point
│   ├── db/                Database access and schema
│   ├── drizzle/           Database migrations
│   └── examples/          Optional D1 implementation example
├── training/              Reproducible GCN training on demo data
├── package.json           Commands for the complete product
└── package-lock.json      Reproducible dependency versions
```

`node_modules/` remains at the repository root because npm workspaces share one dependency installation. It is generated, ignored by Git, and should not be edited.

## Run offline

Node.js 22.13 or newer is required. On macOS, double-click `run.command` to install dependencies, build the site on the first run, and open it. An internet connection is needed only for that initial `npm ci`; the demo and GCN inference run locally afterward.

Or, from this folder:

```bash
npm ci
npm run start
```

Open:

```text
http://127.0.0.1:3000
```

The desktop-folder shortcut at `../run-offline.command` calls this same launcher.

## Publishing scope

This repository contains the runnable web product and its training code. The original notebooks, reports, and personal photos remain in the sibling `legacy_prototype/` folder on the owner's Mac and are deliberately **not** part of this Git repository. Review those materials separately before publishing them.

## Development commands

```bash
npm run dev
npm run build
npm test
npm run lint
npm run db:generate
```

## Graph recommendation demo

The demo uses ten fixed local stories. Before a visitor opens a story, it shows the authored editorial order. After a read, a trained two-layer graph convolutional network (GCN) reranks unread stories. A new reader node is connected to the stories that visitor opened; inference happens entirely in the browser. The reading history stays in browser local storage.

The GCN follows the link-prediction structure of the legacy notebook, but was retrained for these ten stories because that notebook used different toy articles and did not save a checkpoint. Its eight reader personas and their preferences are **synthetic demonstration data**. This shows a real graph model in action, not validated recommendation accuracy on real users. See [`training/README.md`](training/README.md) for the model, reproducibility, and limitations.

The backend directory remains a server and database foundation for a later account-based or multi-user version; the current demo does not use remote persistence.

## Dependency review

On 15 October 2026, compatible updates to Next.js, React, Vite, and Cloudflare
tooling were applied. A clean install, build, five tests, lint, and local HTTP
smoke checks for `/` and `/demo` passed. The lockfile now selects patched
`fflate` 0.7.5. The root also declares the RSC plugin so npm's workspace
hoisting keeps it available to Vinext during a clean build.

The npm audit still reports 13 findings (9 high) across the full toolchain, or
7 high in the production dependency view, mainly through Vinext 0.0.50 and
its transitive packages. A trial upgrade to Vinext 1.2.0 built but broke the
local server and server-render tests on a `cloudflare:` import, so it was
rolled back. Treat a tested Vinext migration and another security review as
prerequisites for a public production service; the current project remains a
fixed-data portfolio demo.
