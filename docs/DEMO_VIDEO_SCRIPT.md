# 3–5 Minute Demo Video Script & Walkthrough Guide

> **Project:** FraudAgent — TigerGraph Agentic Fraud Investigation & Next-Best Action  
> **Target Duration:** 3:30 – 4:30 minutes  
> **Key Benchmark Cases to Demo:** `HHG-005` (Fraud Ring & SAR), `HHG-001` (False Alarm Cleared)  

---

## ⏱️ Video Timeline Overview

| Time | Segment | Focus & UI View |
| :--- | :--- | :--- |
| **0:00 – 0:45** | **Introduction & The Problem** | Title slide / Architecture diagram in `docs/ARCHITECTURE.md` |
| **0:45 – 2:00** | **Demo Case 1: HHG-005 (Coordinated Ring)** | Case selection `HHG-005`, Force Graph, Uncertainty Calibration, SAR Drawer |
| **2:00 – 3:00** | **Policy Gating & L1/L2 Approvals** | Role Switcher (`L1 Lead` ➔ `L2 Manager`), Approve Action, Audit Log |
| **3:00 – 3:45** | **Demo Case 2: HHG-001 (False Alarm Cleared)** | Case selection `HHG-001`, Rule R3 (Customer Confirmed), 0 Customer Friction |
| **3:45 – 4:15** | **TigerGraph Memory & Backend Pipeline** | MCP tool logs, terminal benchmark run, model inference |
| **4:15 – 4:30** | **Conclusion & Wrap-Up** | Architecture summary, GitHub repo link |

---

## 🎙️ Step-by-Step Script & Actions

### Segment 1: Introduction (0:00 – 0:45)
* **What to Show**: Show the live dashboard at [http://localhost:5173](http://localhost:5173) or the system architecture diagram.
* **Spoken Script**:
  > *"Hello! Welcome to our demonstration of FraudAgent, an autonomous, policy-governed fraud investigation platform built for the TigerGraph Agentic Fraud Investigation Hackathon.*  
  > *Financial fraud teams face a critical challenge: manual multi-hop investigations across thousands of transactions take hours, while point-in-time fraud scores are riddled with uncertainty. FraudAgent combines TigerGraph, LangGraph, ChromaDB GraphRAG, and an analyst workbench to autonomously investigate alerts, calibrate uncertainty, enforce banking policy, and write back findings to graph memory."*

---

### Segment 2: Case HHG-005 — Fraud Ring & Uncertainty Calibration (0:45 – 2:00)
* **What to Show**: Click on `HHG-005` in the Case Inbox.
* **Spoken Script**:
  > *"Let's look at case HHG-005. The trigger was a real-time model alert on transaction 3523199 for $100.07. In isolation, the initial risk score was only 54% — highly uncertain.*  
  > *Watch what happens when the agent invokes TigerGraph MCP tools. Looking at our interactive Spring-embedded Graph Canvas, the agent traversed from the Customer to the Card, to the Transaction, and into the Device Profile. Here, TigerGraph uncovered a critical connection: this device fingerprint (5b64ce5e4c42) is shared across 111 other cards and linked to over 590 prior confirmed fraud cases.*  
  > *Next, notice our Two-Stage Uncertainty Calibration. Before additional evidence was requested, the agent recommended verification. When the customer simulation returned unauthorized denial, the agent calibrated the probability from 54% up to 88%, providing an exact plain-English explanation of what changed."*

---

### Segment 3: Policy Gating & L1 / L2 Manager Approval (2:00 – 3:00)
* **What to Show**: Zoom into the Next-Best Action Card. Show the required approval routes (`L1`, `L2`). Open the FinCEN SAR Drawer. Click the Role Switcher at the top right from Analyst to L2 Manager. Click "Approve & Execute Action".
* **Spoken Script**:
  > *"Autonomous agents must operate within strict banking governance. FraudAgent implements strict policy rules R1 through R10. Notice the recommended actions:*  
  > *• BLOCK_CARD requires L1 Team Lead sign-off.*  
  > *• FILE_REPORT requires L2 Fraud Manager sign-off.*  
  > *Let's inspect the FinCEN SAR Drawer. The agent has already drafted a comprehensive regulatory report answering Who, What, When, Where, Why, and How with exact dollar amounts and subject cards.*  
  > *Now, switching our active role in the header to 'L2 Fraud Manager', the approve button unlocks. Clicking 'Approve & Execute' dispatches the sign-off, which is immediately recorded with a cryptographic timestamp in our immutable Audit Log."*

---

### Segment 4: Case HHG-001 — False Alarm Safely Cleared (3:00 – 3:45)
* **What to Show**: Select `HHG-001` in the Case Inbox.
* **Spoken Script**:
  > *"Now let's examine Case HHG-001 to see how FraudAgent prevents revenue loss and customer disruption. Here, transaction 3514030 was flagged with a weak risk score of 0.61.*  
  > *Instead of prematurely blocking the card, the agent invoked Rule R1: verify before blocking on a weak signal. When the cardholder confirmed the purchase was legitimate, the agent safely cleared the alert under Rule R3 (CLOSE_NO_FRAUD), reducing fraud probability down to 8% with zero customer friction."*

---

### Segment 5: Backend, Benchmark & Conclusion (3:45 – 4:30)
* **What to Show**: Show terminal running `python3 test_phase4.py` and `python3 test_phase5_model_pipeline.py`.
* **Spoken Script**:
  > *"Across all 20 official benchmark exam cases, FraudAgent achieved 100% policy compliance, cleared 5 false alarms safely, drafted 11 regulatory SAR filings, and prevented over $12,185 in fraudulent exposure with an average investigation latency of just 1.16 seconds per case.*  
  > *Every resolved case was written directly back into TigerGraph as permanent case memory.*  
  > *Thank you, and we invite you to review our open-source codebase on GitHub!"*
