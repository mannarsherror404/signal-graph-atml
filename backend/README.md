# Backend

This directory contains the server and persistence foundation.

- `worker/` is the Cloudflare/Vinext request handler used by the frontend build.
- `db/` contains the D1 database adapter and schema.
- `drizzle/` contains generated migrations and migration metadata.
- `examples/` contains an optional D1 notes example.

The current recommendation demo does not require remote persistence: its interaction profile stays in browser local storage. This backend is ready for future user accounts, shared interaction history, trained model inference, or API endpoints.
