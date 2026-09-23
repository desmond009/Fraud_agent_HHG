# TigerGraph Agentic Fraud Investigation & Next-Best Action
> **Enterprise Financial Crime Intelligence Platform** · IEEE-CIS Fraud Benchmark (590k+ Transactions)

An autonomous fraud investigation system and analyst workbench combining **TigerGraph (MCP)**, **LangGraph (6-node agent)**, **ChromaDB GraphRAG**, and a **Palantir/Linear-inspired React 19 UI**.

---

## ⚡ Quick Start

### 1. Backend API Bridge
```bash
# From repository root
python3 -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```

### 2. Frontend Workspace
```bash
cd frontend
npm install
npm run dev
```

* **Live Analyst Workspace:** [http://localhost:5173](http://localhost:5173)
* **API Documentation & Swagger:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Deep Architecture Guide:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 🎯 Key Capabilities

- **Interactive TigerGraph Subgraph:** Spring-embedded force-directed canvas displaying multi-hop entity linkages (`Customer` ➔ `Card` ➔ `Transaction` ➔ `DeviceProfile` ➔ `ClosedCase`), device-sharing fraud rings, and node inspection.
- **6-Node LangGraph Pipeline:** Automated trigger ingestion, graph traversal via MCP tools, GraphRAG policy checks, uncertainty assessment, evidence simulation, and TigerGraph memory writeback.
- **Two-Stage Uncertainty Calibration:** Compares pre-evidence initial fraud risk vs. post-simulation calibrated probability with an exact explanation of what changed.
- **Policy-Governed Gating (L1 / L2):** Role-based human approval workflows enforcing strict banking policy (Rule R1–R10):
  - `auto`: Autonomous monitoring & audit logging
  - `L1`: Team Lead sign-off (`DECLINE_TRANSACTION`, `BLOCK_CARD` ≤ $2,500)
  - `L2`: Fraud Manager sign-off (`BLOCK_CARD` > $2,500, `BLOCK_ALL_CARDS`, `FILE_REPORT`)
- **Automated FinCEN SAR Generation:** Instant drafting and JSON export of official Suspicious Activity Reports (narratives answering *Who, What, When, Where, Why, and How*).

---

## 📊 Benchmark Results (20 Exam Cases)

Evaluated across the 20 official benchmark alert cases (`case_pack.csv`):

| Metric | Result |
| :--- | :--- |
| **Cases Benchmarked** | 20 / 20 (100%) |
| **Confirmed Fraud** | 15 cases |
| **False Alarms Cleared** | 5 cases (cleared under Rule R3, 0 customer disruption) |
| **FinCEN SARs Drafted** | 11 cases |
| **Fraud Exposure Prevented** | **$12,185.39 USD** |
| **Avg Investigation Latency** | **1.16s / case** |
| **TigerGraph Memory Writeback** | 20 / 20 verified |

*Detailed per-case results are stored in [`cases/HHG-001.json`](cases/HHG-001.json) through [`cases/HHG-020.json`](cases/HHG-020.json).*

---

## 🎬 Recommended Demo Flow

1. **Case HHG-005 (Coordinated Fraud Ring):**
   - Open [http://localhost:5173](http://localhost:5173) and select `HHG-005`.
   - Inspect the graph showing device `5b64ce5e4c42` shared across 111 cards.
   - Observe uncertainty calibrate from **54% ➔ 88%** after customer denial.
   - Review recommended actions: `BLOCK_CARD (L1)` and `FILE_REPORT (L2)`.
   - Open **FinCEN SAR Ready** drawer to inspect the compliance narrative.
   - Switch role to `L2 Manager` in the top bar to approve the action.
2. **Case HHG-001 (False Alarm Cleared):**
   - Select `HHG-001`.
   - Notice the system safely clears the alert under Rule R3 (Customer Confirmed), protecting revenue without blocking legitimate accounts.

---

## 📁 Repository Structure

```text
├── frontend/             # React 19 + TypeScript + Vite Analyst Workspace
│   ├── src/components/   # Workbench (Graph Canvas, SAR Drawer, Next-Best Action)
│   └── src/styles/       # Dark-mode financial intelligence design system
├── server/               # FastAPI REST API bridge
├── agent/                # LangGraph 6-node investigation state machine
├── mcp/                  # TigerGraph MCP tool definitions & GSQL queries
├── graphrag/             # ChromaDB vector index for policy rules & regulations
├── cases/                # 20 benchmark case evaluation JSONs (HHG-001 to HHG-020)
├── schema/               # TigerGraph schema.gsql
└── docs/                 # System architecture and technical documentation
```
