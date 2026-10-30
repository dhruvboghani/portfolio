---
title: Document parsing for RAG: PDFs, tables and scans
description: How to parse documents for RAG: extracting clean text from PDFs, keeping tables intact, running OCR on scans, preserving structure and checking quality.
date: 2026-10-30
tags: rag, document-parsing, llm
---
Most RAG problems that look like retrieval problems start earlier, at parsing. If the text you index is out of order, missing table values or full of headers and page numbers, no embedding model or reranker can fix it.

Real documents are messy: multi-column PDFs, tables that span pages, scanned forms and slides. This post covers how to turn them into clean, structured text that retrieval can work with.

## Know what kind of document you have

Different documents need different handling, so detect the type first.

- **Digital PDFs** contain real text, but not always in reading order. Columns, footnotes and sidebars can come out interleaved.
- **Scanned PDFs and images** contain only pixels, so they need OCR.
- **Mixed PDFs** have some text pages and some scanned pages, or text with embedded images of tables.
- **Office files** like DOCX, XLSX and PPTX already carry structure such as headings, cells and slides. Use it rather than converting to PDF first.
- **HTML and Markdown** are usually easiest, as long as you strip navigation and boilerplate.

A quick check works well: if a PDF page yields almost no extractable text, treat it as scanned.

## Extract text with structure, not just characters

Plain text loses the information retrieval needs most. Aim to keep:

- **Headings and their levels,** so chunks can carry the section they belong to.
- **Reading order** across columns.
- **Lists** as lists.
- **Page numbers** for citations, stored as metadata rather than in the text.

Layout-aware parsers and document AI services detect blocks such as titles, paragraphs, tables and figures, and return them in reading order. Converting the result to Markdown is a practical target, because headings, lists and tables survive and models read Markdown well.

Remove repeated headers, footers, page numbers and watermarks. They add noise to every chunk and can dominate similarity search.

## Keep tables intact

Tables are where naive parsing fails most. Flattened into lines of text, a table loses which value belongs to which row and column.

- **Detect tables as tables** and extract them cell by cell.
- **Store them as Markdown or HTML tables** so headers stay attached to values.
- **Do not split a table across chunks.** If a table is large, split by rows and repeat the header row in each chunk.
- **Add a short description** of what the table shows, which helps retrieval for questions phrased in words.
- **Join tables that continue across pages** when the header repeats.

```markdown
## 4.2 GST rates by product category

| HSN code | Product            | GST rate |
|----------|--------------------|----------|
| 8471     | Laptop computers   | 18%      |
| 6302     | Cotton towels      | 12%      |
```

## Handle scans with OCR

- **Improve the image first:** straighten skewed pages, increase contrast and use a sensible resolution.
- **Choose OCR that supports your languages and scripts,** including Indian languages if your documents use them.
- **Keep OCR confidence scores** and flag low-confidence pages for review instead of indexing bad text silently.
- **Use layout-aware OCR** for forms and tables, so fields and cells keep their positions.

Vision-capable language models can also read complex pages, charts and handwriting well. They are slower and more expensive, so a common pattern is to use them only for pages where standard extraction fails.

## Don't forget images and charts

Charts and diagrams often hold the key fact on a page. Generate a short text description or caption for each important figure and index it alongside the page, with a link back to the image.

## Attach metadata for retrieval and citations

Every chunk should carry its source document, page numbers, section heading path, document date and any access permissions. This enables filtering, recent-first ranking and answers that cite exactly where information came from.

## Check parsing quality

- **Spot-check samples** from each document type and source, comparing parsed text with the original.
- **Track simple metrics:** pages with no text, OCR confidence, number of tables found, and very short or very long chunks.
- **Keep the parsed output,** not just the embeddings, so you can inspect and re-index without parsing again.
- **Re-run a retrieval evaluation** when you change parsers, because better parsing usually shows up directly as better recall.

## Takeaway

Good RAG starts with good parsing: detect each document's type, extract text in reading order with headings and lists intact, keep tables whole with their headers, use OCR carefully on scans, describe important figures, and attach page and section metadata. Check parsing quality regularly, because retrieval can only be as good as the text it searches.
