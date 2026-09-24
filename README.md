# TigerGraph Agentic Fraud Investigation & Next-Best Action
> **Demo Video:** [Watch 3-5 Min Walkthrough](https://drive.google.com/file/d/1jREhAQDp34CtNJT9baw-p4BQKHw_Cwz5/view?usp=sharing)  
> **Repository:** [https://github.com/desmond009/Fraud_agent_HHG](https://github.com/desmond009/Fraud_agent_HHG)  
> **Benchmark Cases:** 20/20 Official Benchmark Cases Evaluated in [`cases/`](cases/)

An autonomous fraud investigation system and analyst workbench combining **TigerGraph (MCP)**, **LangGraph (6-node agent)**, **ChromaDB GraphRAG**, and a **Palantir/Linear-inspired React 19 UI**.

---

## 🎥 3-Minute Demo Video

▶️ **Watch the End-to-End System Walkthrough:**  
[Google Drive Demo Video Link](https://drive.google.com/file/d/1jREhAQDp34CtNJT9baw-p4BQKHw_Cwz5/view?usp=sharing)

---

## ⚡ End-to-End Quick Start & Execution Guide

### Prerequisites
* Python 3.10+
* Node.js 18+ and `npm`

### Step 1: Clone Repository & Setup Virtual Environment
```bash
git clone https://github.com/desmond009/Fraud_agent_HHG.git
cd Fraud_agent_HHG

# Create and activate python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

### Step 2: Run End-to-End Benchmark & Verification Tests
Verify all 20 benchmark case evaluations, ML training pipelines, and policy rules:
```bash
# 1. Verify Phase 4 Benchmark Delivery (all 20 cases in cases/)
python3 test_phase4.py

# 2. Verify ML Model Training & Inference Pipeline (11 unit tests)
python3 test_phase5_model_pipeline.py
# or via pytest:
pytest tests/test_model_pipeline.py -v

# 3. Optional: Run full benchmark runner across all 20 cases
python3 run_benchmark.py
```

### Step 3: Launch Backend Server (FastAPI)
```bash
# Start backend API on port 8000
python3 -m uvicorn server.main:app --host 127.0.0.1 --port 8000 --reload
```
* **API Swagger Documentation:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
* **Health Check & Cases Endpoint:** [http://127.0.0.1:8000/api/cases](http://127.0.0.1:8000/api/cases)

### Step 4: Launch Frontend Analyst Workbench (React 19 + Vite)
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
* **Analyst Workbench URL:** [http://localhost:5173](http://localhost:5173)
* **Frontend Production Build Check:** `npm run build` (0 warnings, 0 errors)

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
