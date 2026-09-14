# PRODUCT.md — DocLens

## Product truth
In-browser document intelligence: PDF.js page rendering, OpenCV preprocessing
(grayscale, denoise, adaptive threshold), Tesseract.js OCR with word-level
confidence, Nemotron structured extraction into typed fields with per-field
confidence (unknowns return null, never guessed). Six classifiers: invoice,
receipt, purchase order, resume, contract, general. Private per-user archive
with timeline, search, JSON/CSV export. Routes: `/login`, `/dashboard`.
Landing anchors (stable): `#features`, `#pipeline`, `#faq`.
Primary CTA labels (stable): "Sign in", "Get started", "Open archive dashboard".
