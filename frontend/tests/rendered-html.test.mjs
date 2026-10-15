import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Signal Graph landing page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Signal Graph — News that learns with you<\/title>/i);
  assert.match(html, /SIGNAL/);
  assert.match(html, /GRAPH/);
  assert.match(html, /The front page that learns your/);
  assert.match(html, /Try the live demo/);
  assert.match(html, /10/);
  assert.match(html, /fixed demo stories/);
  assert.match(html, /href="\/demo"/);
});

test("server-renders the interactive newspaper demo", async () => {
  const response = await render("/demo");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /A fixed collection, reordered by what you choose to read/);
  assert.match(html, /Reset edition/);
  assert.match(html, /Read a story to begin shaping your edition/);
  assert.match(html, /The Daily Signal/i);
});
