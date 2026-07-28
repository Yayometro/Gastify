# Local AI Models & Token Offloading Guide (Ollama)

> **Purpose for AI Agents (Gemini, Claude, ChatGPT, Qwen)**:
> This document specifies the local Ollama LLMs and Embedding models installed on the user's computer. Frontier AI agents (such as Gemini 3.6 Flash, Claude, or GPT-4o) MUST strategically leverage these local models for repetitive, high-volume, or batch processing subtasks to **dramatically reduce cloud API token consumption** while keeping data processing fast and local.

---

## 🛠️ Installed Local Models Overview

| Model Name | ID | Size | Category | Primary Specialization |
| :--- | :---: | :---: | :---: | :--- |
| **`qwen3.6:27b`** | `a50eda8ed977` | 17 GB | **LLM (Heavy)** | Advanced reasoning, complex text normalization, batch extraction, code generation & structural analysis. |
| **`qwen3.5:9b`** | `6488c96fa5fa` | 6.6 GB | **LLM (Light)** | Fast categorization, quick string cleanup, simple concept mapping, high-speed filtering. |
| **`bge-m3:latest`** | `790764642607` | 1.2 GB | **Embedding** | Multi-lingual semantic embeddings, RAG, vector similarity search over historical transactions and docs. |
| **`qwen3-embedding:0.6b`** | `ac6da0dfba84` | 639 MB | **Embedding** | Ultra-fast lightweight embeddings for local vector lookups and clustering. |

---

## 🎯 Model Categorization & Offloading Matrix

### 1. `qwen3.6:27b` (Heavy Local Reasoning & Sub-Task Drafts)
- **When to use**:
  - Processing long unformatted text blocks from bank statements or logs.
  - Normalizing non-standard transaction descriptions.
  - Generating initial code/script drafts locally.
  - Doing heavy structural analysis without consuming external API quota.

### 2. `qwen3.5:9b` (Fast Classification & Light Formatting)
- **When to use**:
  - Categorizing transactions against predefined lists (`NAMING_RULES.json`).
  - Simple regex validation and string sanitization.
  - Formatting lists into JSON or Markdown tables.
  - Low-latency batch tasks requiring high speed.

### 3. `bge-m3:latest` (Semantic Search & RAG)
- **When to use**:
  - Matching ambiguous transaction descriptions to database `Category` / `SubCategory` names using vector similarity.
  - Building or querying local RAG vector stores over user financial history.

### 4. `qwen3-embedding:0.6b` (Ultra-Fast Local Vector Lookups)
- **When to use**:
  - High-speed semantic similarity comparisons for real-time string matching.

---

## 🔌 How External AI Agents Query Local Ollama Models

Local Ollama instance runs locally on: `http://localhost:11434`.

### Example 1: Offloading Text Generation / Classification (cURL / HTTP)
```bash
curl -s http://localhost:11434/api/generate -d '{
  "model": "qwen3.5:9b",
  "prompt": "Categorize this concept: OXXO VIENA MEX. Return JSON {\"subCategory\": \"Oxxo\"}",
  "stream": false
}'
```

### Example 2: Generating Local Embeddings for Semantic Matching (Node.js)
```javascript
const response = await fetch('http://localhost:11434/api/embeddings', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'bge-m3:latest',
    prompt: 'Pago de servicios de agua Seguagua'
  })
});
const { embedding } = await response.json();
```

---

## ⚡ Strategic Token Reduction Rules for AI Assistants

1. **Do not process raw batch loops on Cloud API**: If you need to categorize 500+ raw strings, write a local Node.js or Python script that calls `http://localhost:11434/api/generate` using `qwen3.5:9b` or `qwen3.6:27b`.
2. **Combine Vector Matching with Local LLMs**: Use `bge-m3:latest` to perform semantic vector lookups against `NAMING_RULES.json` before falling back to full LLM prompts.
3. **Keep Context Clean**: Summarize local model outputs before injecting them into the primary AI agent conversation context.
