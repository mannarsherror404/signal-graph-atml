import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { graphModelInfo, scoreGraph } from "../app/gnn/graph-recommender.mjs";
import model from "../app/gnn/model.json" with { type: "json" };

test("exported GCN covers exactly the live article collection", () => {
  const articleSource = readFileSync(
    fileURLToPath(new URL("../app/articles.ts", import.meta.url)), "utf8",
  );
  const liveMetadata = [...articleSource.matchAll(
    /id:\s*"([^"]+)"[\s\S]*?category:\s*"([^"]+)"[\s\S]*?tags:\s*\[([^\]]+)\]/g,
  )].map((match) => ({
    id: match[1],
    category: match[2],
    tags: [...match[3].matchAll(/"([^"]+)"/g)].map((tag) => tag[1]),
  }));
  const sourceData = readFileSync(
    fileURLToPath(new URL("../../training/article-graph.json", import.meta.url)),
  );
  const trainingCatalog = JSON.parse(sourceData.toString());
  assert.equal(liveMetadata.length, 10);
  assert.deepEqual(trainingCatalog.articles, liveMetadata);
  assert.deepEqual(graphModelInfo.articleIds, liveMetadata.map((article) => article.id));
  assert.equal(model.sourceSha256, createHash("sha256").update(sourceData).digest("hex"));
  assert.match(graphModelInfo.trainingData, /synthetic/i);
});

test("the editorial order remains the baseline until a story is opened", () => {
  assert.equal(scoreGraph({}), null);
  assert.equal(scoreGraph({ unknown: 3 }), null);
});

test("the trained graph responds to different reader connections", () => {
  const technology = scoreGraph({ "bangalore-mobility-lab": 1 });
  const climate = scoreGraph({ "delhi-cool-streets": 1 });
  const community = scoreGraph({ "community-kitchens": 1 });

  assert.ok(technology["explainable-ai-student"] > technology["resilient-attention"]);
  assert.ok(climate["srinagar-saffron"] > climate["animation-algorithms"]);
  assert.ok(community["resilient-attention"] > community["explainable-ai-student"]);
  assert.notDeepEqual(technology, climate);
  for (const scores of [technology, climate, community]) {
    assert.equal(Object.keys(scores).length, 10);
    assert.ok(Object.values(scores).every(Number.isFinite));
  }
});
