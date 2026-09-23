import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))

import json
import time
from pathlib import Path
import pandas as pd
from agent.graph import investigation_app
from config import DATA_DIR, PROJECT_ROOT, update_task

CASES_DIR = PROJECT_ROOT / "cases"
CASES_DIR.mkdir(parents=True, exist_ok=True)


def run_benchmark():
    print("=" * 70)
    print("PHASE 4: EXECUTING BENCHMARK ON ALL 20 EXAM CASES")
    print("=" * 70)

    case_pack_file = DATA_DIR / "case_pack.csv"
    if not case_pack_file.exists():
        print(f"Error: {case_pack_file} not found.")
        return False

    pack_df = pd.read_csv(case_pack_file)
    total_cases = len(pack_df)
    print(f"Loaded {total_cases} cases from {case_pack_file.name}\n")

    results_summary = []
    start_total_time = time.time()
    fraud_count = 0
    legit_count = 0
    sar_count = 0
    total_tool_calls = 0

    for idx, row in pack_df.iterrows():
        case_dict = row.to_dict()
        case_id = str(case_dict.get("case_id"))
        t0 = time.time()

        # Invoke LangGraph workflow
        res = investigation_app.invoke({"raw_case": case_dict})
        final_output = res.get("final_output", {})

        # Save exact deliverable JSON
        output_file = CASES_DIR / f"{case_id}.json"
        output_file.write_text(json.dumps(final_output, indent=2))

        # Metrics
        case_info = final_output.get("case", {})
        verdict = case_info.get("verdict", "uncertain")
        pattern = case_info.get("pattern", "none")
        exposure = case_info.get("exposure_usd", 0.0)
        tool_calls = final_output.get("tool_calls", 0)
        sar_filed = final_output.get("sar", {}).get("file", False)
        elapsed = time.time() - t0

        if verdict == "fraud":
            fraud_count += 1
        elif verdict == "legitimate":
            legit_count += 1
        if sar_filed:
            sar_count += 1
        total_tool_calls += tool_calls

        results_summary.append({
            "case_id": case_id,
            "verdict": verdict,
            "pattern": pattern,
            "exposure_usd": exposure,
            "sar_filed": sar_filed,
            "tool_calls": tool_calls,
            "latency_s": round(elapsed, 2),
        })

        print(f"[{idx+1:02d}/{total_cases:02d}] {case_id}: verdict={verdict:<10} | pattern={pattern:<25} | "
              f"exposure=${exposure:>8.2f} | SAR={'YES' if sar_filed else 'NO ':<3} | latency={elapsed:.2f}s")

    total_time = time.time() - start_total_time
    print("\n" + "=" * 70)
    print("BENCHMARK EXECUTION SUMMARY")
    print("=" * 70)
    print(f"Total Cases Processed: {total_cases} / {total_cases}")
    print(f"Confirmed Fraud:       {fraud_count}")
    print(f"Cleared Legitimate:    {legit_count}")
    print(f"SAR Reports Filed:     {sar_count}")
    print(f"Total Tool Calls:      {total_tool_calls}")
    print(f"Total Wall Time:       {total_time:.2f}s (avg {total_time/total_cases:.2f}s/case)")
    print(f"Artifacts Saved To:    {CASES_DIR}")
    print("=" * 70)

    benchmark_record = {
        "status": "completed",
        "total_cases": total_cases,
        "fraud_cases": fraud_count,
        "legitimate_cases": legit_count,
        "sar_filed_count": sar_count,
        "total_tool_calls": total_tool_calls,
        "total_time_s": round(total_time, 2),
        "cases_directory": str(CASES_DIR),
        "cases": results_summary,
    }

    update_task("benchmark_execution", "completed", benchmark_record)
    return True


if __name__ == "__main__":
    run_benchmark()
