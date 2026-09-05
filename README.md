# ChronicleAI

## AI-Powered Organizational Memory and Knowledge Graph

ChronicleAI is an AI-powered knowledge management and retrieval platform that transforms unstructured organizational documents into a structured, queryable knowledge base.

It combines **LLM-based knowledge extraction, Neo4j knowledge graphs, ChromaDB vector search, and Retrieval-Augmented Generation (RAG)** to allow users to upload documents and ask natural-language questions about the information contained within them.

The system maintains both the semantic content of documents and the relationships between the entities contained within them, enabling more contextual and relationship-aware answers.

---

## Overview

Traditional document search relies primarily on keyword or semantic matching. This can make it difficult to answer questions that depend on relationships between people, projects, technologies, organizations, decisions, and other entities.

ChronicleAI addresses this by maintaining two complementary representations of organizational knowledge:

- **Neo4j** stores entities and their relationships as a knowledge graph.
- **ChromaDB** stores document chunks and their vector embeddings for semantic retrieval.
- **NVIDIA AI / NIM** performs knowledge extraction and generates answers using the retrieved context.
- **FastAPI** orchestrates the ingestion and query pipelines.

This creates a hybrid retrieval architecture that combines:

    Structured Graph Retrieval
                +
    Semantic Vector Retrieval
                +
          LLM Reasoning
                =
       Context-Aware Answers

---

# Architecture

```text
                         ┌──────────────────────┐
                         │      Frontend        │
                         │ Document Upload /    │
                         │   Natural Queries    │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │       FastAPI        │
                         │       Backend        │
                         └──────────┬───────────┘
                                    │
                   ┌────────────────┴────────────────┐
                   │                                 │
                   ▼                                 ▼
        ┌──────────────────┐              ┌──────────────────┐
        │ Document         │              │ Query            │
        │ Ingestion        │              │ Processing       │
        └────────┬─────────┘              └────────┬─────────┘
                 │                                 │
                 ▼                                 ▼
        ┌──────────────────┐              ┌──────────────────┐
        │ Text Extraction  │              │ Query Embedding  │
        └────────┬─────────┘              └────────┬─────────┘
                 │                                 │
                 ▼                                 │
        ┌──────────────────┐                       │
        │    NVIDIA AI     │                       │
        │ Knowledge        │                       │
        │ Extraction       │                       │
        └────────┬─────────┘                       │
                 │                                 │
          ┌──────┴───────┐                         │
          │              │                         │
          ▼              ▼                         ▼
   ┌──────────────┐ ┌──────────────┐       ┌──────────────┐
   │    Neo4j     │ │   ChromaDB   │       │    Hybrid    │
   │  Knowledge   │ │ Vector Store │       │  Retrieval   │
   │    Graph     │ │              │       └──────┬───────┘
   └──────┬───────┘ └──────┬───────┘              │
          │                │                      │
          └────────────────┴──────────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Retrieved Context│
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │    NVIDIA AI     │
                  │ Answer Generation│
                  └────────┬─────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Final Response   │
                  └──────────────────┘