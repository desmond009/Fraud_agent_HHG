# TigerGraph Agentic Fraud Investigation & Next-Best Action
## Comprehensive System & Frontend Architecture Specification

---

## 1. Executive Summary

This document specifies the end-to-end architecture of the **TigerGraph Agentic Fraud Investigation & Next-Best Action** platform, built for the **TigerGraph × Hacker House Goa** hackathon challenge.

The platform transforms raw detection model alerts and customer disputes on the **IEEE-CIS Fraud Dataset** (590,742 transactions, 13,553 customers/cards, 9,363 device profiles, and 5,565 historical closed cases) into an autonomous, explainable financial crime investigation workflow.

The user interface delivers a real-world financial fraud intelligence operations center (inspired by **Palantir Foundry**, **Linear**, and **Stripe Radar**), enabling fraud analysts to visualize complex transaction subgraphs, trace AI agent deliberations, inspect two-stage uncertainty transitions, execute policy-routed approvals (`auto`, `L1`, `L2`), and export FinCEN-compliant Suspicious Activity Reports (SAR).

---

## 2. High-Level Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FRONTEND APPLICATION (React 19 + TypeScript + Vite)      │
│                                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────────────────────────────────────┐  │
│  │     App Shell         │  │              Investigation Workspace                  │  │
│  │  • Collapsible Nav    │  │  • Case Header & Telemetry                            │  │
│  │  • Global Search      │  │  • Interactive TigerGraph Subgraph (Canvas/SVG)       │  │
│  │  • L1/L2 Role Switch  │  │  • Two-Stage Uncertainty Transition Gauge             │  │
│  │  • Live Database Ping │  │  • AI Deliberation Feed (6 LangGraph Stages)          │  │
│  └───────────────────────┘  │  • Next Best Action & Human Approval Sign-off         │  │
│                             │  • Standalone FinCEN SAR Regulatory Drawer            │  │
│  ┌───────────────────────┐  │  • 7-Pillar Evidence Dossier                          │  │
│  │   Operational Views   │  │  • Historical Case Memory & Chronological Timeline    │  │
│  │  • Command Center     │  └───────────────────────────────────────────────────────┘  │
│  │  • Case Repository    │                                                             │
│  │  • Txn Explorer       │  ┌───────────────────────────────────────────────────────┐  │
│  │  • Policy Catalog     │  │ Custom CSS Design System (Midnight Slate / Dark Ops)  │  │
│  │  • Audit Trail        │  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
                       REST / JSON Proxy   │   HTTP Port 5173 ──► Port 8000
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               FASTAPI BACKEND BRIDGE (`server/main.py`)                │
│                                                                                        │
│  • Case Dossier Service          • Subgraph Topology Formatter   • Policy Catalog API  │
│  • Human Approval Workflow       • Dynamic Agent Invocation      • Audit Trail Logger  │
│  • Paginated Transaction API     • System Health & Telemetry     • Fallback Engine     │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌──────────────────┐             ┌──────────────────┐             ┌──────────────────┐
│  LANGGRAPH AGENT │             │  TIGERGRAPH MCP  │             │   GRAPHRAG STORE │
│  (`agent/`)      │             │  BRIDGE (`mcp/`) │             │  (`graphrag/`)   │
│                  │             │                  │             │                  │
│  6-Node Pipeline:│             │  GSQL Queries:   │             │  ChromaDB:       │
│  1. Ingestion    │             │  • txn_window    │             │  • 10 Policy     │
│  2. Traversal    │             │  • neighborhood  │             │    Rules (R1-R10)│
│  3. Synthesis    │             │  • case_matcher  │             │  • 5 Typologies  │
│  4. Uncertainty  │             │  • vertex CRUD   │             │  • FinCEN SAR    │
│  5. Simulation   │             │  • writeback     │             │    Standards     │
│  6. Writeback    │             └──────────────────┘             └──────────────────┘
└──────────────────┘                       │                                │
         │                                 ▼                                │
         │                       ┌──────────────────┐                       │
         │                       │ TIGERGRAPH CLOUD │                       │
         │                       │ (`FraudGraph`)   │                       │
         │                       │                  │                       │
         │                       │ 590K Txns        │                       │
         │                       │ 13.5K Cards/Cust │                       │
         │                       │ 9.3K Devices     │                       │
         │                       │ 5.5K Closed Cases│                       │
         │                       └──────────────────┘                       │
         ▼                                                                  ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        GEMINI 3.6 FLASH LLM (`agent/llm.py`)                           │
│  • FinCEN Regulatory SAR Narrative Generator (Who, What, When, Where, How, Why)        │
│  • Concise High-Precision Case Summaries                                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. End-to-End Investigation Lifecycle

The application models the lifecycle of a high-consequence financial crime alert:

```
[1. Trigger Ingestion]
    │  • Model Risk Score Alert (e.g. score > 0.70)
    │  • Customer Dispute Message (e.g. "I never made this $482 purchase")
    │  • Analyst Inquiry (e.g. "Unusual device profile shared across cards")
    ▼
[2. TigerGraph MCP Traversal]
    │  • Call `query_txn_window`: Micro-authorizations (<$5), total exposure, 24h velocity
    │  • Call `query_neighborhood`: Find shared devices, linked cards, and prior fraud cases
    ▼
[3. Evidence Synthesis & GraphRAG Retrieval]
    │  • Match typology: Card Testing, Card-Not-Present (CNP), Out of Region, Account Takeover
    │  • Retrieve policy rules from ChromaDB vector store (e.g. Rules R1, R2, R5, R6)
    │  • Query historical case memory via GSQL `historical_case_matcher`
    ▼
[4. Uncertainty Assessment & Calibration]
    │  • Compute initial fraud probability (e.g. 0.54)
    │  • Check Policy Rule R1: If single weak signal and prob < 0.70, guard against blocking
    │  • Recommend initial exploratory actions: `VERIFY_WITH_CUSTOMER`, `STEP_UP_AUTH`
    ▼
[5. Evidence Simulation & Next Best Action]
    │  • Evaluate simulated response (Customer denial vs confirmation)
    │  • Update calibrated probability (e.g. rises from 54% to 88%)
    │  • Formulate final actions: `BLOCK_CARD`, `CREATE_CASE`, `FILE_REPORT`, `MONITOR_CONNECTED_CARDS`
    │  • Invoke Gemini 3.6 Flash for FinCEN SAR Narrative if exposure > $1,000 or ring detected
    ▼
[6. Human-in-the-Loop Sign-off & Policy Routing]
    │  • `auto`: Automatically executed by agent (monitoring, logging)
    │  • `L1`: Team Lead sign-off (`DECLINE_TRANSACTION`, `BLOCK_CARD` ≤ $2,500)
    │  • `L2`: Fraud Manager sign-off (`BLOCK_CARD` > $2,500, `BLOCK_ALL_CARDS`, `FILE_REPORT`)
    ▼
[7. Case Memory Writeback to TigerGraph]
    │  • Write new `ClosedCase` vertex (e.g. `CASE-HHG-005`) into TigerGraph
    │  • Upsert `ON_CARD` and `INVOLVES` edges so future investigations retrieve this case
```

---

## 4. Backend Architecture & API Contracts

The backend service is located in `server/main.py`, powered by **FastAPI** and **Uvicorn**.

### Key Endpoints

#### 1. System Health & Database Telemetry
* **Route:** `GET /api/health`
* **Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-09-23T23:31:18.119932",
  "tigergraph": {
    "connected": true,
    "details": { "graph": "FraudGraph", "status": "online" },
    "vertices_loaded": {
      "Customer": { "count": 13553 },
      "Card": { "count": 13553 },
      "Transaction": { "count": 590742 },
      "DeviceProfile": { "count": 9363 },
      "ClosedCase": { "count": 5565 }
    },
    "edges_loaded": {
      "OWNS": { "count": 13510 },
      "MADE": { "count": 590742 },
      "FROM_DEVICE": { "count": 118852 }
    }
  },
  "total_cases_available": 20
}
```

#### 2. Triage Queue / Cases Summary
* **Route:** `GET /api/cases`
* **Response:** Array of case summary objects including trigger source, verdict, fraud probability, pattern, exposure in USD, SAR status, tool calls count, and initial/final next-best-actions.

#### 3. Full Case Dossier
* **Route:** `GET /api/cases/{case_id}`
* **Response:** The exact hackathon deliverable JSON (`case`, `evidence_requests`, `next_best_actions`, `sar`, `stop_reason`, `tool_calls`, `latency_s`) merged with raw trigger metadata from `case_pack.csv` and approval records.

#### 4. Subgraph Extraction
* **Route:** `GET /api/cases/{case_id}/subgraph`
* **Response:** Resolves TigerGraph entities into node-link format for the canvas renderer:
```json
{
  "case_id": "HHG-005",
  "nodes": [
    { "id": "C02923", "type": "Customer", "label": "Customer C02923" },
    { "id": "C02923-K1", "type": "Card", "label": "Card C02923-K1", "attributes": { "status": "blocked" } },
    { "id": "3523199", "type": "Transaction", "label": "Txn #3523199", "attributes": { "amount": 100.07, "is_flagged": true } },
    { "id": "5b64ce5e4c42", "type": "DeviceProfile", "label": "Device: 5b64ce5e", "attributes": { "is_suspicious": true } },
    { "id": "C10948-K1", "type": "Card", "label": "Linked Card: C10948-K1", "attributes": { "is_ring": true } },
    { "id": "CC-4785", "type": "ClosedCase", "label": "Prior Case: CC-4785" }
  ],
  "edges": [
    { "id": "C02923-OWNS-C02923-K1", "source": "C02923", "target": "C02923-K1", "type": "OWNS" },
    { "id": "C02923-K1-MADE-3523199", "source": "C02923-K1", "target": "3523199", "type": "MADE" },
    { "id": "3523199-FROM_DEVICE-5b64ce5e4c42", "source": "3523199", "target": "5b64ce5e4c42", "type": "FROM_DEVICE" },
    { "id": "C10948-K1-SHARED_DEVICE-5b64ce5e4c42", "source": "C10948-K1", "target": "5b64ce5e4c42", "type": "SHARED_DEVICE" }
  ]
}
```

#### 5. Human-in-the-Loop Analyst Action
* **Route:** `POST /api/cases/{case_id}/action`
* **Payload:**
```json
{
  "decision": "approve",
  "action_name": "BLOCK_CARD",
  "route": "L1",
  "analyst_name": "Sarah Lin",
  "analyst_role": "L1 Team Lead",
  "notes": "Confirmed ring abuse across 111 cards."
}
```

#### 6. Dynamic Agent Re-execution
* **Route:** `POST /api/cases/{case_id}/run`
* **Response:** Invokes the LangGraph pipeline, records latency, updates case JSON deliverables on disk, and logs the execution event to `outputs/audit_log.json`.

---

## 5. Frontend Architecture & Component Hierarchy

The frontend is built with **React 19, TypeScript, and Vite**, organized as follows:

```text
frontend/src/
├── api/
│   └── client.ts                    # Strongly typed API client methods
├── types/
│   └── index.ts                     # Strict TypeScript interfaces matching backend models
├── styles/
│   └── design-system.css            # Dark-mode financial operations tokens & utility classes
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx             # Master shell wrapper
│   │   ├── Sidebar.tsx              # Collapsible navigation, counts, & DB status
│   │   └── TopBar.tsx               # Header, case switcher, search, & L1/L2 clearance toggle
│   ├── workspace/                   # Flagship Investigation Workspace
│   │   ├── InvestigationWorkspace.tsx # Master 3-column layout
│   │   ├── CaseHeader.tsx           # Case metadata, verdict, exposure USD, & latency
│   │   ├── GraphExplorer.tsx        # Force-directed interactive canvas & inspector drawer
│   │   ├── AgentActivityFeed.tsx    # LangGraph 6-stage deliberative checklist & findings
│   │   ├── UncertaintyGauge.tsx     # Two-stage probability transition & catalyst
│   │   ├── EvidencePanel.tsx        # Categorized evidence dossier (Graph, Model, Customer)
│   │   ├── NextBestActionCard.tsx   # Recommended action with L1/L2 human approval sign-off
│   │   ├── SARDrawer.tsx            # FinCEN Suspicious Activity Report viewer & JSON export
│   │   ├── CaseMemoryCard.tsx       # Retrieved historical closed cases (e.g. CC-4785)
│   │   └── InvestigationTimeline.tsx# Chronological event sequence
│   └── pages/                       # Operational Views
│       ├── CommandCenter.tsx        # Executive triage queue and KPIs
│       ├── CaseManagement.tsx       # Exam case repository (20 benchmark cases)
│       ├── TransactionExplorer.tsx  # Paginated transaction viewer with risk score indicators
│       ├── PoliciesView.tsx         # Interactive catalog of Fraud Policy rules R1-R10
│       └── AuditLogView.tsx         # Immutable audit trail of agent operations & approvals
└── App.tsx                          # Root component managing state, routing, and notifications
```

---

## 6. Flagship UI Components Deep-Dive

### 1. Interactive TigerGraph Subgraph (`GraphExplorer.tsx`)
* **Custom SVG Canvas Layout:** Physics-inspired spring-embedded positioning separating Customers (inner), Cards (primary & ring), Transactions, Devices, and Case Memory nodes.
* **Direct Manipulation:** Drag canvas to pan, mouse wheel to zoom (0.4x to 2.5x), drag individual vertices to re-orient clusters.
* **Visual Hierarchy:**
  - **Blue:** Customer vertices.
  - **Sky Blue:** Primary card vertices.
  - **Amber / Dashed:** Linked cross-card ring entities.
  - **Crimson / Glowing:** Flagged transactions.
  - **Pink:** Suspicious device profiles.
  - **Purple:** Retrieved historical case memory.
* **Entity Inspector Drawer:** Clicking any vertex opens an inspection drawer showing live TigerGraph attributes (amounts, timestamps, device fingerprints, card networks) and outbound/inbound relationships.

### 2. Two-Stage Uncertainty Transition Gauge (`UncertaintyGauge.tsx`)
* Clearly communicates the agent's probability calibration before and after gathering additional evidence.
* Visually demonstrates compliance with **Rule R1**: If assessed probability on a single weak signal is below 0.70, customer verification or step-up authentication is triggered before any punitive blocking action.
* Highlights the exact **Catalyst / What Changed** (e.g., customer denial raising probability from 54% to 88%).

### 3. Next Best Action & Human Approval Sign-off (`NextBestActionCard.tsx`)
* Action recommendations strictly comply with Fraud Policy identifiers: `ALLOW_TRANSACTION`, `DECLINE_TRANSACTION`, `BLOCK_CARD`, `BLOCK_ALL_CARDS`, `MONITOR_CARD`, `MONITOR_CONNECTED_CARDS`, `WARN_CUSTOMER`, `VERIFY_WITH_CUSTOMER`, `STEP_UP_AUTH`, `CREATE_CASE`, `FILE_REPORT`, `CLOSE_NO_FRAUD`.
* **Clearance Gating:** Displays routing badges (`auto`, `L1`, `L2`). If an analyst role lacks clearance (e.g. `L1 Team Lead` attempting to approve an `L2` action like `BLOCK_ALL_CARDS` or `FILE_REPORT`), the UI enforces policy requirements and disables sign-off until the user assumes the required role.

### 4. Standalone FinCEN SAR Drawer (`SARDrawer.tsx`)
* Formatted strictly to US Treasury FinCEN SAR Narrative standards.
* Displays the complete 6–8 sentence narrative answering **Who, What, When, Where, How, and Why suspicious**.
* Details named subjects, total exposure USD, date range, copy-to-clipboard, and JSON export.

---

## 7. Design System Specifications

The visual identity is defined in `frontend/src/styles/design-system.css`:

| Token | Value | Semantic Role |
| :--- | :--- | :--- |
| `--bg-app` | `#06090f` | Deep obsidian background |
| `--bg-card` | `#0d1524` | Primary card panels |
| `--bg-card-elevated` | `#111b2e` | Top-tier workspace containers & headers |
| `--border-default` | `#1e2c45` | Structural dividers & component borders |
| `--brand-tiger` | `#0ea5e9` | TigerGraph brand accent & primary actions |
| `--risk-high` | `#ef4444` | Confirmed fraud & critical risk alerts |
| `--risk-medium` | `#f59e0b` | Amber warnings, pending verification, L1 route |
| `--risk-low` | `#10b981` | Cleared legitimate alerts, approved status |
| `--route-l2` | `#8b5cf6` | Violet badge for L2 Fraud Manager clearance & SARs |
| `--font-mono` | `JetBrains Mono, monospace` | Transaction IDs, card numbers, amounts, dates |

---

## 8. Development & Quickstart Guide

### Prerequisites
- Node.js ≥ v18 (v24 recommended)
- Python ≥ 3.10 (3.13 recommended)

### Running Locally

```bash
# 1. Start the FastAPI Backend Bridge
cd /Users/vijender/Downloads/FraudAgent
python3 -m uvicorn server.main:app --host 127.0.0.1 --port 8000

# 2. In a separate terminal, start the Frontend Dev Server
cd /Users/vijender/Downloads/FraudAgent/frontend
npm run dev
```

* **Frontend UI:** Open [http://localhost:5173](http://localhost:5173) in your browser.
* **Backend API Docs:** Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) for Swagger UI.

### Production Build Validation

```bash
cd /Users/vijender/Downloads/FraudAgent/frontend
npm run build
```
*(Builds a clean, minified production bundle in `dist/assets/` in under 400ms with 0 errors).*
