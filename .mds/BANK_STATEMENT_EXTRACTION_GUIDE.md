# Guide: Bank Statement Extraction to Gastify Template

> **Metadata**
> - **Created By**: Gemini 3.6 Flash (Google AI)
> - **Application**: Gastify (Yayometro / Gastify)
> - **Date**: July 24, 2026
> - **Purpose**: Reference guide for AI assistants to read bank statements (PDFs) from HSBC and Santander, extract transactions, and populate the official `gastify-template.xlsx` file without errors or structure corruption.
> - **Related Guides**:
>   - [`NAMING_RULES.json`](file:///Users/luisjairvazqueznavarrete/Coding%20Proyects/Gastify/.mds/NAMING_RULES.json) (Machine-executable naming rules)
>   - [`NAMING_RULES.md`](file:///Users/luisjairvazqueznavarrete/Coding%20Proyects/Gastify/.mds/NAMING_RULES.md) (Human & LLM concept documentation)
>   - [`LOCAL_AI_MODELS_GUIDE.md`](file:///Users/luisjairvazqueznavarrete/Coding%20Proyects/Gastify/.mds/LOCAL_AI_MODELS_GUIDE.md) (Local Ollama LLMs for token offloading)

---

## 📁 Environment & File Locations

| Asset / Resource | Absolute Path |
| :--- | :--- |
| **Project Root** | `/Users/luisjairvazqueznavarrete/Coding Proyects/Gastify` |
| **Bank Statements Directory** | `/Users/luisjairvazqueznavarrete/Documents/Estados de cuenta /` |
| **2Now Statements Folder** | `/Users/luisjairvazqueznavarrete/Documents/Estados de cuenta /2now/` |
| **Santander Crédito Folder** | `/Users/luisjairvazqueznavarrete/Documents/Estados de cuenta /Santander crédito /` |
| **Santander Nómina Folder** | `/Users/luisjairvazqueznavarrete/Documents/Estados de cuenta /Santander nomina /` |
| **Template Excel File** | `/Users/luisjairvazqueznavarrete/Documents/Estados de cuenta /gastify-template.xlsx` |
| **Documentation Folder** | `/Users/luisjairvazqueznavarrete/Coding Proyects/Gastify/.mds/` |

---

## 📊 Gastify Template Specification (`gastify-template.xlsx`)

### Template Properties & Version
- **Template Version**: `2.0` (Stored in hidden sheet `_data` at cell `C1`).
- **Main Sheet Name**: `Transactions`
- **Data Sheet Name**: `_data` (Contains hidden autocomplete list for Categories and SubCategories).

### Sheet Header Layout (`Transactions`)
| Column | Name | Type | Description / Rules |
| :---: | :--- | :---: | :--- |
| **A** | `Date *` | String/Date | Format `DD/MM/YYYY` (e.g. `18/06/2026`). Required. |
| **B** | `Concept *` | String | Description of merchant or movement. Required (apply `NAMING_RULES.json`). |
| **C** | `Amount *` | Number | Positive monetary value (e.g. `318.00`). Required. |
| **D** | `Type (Bill/Income) *` | String | `"Bill"` (Expense/Cargo/Retiro) or `"Income"` (Abono/Pago/Deposito). Required. |
| **E** | `Category` | String | Name of Category. *Fill Category OR SubCategory — not both.* |
| **F** | `SubCategory` | String | Name of SubCategory. Auto-resolves parent Category on upload. |
| **G** | `Tags` | String | Comma-separated tags (e.g. `tag1, tag2`). Optional. |

---

## 🏦 Bank Formats Breakdown

### 1. HSBC 2Now (Credit Card)
- **Target Section**: `c) CARGOS, ABONOS Y COMPRAS REGULARES (NO A MESES)`
- **Multi-Card Handling**: Check both **Tarjeta Titular** and **Tarjeta Adicional** sections!
- **Sign Convention**:
  - `+ $XX.XX` = Cargo / Purchase -> Set `Type = "Bill"`
  - `- $XX.XX` = Abono / Payment / Refund -> Set `Type = "Income"`

### 2. Santander Crédito (Credit Card)
- **Target Section**: `CARGOS, ABONOS Y COMPRAS REGULARES (NO A MESES)`
- **Sign Convention**:
  - `+ $XX.XX` = Cargo / Purchase -> Set `Type = "Bill"`
  - `- $XX.XX` = Abono / Payment / Transfer -> Set `Type = "Income"`

### 3. Santander Nómina (Debit / Checking Account)
- **Target Section**: `Detalle de movimientos cuenta de cheques`
- **Column Mapping**:
  - `RETIRO` -> Set `Type = "Bill"`
  - `DEPOSITO` -> Set `Type = "Income"`

---

## 🧠 Database Schema & Model Rules (`src/model/`)

1. **`Category` (`src/model/Category.js`)**:
   - Schema: `name`, `icon`, `color`, `isDefaultCatego`, `user`, `wallet`, `accounts`
2. **`SubCategory` (`src/model/SubCategory.js`)**:
   - Schema: `name`, `icon`, `color`, `isDefaultSubCatego`, `user`, `wallet`, `fatherCategory`
3. **Category Auto-Resolution Rule**:
   - When uploading via `/api/general-data/files/upload/[id]/route.js`, if `SubCategory` is provided, the API automatically resolves `fatherCategory` from MongoDB.
   - Therefore, prefer populating **`SubCategory`** over `Category` when a specific subcategory matches.

---

## 🤖 Local Model Offloading Architecture (Ollama)

For batch extractions or heavy text processing, frontier models (Gemini, Claude, GPT-4o) SHOULD offload repetitive tasks to the local Ollama instance running on `http://localhost:11434`.
See [`LOCAL_AI_MODELS_GUIDE.md`](file:///Users/luisjairvazqueznavarrete/Coding%20Proyects/Gastify/.mds/LOCAL_AI_MODELS_GUIDE.md) for full endpoint specs and model roles:
- `bge-m3:latest`: Semantic vector embeddings for transaction matching.

---

## 🛠️ Mandatory OCR & PDF Table Extraction Pipeline (PaddleOCR PP-StructureV2)

### 1. The Financial Symbol-to-Digit Hallucination Problem (Why generic OCR fails)
- **NEVER use generic character-level OCR** (such as standard Apple macOS `Vision.framework / VNRecognizeTextRequest` or unconstrained Tesseract) for extracting numerical transactions from scanned bank statements (HSBC 2Now, Santander Crédito, Santander Nómina).
- **Reason**: General-purpose OCR engines lack table structure and accounting layout awareness. In July 2026, an Apple Vision OCR extraction bug misread `+$ 225.00` as `+18225.00` because the engine interpreted the `+$` currency symbol as the digits `18`.

### 2. Mandatory Local OCR Engine: PaddleOCR (`PP-StructureV2` / `PP-OCRv4`)
- All AI assistants on this project MUST use **PaddleOCR (`PP-StructureV2`)** in Python for scanned PDF table and statement extraction.
- **Why PaddleOCR?**:
  - Achieves **95.89% TEDS (Tree Edit Distance Similarity)** accuracy on official table structure benchmarks (`PubTabNet` / `FinTabNet`).
  - Its Table Structure Recognition module (`SLANet`) separates `Amount` from `Concept` columns and prevents currency symbols (`$`, `+$`, `-$`) from being misread as numerical digits.
  - **Local & Free**: Runs 100% offline on macOS (`paddleocr` and `paddlepaddle` are installed locally; total model weights ~35 MB).
- **Usage Pattern in Scripts**:
  ```python
  from paddleocr import PPStructure, save_structure_res
  table_engine = PPStructure(show_log=False, recovery=True)
  # Process rendered PDF page image and parse structured table rows without symbol hallucinations
  ```

### 3. Vercel Serverless Deployment Architecture Note
- **DO NOT bundle `paddlepaddle` or `paddleocr` into Vercel Serverless API Routes (`src/app/api/...`)**.
  - **Reason**: Vercel Serverless Functions (AWS Lambda) enforce a strict **250 MB compressed / 500 MB uncompressed** bundle size limit. The PaddleOCR + OpenCV runtime footprint (~500 MB uncompressed) will exceed serverless deployment limits and cause build failures.
- **Production Architectural Options for Live App PDF Extraction**:
  - **Option A (Local / Administrative Scripting)**: Use local PaddleOCR scripts on macOS for database administration, periodic reconciliation, and batch Excel template generation.
  - **Option B (Python Microservice / Container)**: If Gastify requires end-user statement uploads in the web app, host a Python Docker microservice running PaddleOCR on Render, Railway, or Google Cloud Run, and call it via REST API from Vercel (`POST /api/extract-statement`).
  - **Option C (Managed Cloud Document AI in Vercel)**: For serverless-native OCR inside Vercel without a container microservice, integrate lightweight cloud SDKs such as **Azure AI Document Intelligence** (F0 Free Tier: 500 pages/month) or **LlamaParse** (1,000 pages/day free), which offload OCR computation to managed cloud APIs.

