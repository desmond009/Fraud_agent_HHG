# Autonomous Financial Crime Intelligence: Building an Agentic Fraud Investigation System with TigerGraph & LangGraph

> **Submission for the TigerGraph Agentic Fraud Investigation Hackathon (HHGOA)**  
> **Demo Video:** [Watch 3-5 Min Walkthrough](https://drive.google.com/file/d/1jREhAQDp34CtNJT9baw-p4BQKHw_Cwz5/view?usp=sharing)  
> **GitHub Repository:** [https://github.com/desmond009/Fraud_agent_HHG](https://github.com/desmond009/Fraud_agent_HHG)  
> **Benchmark Dataset:** IEEE-CIS Financial Crime Dataset (590k+ Transactions, 13.5k Entities, 5.5k Historical Closed Cases)  
> **Evaluation:** 20 / 20 Benchmark Cases Validated (100% Policy Schema Compliance)  

---

## 1. What We Built

Financial crime investigation teams at tier-1 banks are under relentless pressure. Traditional rule engines and isolated machine learning models flag thousands of alerts daily, creating severe fatigue:
* **Fragmented Context**: Analysts must manually query disparate databases (transaction ledgers, device profiles, customer profiles, regulatory blacklists).
* **Uncertain Signals**: A transaction with an initial risk score of 0.65 may be an innocent cardholder traveling abroad, or the opening move of a distributed card-testing ring.
* **Slow Response Latency**: Gathering evidence across multiple systems often takes days, by which time funds have already been laundered.

To solve this, we built **FraudAgent** — an autonomous, policy-governed fraud investigation platform that combines **TigerGraph**, **TigerGraph MCP**, **LangGraph**, **ChromaDB GraphRAG**, and a **Palantir/Linear-inspired React 19 Workspace**.

Instead of treating fraud detection as a static point prediction, FraudAgent operates as a stateful, iterative investigation agent that:
1. **Ingests Alerts**: Automatically triggers from risk score anomalies, customer dispute reports, or analyst escalations.
2. **Traverses Knowledge Graphs**: Queries multi-hop relationship linkages across customers, cards, devices, and historical fraud rings using TigerGraph GSQL algorithms.
3. **Calibrates Uncertainty**: Evaluates fraud probability before and after evidence collection, computing explicit explanations of what changed.
4. **Enforces Policy Governance**: Maps findings against bank regulations (Rules R1–R10) with role-based sign-offs (`auto`, `L1 Lead`, `L2 Manager`).
5. **Generates Regulatory Deliverables**: Instantly drafts official FinCEN Suspicious Activity Reports (SARs) with full audit trails.
6. **Writes Back to Case Memory**: Persists investigation outcomes back into the graph, continuously training and expanding institutional memory.

---

## 2. System Architecture

FraudAgent is designed around an event-driven, microservices-ready architecture:

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           REACT 19 ANALYST WORKSPACE                           │
│  - Spring Force Graph Canvas      - Uncertainty Delta Visualizer               │
│  - Case Progression Timeline      - L1 / L2 Approval Sign-off Actions          │
│  - Interactive Evidence Dossier   - FinCEN SAR Regulatory Drawer               │
└───────────────────────────────────────┬────────────────────────────────────────┘
                                        │ REST / JSON (FastAPI Bridge)
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                       FASTAPI BACKEND & ORCHESTRATION                          │
│  - /api/cases, /api/graph, /api/audit-log, /api/model/predict, /api/model/train│
└──────────────────┬────────────────────┬────────────────────┬───────────────────┘
                   │                    │                    │
                   ▼                    ▼                    ▼
     ┌──────────────────────┐ ┌───────────────────┐ ┌──────────────────────┐
     │ 6-NODE LANGGRAPH     │ │ CHROMA VECTOR RAG │ │ ML INFERENCE PIPELINE│
     │ INVESTIGATION STATE  │ │ Policy Rules R1-10│ │ HistGradientBoosting │
     │ MACHINE              │ │ & FinCEN Typologies││ Checkpoint Persistent│
     └──────────┬───────────┘ └───────────────────┘ └──────────────────────┘
                │ Tool Calls via Model Context Protocol (MCP)
                ▼
┌────────────────────────────────────────────────────────────────────────────────┐
│                            TIGERGRAPH CLOUD / MCP                              │
│  • Graph Schema: Customer, Card, Transaction, DeviceProfile, ClosedCase        │
│  • GSQL Graph Algorithms: Multi-hop Ring Traversal, Temporal Velocity Windows  │
│  • Vector Graph Memory: Writeback of resolved cases for historical retrieval   │
└────────────────────────────────────────────────────────────────────────────────┘
```

### The 6-Node LangGraph State Machine
1. `trigger_ingestion`: Normalizes alert metadata (risk scores, customer reports, transaction details).
2. `initial_investigation`: Dispatches TigerGraph MCP queries to inspect account history, transaction windows, and multi-hop entity neighborhoods.
3. `evidence_synthesis`: Synthesizes graph evidence against bank policies retrieved via ChromaDB GraphRAG.
4. `uncertainty_assessment`: Measures signal confidence and computes initial fraud risk and initial Next-Best Action.
5. `evidence_simulation`: Gathers controlled additional evidence (e.g. simulated customer confirmation/denial or step-up authentication), recalculating calibrated probability.
6. `case_memory_writeback`: Commits resolved case records, SAR filings, and approval decisions into TigerGraph as new `ClosedCase` vertices.

---

## 3. How TigerGraph is Used

TigerGraph serves as the persistent nervous system of our platform:

### A. Graph Schema (`schema/schema.gsql`)
* **Vertices**:
  * `Customer`: Account owner metadata.
  * `Card`: Payment cards linked to accounts.
  * `Transaction`: Individual financial authorizations ($amount, $timestamp, risk score, channel).
  * `DeviceProfile`: MD5-hashed digital fingerprint (`DeviceInfo`, OS version, browser, screen resolution).
  * `EmailDomain` & `BillingRegion`: Contextual anchor points.
  * `ClosedCase`: Prior investigations serving as dynamic case memory.
* **Edges**:
  * `Customer -OWNS-> Card`
  * `Card -MADE-> Transaction`
  * `Transaction -FROM_DEVICE-> DeviceProfile`
  * `Transaction -PURCHASER_EMAIL-> EmailDomain`
  * `Transaction -BILLED_IN-> BillingRegion`
  * `Transaction -NEXT-> Transaction` (temporal sequence for card testing detection)
  * `ClosedCase -INVOLVES-> Transaction`
  * `ClosedCase -ON_CARD-> Card`
  * `Card -CONNECTED_TO-> Card` (device-sharing fraud rings)

### B. High-Performance GSQL Queries
* `get_card_transaction_window`: Computes rolling transaction frequency and amount velocity within 24 hours of an alert.
* `get_device_region_neighborhood`: Traverses multi-hop paths to uncover shared devices, shared billing addresses, and linked cards with prior fraud history.
* `match_historical_cases`: Fetches similar resolved cases by fraud typology and customer behavior.
* `write_case_memory`: Inserts a `ClosedCase` vertex and connects it to affected cards and transactions in real-time.

### C. TigerGraph MCP (Model Context Protocol) Bridge
Rather than feeding raw data into an LLM prompt, the agent invokes structured MCP tools:
* `tg_get_transaction(txn_id)`
* `tg_query_txn_window(card_id, timestamp, window_hours)`
* `tg_query_neighborhood(txn_id)`
* `tg_match_historical_cases(pattern, max_results)`
* `tg_write_case_memory(case_id, verdict, pattern, exposure, ...)`

---

## 4. Agentic Capabilities Implemented

### 1. Two-Stage Uncertainty Calibration
In high-stakes financial operations, models cannot act blindly on initial indicators. FraudAgent separates action recommendations into two distinct stages:
* **Initial Next-Best Action**: Formulated before requesting additional evidence (e.g., `VERIFY_WITH_CUSTOMER (auto)`, `STEP_UP_AUTH (auto)`).
* **Final Next-Best Action**: Formulated after additional evidence is received (e.g., customer confirms authorized activity $\rightarrow$ `CLOSE_NO_FRAUD (auto)`; customer denies activity $\rightarrow$ `BLOCK_CARD (L1)`, `FILE_REPORT (L2)`).
* **What Changed Explanation**: Generates plain-English rationale for why the confidence shifted (e.g., *"Customer denial confirmed unauthorized usage, raising fraud probability from 54% to 88%"*).

### 2. Policy-Governed Gating (L1 / L2 Approval Workflow)
Automated AI actions are bounded by strict banking regulations:
* `auto`: Autonomous execution (logging, monitoring, closing cleared alerts under Rule R3).
* `L1 (Lead Analyst)`: Sign-off for single card blocks ($\le \$2,500$) and authorization declines.
* `L2 (Fraud Manager)`: Sign-off for high-exposure freezes ($> \$2,500$), blocking all account cards, and external FinCEN SAR submissions.

### 3. Automated FinCEN Suspicious Activity Reports (SAR)
When exposure exceeds \$1,000 or organized fraud rings are detected, the agent drafts complete regulatory narratives answering *Who, What, When, Where, Why, and How*, ready for compliance export.

---

## 5. What We Learned

1. **Graph Traversal Disarms Fraud Rings**: Individual transactions often look completely harmless in isolation (e.g. a \$50 online purchase). However, traversing the TigerGraph neighborhood reveals that the device fingerprint has been used across 110 other cards with prior fraud convictions. Graph context is irreplaceable.
2. **GraphRAG Beats Raw Prompting**: Indexing policy rules into a vector store and retrieving relevant clauses based on agent findings ensures that actions strictly conform to bank procedures without hallucinated policies.
3. **Approval Gating Builds Trust**: Analysts reject "black-box" decisions. By splitting recommendations into explicit approval tiers (`auto`, `L1`, `L2`) with clear justifications, human teams remain in control while saving 90% of investigation time.

---

## 6. What We Would Improve With More Time

* **Real-time Streaming Graph Updates**: Ingesting Kafka transaction feeds directly into TigerGraph via continuous streaming loaders.
* **Graph Neural Network (GNN) Embeddings**: Incorporating TigerGraph Graph Convolutional Networks (GCN) to predict ring topologies before transactions even execute.
* **Voice-Interactive Analyst Copilot**: Adding a multimodal speech interface for analysts to interact with graph subgraphs in hands-free triage rooms.
* **Automated Clearing House (ACH) Inter-Bank Network**: Expanding graph traversals across participating institutional graphs using privacy-preserving federated graph analytics.

---

*Built with passion for the TigerGraph Agentic Fraud Investigation Hackathon.*
