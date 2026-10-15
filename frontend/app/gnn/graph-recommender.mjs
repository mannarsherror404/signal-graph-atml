import model from "./model.json" with { type: "json" };

const articlePositions = new Map(model.articleIds.map((id, index) => [id, index]));
const personaCount = model.personas.length;
const articleCount = model.articleIds.length;
const sessionNode = personaCount + articleCount;
const nodeCount = sessionNode + 1;

function addUndirected(adjacency, left, right, weight) {
  adjacency[left][right] += weight;
  adjacency[right][left] += weight;
}

function averageFeatures(articleIds) {
  const mean = Array(model.featureTokens.length).fill(0);
  for (const articleId of articleIds) {
    const articleIndex = articlePositions.get(articleId);
    if (articleIndex === undefined) continue;
    model.articleFeatures[articleIndex].forEach((value, featureIndex) => {
      mean[featureIndex] += value / articleIds.length;
    });
  }
  return mean;
}

function propagate(adjacency, features) {
  const degree = adjacency.map((row) => row.reduce((sum, weight) => sum + weight, 0));
  return features.map((_, node) => {
    const output = Array(features[0].length).fill(0);
    for (let neighbour = 0; neighbour < nodeCount; neighbour += 1) {
      const weight = adjacency[node][neighbour];
      if (!weight) continue;
      const normalized = weight / Math.sqrt(degree[node] * degree[neighbour]);
      for (let feature = 0; feature < output.length; feature += 1) {
        output[feature] += normalized * features[neighbour][feature];
      }
    }
    return output;
  });
}

function linear(features, weights, bias, relu = false) {
  return features.map((row) => bias.map((offset, output) => {
    let value = offset;
    for (let input = 0; input < row.length; input += 1) {
      value += row[input] * weights[input][output];
    }
    return relu ? Math.max(0, value) : value;
  }));
}

/**
 * Run the exported, trained two-layer GCN with a new reader node.
 * Each opened story adds a session-to-article edge. Nothing leaves this browser.
 * Returns null before the first read so the editorial edition remains the baseline.
 *
 * @param {Record<string, number>} reads
 * @returns {Record<string, number> | null}
 */
export function scoreGraph(reads) {
  const clicked = Object.keys(reads).filter(
    (id) => articlePositions.has(id) && Number.isFinite(reads[id]) && reads[id] > 0,
  );
  if (clicked.length === 0) return null;

  const adjacency = Array.from({ length: nodeCount }, (_, node) =>
    Array.from({ length: nodeCount }, (_, neighbour) => Number(node === neighbour)),
  );
  for (const [left, right, weight] of model.articleEdges) {
    addUndirected(adjacency, personaCount + left, personaCount + right, weight);
  }
  for (let persona = 0; persona < personaCount; persona += 1) {
    for (const articleId of model.personas[persona].observed) {
      addUndirected(adjacency, persona, personaCount + articlePositions.get(articleId), 1);
    }
  }
  for (const articleId of clicked) {
    const count = Math.min(5, reads[articleId]);
    addUndirected(
      adjacency, sessionNode, personaCount + articlePositions.get(articleId),
      1 + 0.2 * Math.log1p(count),
    );
  }

  const features = [
    ...model.personas.map((persona) => averageFeatures(persona.observed)),
    ...model.articleFeatures,
    averageFeatures(clicked),
  ];
  const hidden = linear(
    propagate(adjacency, features), model.firstWeight, model.firstBias, true,
  );
  const embeddings = linear(
    propagate(adjacency, hidden), model.secondWeight, model.secondBias,
  );
  const reader = embeddings[sessionNode];
  return Object.fromEntries(model.articleIds.map((articleId, index) => [
    articleId,
    reader.reduce(
      (score, value, dimension) =>
        score + value * embeddings[personaCount + index][dimension],
      0,
    ) / Math.sqrt(reader.length),
  ]));
}

export const graphModelInfo = {
  architecture: model.architecture,
  trainingData: model.trainingData,
  articleIds: model.articleIds,
};
