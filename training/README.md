# Reproducing the demo GCN

The original ATML notebook trained a two-layer GCN on five toy users and a
different set of ten article titles. It did not save a model checkpoint. This
folder adapts that approach to the current Signal Graph demo.

`article-graph.json` records the current ten article IDs and their categories
and tags, plus eight **synthetic** reader personas. These preferences are
authored demonstration data, not measured interactions or a production
evaluation set.

The training script uses symmetric normalized graph convolution, ReLU, and
dot-product link prediction. Each training iteration hides some liked
user–article edges and asks the model to score them above unliked articles.
It exports the small weight matrices and graph metadata to
`frontend/app/gnn/model.json`. The browser adds a new session node, connects it
to stories opened by that visitor, and performs the two convolution passes
locally. No Python server or visitor data upload is needed to run the demo.

To regenerate the model, use Python with PyTorch installed:

```sh
python3 training/train_gcn.py
```

Then run `npm test` from the repository root. The exported artifact is kept in
Git so normal visitors and a fresh clone do not need PyTorch or a training run.
The model is a mechanism demonstration on a tiny, synthetic dataset; its
rankings should not be presented as validated news-personalisation quality.
