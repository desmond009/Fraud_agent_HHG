# TigerGraph Agentic Fraud Investigation & Next-Best Action
### Enterprise Financial Crime Intelligence Platform (IEEE-CIS Edition)

[![TigerGraph](https://img.shields.io/badge/TigerGraph-Savanna%20Cloud-0284c7?style=flat-square&logo=database)](https://www.tigergraph.com)
[![LangGraph](https://img.shields.io/badge/Agent-LangGraph%206--Node-8b5cf6?style=flat-square)](https://langchain.com)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite-06b6d4?style=flat-square)](http://localhost:5173)
[![API](https://img.shields.io/badge/Backend-FastAPI%20REST-10b981?style=flat-square)](http://127.0.0.1:8000)
[![Compliance](https://img.shields.io/badge/Regulatory-FinCEN%20SAR%20Compliant-ef4444?style=flat-square)](https://www.fincen.gov)

> **Quick Access:**
> - 🖥️ **Live Analyst Workspace:** [http://localhost:5173](http://localhost:5173)
> - ⚙️ **Backend API & Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
> - 📖 **Comprehensive Architecture Guide:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## 1. Overview

This platform is an enterprise-grade financial fraud investigation workspace built for the **TigerGraph × Hacker House Goa** hackathon. It evaluates six months of card transactions from the **IEEE-CIS Fraud Dataset** (published by Vesta Corporation), featuring:

* **590,742 transactions** with risk scores from the bank's machine learning model
* **13,553 customers and cards** with cross-account linkages
* **9,363 device fingerprints** and connection profiles
* **5,565 closed historical cases** forming the base case memory
* **20 exam benchmark alerts** from November–December 2016

The system combines **TigerGraph's high-speed graph traversal (MCP)**, **ChromaDB GraphRAG policy retrieval**, **Google Gemini 3.6 Flash**, and a **Palantir/Linear-inspired dark-mode frontend** to provide fraud analysts with an end-to-end investigative workspace.

---

## 2. Core Capabilities

### 🔍 Interactive TigerGraph Subgraph Explorer
* Visualizes real multi-hop entity relationships: `Customer` ➔ `Card` ➔ `Transaction` ➔ `DeviceProfile` ➔ `ClosedCase`.
* Spring-embedded interactive force-directed canvas with pan, zoom, node selection, and entity inspection drawer.
* Highlights device-sharing rings (e.g. 111 cards sharing device `5b64ce5e4c42`) and suspicious velocity bursts.

### 🤖 6-Stage Autonomous LangGraph Pipeline
1. **Trigger Ingestion:** Ingests alerts from model risk scores, customer disputes, or analyst inquiries.
2. **Graph Traversal (MCP):** Executes `txn_window` (24h velocity, micro-authorizations) and `device_region_neighborhood` (rings and prior fraud).
3. **Evidence Synthesis:** Synthesizes graph patterns, retrieves applicable policy rules from ChromaDB GraphRAG, and searches closed case memory.
4. **Uncertainty Assessment:** Calibrates baseline fraud probability and enforces Rule R1 (guard against blocking legitimate customers on a single weak signal).
5. **Evidence Simulation:** Simulates customer verification and formulates final next-best actions.
6. **Case Memory Writeback:** Upserts new `ClosedCase` vertices and graph edges back into TigerGraph.

### ⚖️ Uncertainty & Probability Transition
* Displays pre-check initial probability (e.g., 54%) vs post-evidence calibrated probability (e.g., 88%).
* Details the exact **"What Changed / Catalyst"** behind every verdict change.

### 🛡️ Policy-Governed Human Approvals
* Categorizes actions into strict routing tiers:
  * `auto`: Agent auto-executes (monitoring, logging, case creation).
  * `L1`: Team Lead sign-off required (`DECLINE_TRANSACTION`, `BLOCK_CARD` ≤ $2,500).
  * `L2`: Fraud Manager sign-off required (`BLOCK_CARD` > $2,500, `BLOCK_ALL_CARDS`, `FILE_REPORT`).
* Role switcher allows toggling between L1 and L2 clearance to verify approval gating.

### 📜 Automated FinCEN SAR Filing
* Drafts standalone Suspicious Activity Reports complying with US Treasury FinCEN standards.
* Complete narrative answering **Who, What, When, Where, How, and Why suspicious**, accompanied by named subjects, total exposure, and one-click JSON export.

---

## 3. Quickstart

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10

### 1. Start the Backend API Bridge
```bash
python3 -m uvicorn server.main:app --host 127.0.0.1 --port 8000
```

### 2. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 4. Benchmark Performance (20 Exam Cases)

The agent was evaluated against all 20 exam benchmark alerts (`case_pack.csv`):

| Metric | Result |
| :--- | :--- |
| **Total Cases Benchmarked** | 20 / 20 (100%) |
| **Confirmed Fraud Cases** | 15 cases |
| **Cleared False Alarms (Legitimate)** | 5 cases (cleared under Rule R3) |
| **FinCEN SAR Reports Filed** | 11 cases |
| **Total Fraud Exposure Identified** | **$12,185.39 USD** |
| **Average Investigation Latency** | **1.16s / case** |
| **Total Graph Tool Calls** | 120 calls (avg 6 / case) |
| **TigerGraph Memory Writebacks** | 20 / 20 verified |

All deliverable files are saved in [`cases/HHG-001.json`](cases/HHG-001.json) through [`cases/HHG-020.json`](cases/HHG-020.json).

---

## 5. Fraud Policy (Rules R1 – R10)

The agent operates strictly under the hackathon's Version 1.0 Fraud Policy:

| Rule | Title | Routing | What It Mandates |
| :--- | :--- | :--- | :--- |
| **R1** | Weak Signal Guard | `auto` | If single signal and probability < 0.70, verify with customer before any block. |
| **R2** | Customer Denial | `L1 / L2` | Customer denies charge: recommend `BLOCK_CARD` and `CREATE_CASE`. Add `FILE_REPORT` if > $1,000 or ring detected. |
| **R3** | Customer Confirmation | `auto` | Customer confirms charge: recommend `CLOSE_NO_FRAUD` with no customer impact. |
| **R4** | No Reply in 24h | `auto / L1` | Recommend `MONITOR_CARD` and `DECLINE_TRANSACTION` for pending authorizations. |
| **R5** | Card Testing | `L1 / auto` | 3+ micro-authorizations (< $5) followed by larger purchase: decline and step-up auth. |
| **R6** | Shared Origin / Ring | `auto / L2` | Devices/regions shared across cards: recommend `CREATE_CASE`, `FILE_REPORT`, and `MONITOR_CONNECTED_CARDS`. |
| **R7** | Disputed Recurring | `auto` | Disputed charge matching monthly recurring history: verify and warn, do not block. |
| **R8** | Uncertain Exposure | `auto` | Uncertain verdict with exposure > $500: recommend `ESCALATE_TO_ANALYST`. |
| **R9** | Undocumented Pattern| `auto / L2` | Novel coordinated abuse: describe pattern, file SAR, and escalate. |
| **R10**| Block All Cards | `L2` | Never block all cards unless at least 2 cards show confirmed fraud or compromise. |

---

## 6. Repository Layout

```text
FraudAgent/
├── frontend/                    # React 19 + TypeScript + Vite Application
│   ├── src/components/workspace/# Flagship Investigation Workspace (Graph, SAR, NBA)
│   ├── src/components/pages/    # Command Center, Case Repo, Txn Explorer, Policies
│   ├── src/styles/              # Financial ops dark-mode design system
│   └── src/api/                 # Typed API client
├── server/                      # FastAPI Backend Bridge
│   └── main.py                  # Endpoints for cases, subgraphs, approvals, and agent
├── agent/                       # LangGraph Multi-Node Pipeline
│   ├── graph.py                 # StateGraph builder and compiled pipeline
│   ├── nodes.py                 # 6 investigation stages
│   ├── state.py                 # TypedDict InvestigationState schema
│   └── llm.py                   # FinCEN SAR narrative generation via Gemini
├── mcp/                         # TigerGraph MCP Bridge
│   └── tigergraph_mcp.py        # GSQL queries (txn_window, neighborhood, case matcher)
├── graphrag/                    # Knowledge Retrieval
│   └── vector_indexer.py        # ChromaDB index for policy rules & regulations
├── cases/                       # 20 Evaluated Case Deliverable JSONs (HHG-001 to HHG-020)
├── data/                        # Datasets (case_pack.csv, closed_cases, transactions)
├── schema/                      # TigerGraph schema.gsql & setup script
├── gsql/                        # GSQL queries (queries.gsql)
├── docs/                        # Complete technical documentation
│   └── ARCHITECTURE.md          # In-depth system & visual design architecture
└── config.py                    # TigerGraph connection and environment configuration
```

---

## 7. Recommended 3-Minute Demo Flow

1. **Command Center:** Open [http://localhost:5173](http://localhost:5173) to view the 20-case triage queue and portfolio metrics ($12,185.39 prevented).
2. **Confirmed Fraud Investigation:** Select **Case HHG-005** (Card Not Present New Device):
   - Inspect the **TigerGraph Subgraph** showing 111 linked cards and shared device `5b64ce5e4c42`.
   - Click a node to open the **Entity Inspector Drawer**.
   - Note the **Uncertainty Gauge** rising from 54% to 88% following customer denial.
   - Review the **Next Best Action** recommending `BLOCK_CARD (L1)` and `FILE_REPORT (L2)`.
   - Click **FinCEN SAR Ready** to review and export the official Suspicious Activity Report narrative.
   - Switch role to `L2 Manager` in the top bar and click **Approve & Execute** to demonstrate human-in-the-loop sign-off.
3. **Cleared False Alarm:** Switch to **Case HHG-001** to show a cleared legitimate alert under Policy Rule R3 (exposure $0.00, no card block).
