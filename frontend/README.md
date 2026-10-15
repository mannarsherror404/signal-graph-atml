# Frontend

This directory is the deployable Signal Graph web application.

- `app/` contains the landing page, demo routes, UI, article data, and browser-side GCN inference.
- `public/` contains all local article images.
- `tests/` verifies the landing page and newspaper demo.
- `build/`, `worker` configuration, and `.openai/` support local and hosted builds.
- `dist/`, `.vinext/`, and `.wrangler/` are generated and ignored by Git.

Run frontend commands from the repository root so the shared workspace configuration is used.

The trained model artifact lives at `app/gnn/model.json`; its source data and reproducible training script are in the repository-level `training/` folder. The browser does not need PyTorch or a Python server.
