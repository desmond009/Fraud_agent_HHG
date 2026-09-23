import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))

import json
import pandas as pd
from agent.graph import investigation_app
from config import DATA_DIR, update_task


def run_phase3_test():
    print("=" * 60)
    print("PHASE 3 VERIFICATION: LANGGRAPH AGENTIC INVESTIGATION")
    print("=" * 60)

    # Load first case from case_pack.csv (HHG-001)
    pack = pd.read_csv(DATA_DIR / "case_pack.csv")
    sample_case = pack.iloc[0].to_dict()
    print(f"Testing Case: {sample_case.get('case_id')}")
    print(f"Trigger: {sample_case.get('trigger_text')}\n")

    # Run LangGraph workflow
    initial_input = {"raw_case": sample_case}
    result = investigation_app.invoke(initial_input)

    # 1. State Transitions Check
    states = result.get("state_history", [])
    print("--- State Machine Transitions ---")
    for i, state_name in enumerate(states):
        print(f"  [{i+1}/6] -> {state_name}")

    expected_states = [
        "trigger_ingestion",
        "initial_investigation",
        "evidence_synthesis",
        "uncertainty_assessment",
        "evidence_simulation",
        "case_memory_writeback",
    ]
    states_passed = states == expected_states
    print(f"State Sequence: {'PASS' if states_passed else 'FAIL'}")

    # 2. Telemetry & Tool Calls
    tool_calls = result.get("tool_calls", 0)
    latency_s = result.get("latency_s", 0)
    print(f"\n--- Telemetry ---")
    print(f"  Tool Calls (TigerGraph + VectorStore): {tool_calls}")
    print(f"  Latency: {latency_s:.2f}s")
    print(f"  Tokens: {result.get('tokens', 0)}")

    # 3. Actions Check
    actions = result.get("final_output", {}).get("next_best_actions", {})
    init_actions = actions.get("initial", [])
    final_actions = actions.get("final", [])
    print(f"\n--- Next-Best Actions ---")
    print(f"  Initial Actions ({len(init_actions)}):")
    for a in init_actions:
        print(f"    - {a.get('action')} [{a.get('route')}] ({a.get('reason')})")
    print(f"  Final Actions ({len(final_actions)}):")
    for a in final_actions:
        print(f"    - {a.get('action')} [{a.get('route')}] ({a.get('reason')})")
    print(f"  What Changed: {actions.get('what_changed')}")

    # 4. Final Output Deliverable Validation
    final_out = result.get("final_output", {})
    required_keys = ["case_id", "case", "evidence_requests", "next_best_actions", "sar", "stop_reason", "tool_calls"]
    output_valid = all(k in final_out for k in required_keys)
    case_part = final_out.get("case", {})
    written_to_graph = case_part.get("written_to_graph", False)
    print(f"\n--- Validation ---")
    print(f"  Deliverable Schema Valid: {output_valid} [{'PASS' if output_valid else 'FAIL'}]")
    print(f"  Written to TigerGraph: {written_to_graph} [{'PASS' if written_to_graph else 'FAIL'}]")
    print(f"  Verdict: {case_part.get('verdict')} | Pattern: {case_part.get('pattern')} | Prob: {case_part.get('fraud_probability')}")

    overall = states_passed and output_valid and written_to_graph
    summary = {
        "tested_case": sample_case.get("case_id"),
        "states_traversed": states,
        "tool_calls": tool_calls,
        "latency_s": latency_s,
        "written_to_graph": written_to_graph,
        "overall": "PASS" if overall else "FAIL",
    }

    update_task("agent_workflow", "completed" if overall else "failed", summary)
    update_task("testing_phase3", "completed" if overall else "failed", summary)

    print("\n" + "=" * 60)
    print(f"PHASE 3 OVERALL RESULT: {'ALL TESTS PASSED' if overall else 'TESTS FAILED'}")
    print("=" * 60)

    print("\nSample Deliverable JSON Output:")
    print(json.dumps(final_out, indent=2)[:600] + "\n...")

    return overall


if __name__ == "__main__":
    run_phase3_test()
