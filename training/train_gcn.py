#!/usr/bin/env python3
"""Train the demo's two-layer GCN and export browser-readable weights.

This follows the user/article link-prediction structure of the original ATML
notebook, but uses the current article collection and reproducible synthetic
reader preferences. It does not claim to learn from real visitors.
"""

import json
import hashlib
import math
import random
from pathlib import Path

import torch
from torch import nn
from torch.nn import functional as F


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "training" / "article-graph.json"
OUTPUT_PATH = ROOT / "frontend" / "app" / "gnn" / "model.json"
SEED = 17
EPOCHS = 500
HIDDEN_DIM = 20
OUTPUT_DIM = 12


class GCN(nn.Module):
    def __init__(self, feature_count: int):
        super().__init__()
        self.first = nn.Linear(feature_count, HIDDEN_DIM)
        self.second = nn.Linear(HIDDEN_DIM, OUTPUT_DIM)

    def forward(self, features: torch.Tensor, normalized_adj: torch.Tensor):
        hidden = F.relu(self.first(normalized_adj @ features))
        return self.second(normalized_adj @ hidden)


def load_catalog():
    catalog = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    articles = catalog["articles"]
    personas = catalog["personas"]
    article_ids = [article["id"] for article in articles]
    if len(article_ids) != len(set(article_ids)) or len(article_ids) != 10:
        raise ValueError("Expected the current 10 unique demo articles")
    for persona in personas:
        if len(persona["likes"]) < 3 or len(set(persona["likes"])) != len(persona["likes"]):
            raise ValueError(f"Invalid preferences for {persona['id']}")
        if not set(persona["likes"]) <= set(article_ids):
            raise ValueError(f"Unknown article in preferences for {persona['id']}")
    return articles, personas


def article_features(articles):
    tokens = sorted({
        token
        for article in articles
        for token in [f"category:{article['category']}"]
        + [f"tag:{tag}" for tag in article["tags"]]
    })
    positions = {token: index for index, token in enumerate(tokens)}
    features = torch.zeros((len(articles), len(tokens)), dtype=torch.float32)
    for index, article in enumerate(articles):
        features[index, positions[f"category:{article['category']}"]] = 1.0
        for tag in article["tags"]:
            features[index, positions[f"tag:{tag}"]] = 1.0
    return tokens, F.normalize(features, dim=1)


def article_edges(articles):
    edges = []
    for left in range(len(articles)):
        for right in range(left + 1, len(articles)):
            same_category = articles[left]["category"] == articles[right]["category"]
            shared_tags = set(articles[left]["tags"]) & set(articles[right]["tags"])
            weight = (0.6 if same_category else 0.0) + 0.35 * len(shared_tags)
            if weight:
                edges.append((left, right, weight))
    return edges


def graph_inputs(article_vectors, article_ids, personas, similarities, observed):
    persona_count = len(personas)
    article_count = len(article_ids)
    node_count = persona_count + article_count
    positions = {article_id: index for index, article_id in enumerate(article_ids)}
    adjacency = torch.eye(node_count, dtype=torch.float32)

    for left, right, weight in similarities:
        a, b = persona_count + left, persona_count + right
        adjacency[a, b] += weight
        adjacency[b, a] += weight

    user_vectors = []
    for user_index, liked_ids in enumerate(observed):
        liked_indices = [positions[article_id] for article_id in liked_ids]
        user_vectors.append(article_vectors[liked_indices].mean(dim=0))
        for article_index in liked_indices:
            article_node = persona_count + article_index
            adjacency[user_index, article_node] += 1.0
            adjacency[article_node, user_index] += 1.0

    features = torch.cat((torch.stack(user_vectors), article_vectors), dim=0)
    degree = adjacency.sum(dim=1).clamp(min=1.0)
    normalized = adjacency / degree.sqrt()[:, None] / degree.sqrt()[None, :]
    return features, normalized


def train():
    torch.manual_seed(SEED)
    rng = random.Random(SEED)
    articles, personas = load_catalog()
    article_ids = [article["id"] for article in articles]
    article_positions = {article_id: index for index, article_id in enumerate(article_ids)}
    tokens, vectors = article_features(articles)
    similarities = article_edges(articles)

    model = GCN(len(tokens))
    optimizer = torch.optim.Adam(model.parameters(), lr=0.02, weight_decay=0.0001)
    persona_count = len(personas)

    for epoch in range(EPOCHS):
        observed = []
        positives = []
        negatives = []
        for user_index, persona in enumerate(personas):
            liked = persona["likes"]
            seen = rng.sample(liked, k=rng.choice((1, 2)))
            observed.append(seen)
            unseen_likes = [article_id for article_id in liked if article_id not in seen]
            other_articles = [article_id for article_id in article_ids if article_id not in liked]
            for article_id in unseen_likes:
                positives.append((user_index, persona_count + article_positions[article_id]))
                negative_id = rng.choice(other_articles)
                negatives.append((user_index, persona_count + article_positions[negative_id]))

        features, adjacency = graph_inputs(vectors, article_ids, personas, similarities, observed)
        embeddings = model(features, adjacency)
        positive_scores = torch.stack([
            (embeddings[user] * embeddings[article]).sum() / math.sqrt(OUTPUT_DIM)
            for user, article in positives
        ])
        negative_scores = torch.stack([
            (embeddings[user] * embeddings[article]).sum() / math.sqrt(OUTPUT_DIM)
            for user, article in negatives
        ])
        logits = torch.cat((positive_scores, negative_scores))
        targets = torch.cat((torch.ones_like(positive_scores), torch.zeros_like(negative_scores)))
        loss = F.binary_cross_entropy_with_logits(logits, targets)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if (epoch + 1) % 100 == 0:
            print(f"epoch {epoch + 1:3d}/{EPOCHS}  link loss {loss.item():.4f}")

    # The fixed background graph supplies a small collaborative signal. A live
    # session node is added in the browser and linked to the stories it opens.
    exported_personas = [
        {"id": persona["id"], "observed": persona["likes"][:2]}
        for persona in personas
    ]
    payload = {
        "version": 1,
        "sourceSha256": hashlib.sha256(DATA_PATH.read_bytes()).hexdigest(),
        "architecture": "two-layer symmetric-normalized GCN; ReLU; user/article dot-product link score",
        "trainingData": "synthetic demo reader preferences; no real visitor data",
        "seed": SEED,
        "epochs": EPOCHS,
        "featureTokens": tokens,
        "articleIds": article_ids,
        "articleFeatures": vectors.tolist(),
        "articleEdges": similarities,
        "personas": exported_personas,
        "firstWeight": model.first.weight.detach().T.tolist(),
        "firstBias": model.first.bias.detach().tolist(),
        "secondWeight": model.second.weight.detach().T.tolist(),
        "secondBias": model.second.bias.detach().tolist(),
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"exported {OUTPUT_PATH}")


if __name__ == "__main__":
    train()
