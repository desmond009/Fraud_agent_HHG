import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))

import json
from pathlib import Path
from typing import List, Tuple
from config import PROJECT_ROOT, update_task, get_tg_connection, TG_GRAPH_NAME

CASES_DIR = PROJECT_ROOT / "cases"

EXPECTED_CASE_IDS = [f"HHG-{i:03d}" for i in range(1, 21)]

REQUIRED_TOP_KEYS = [
    "case_id", "case", "evidence_requests", "next_best_actions",
    "sar", "stop_reason", "tool_calls"
]

REQUIRED_CASE_KEYS = [
    "status", "verdict", "fraud_probability", "pattern",
    "pattern_description", "affected_txn_ids", "first_suspicious_txn_id",
    "connected_card_ids", "connected_device_profiles", "exposure_usd",
    "evidence", "similar_prior_cases", "summary", "written_to_graph",
    "graph_case_id"
]

REQUIRED_NBA_KEYS = ["initial", "final", "what_changed"]
REQUIRED_SAR_KEYS = ["file", "reason", "narrative", "subjects", "total_amount_usd", "activity_dates"]

VALID_VERDICTS = {"fraud", "legitimate", "uncertain"}
VALID_PATTERNS = {
    "card_testing", "card_not_present_fraud", "card_not_present_new_device",
    "out_of_region_use", "account_takeover", "undocumented", "none"
}
VALID_ACTIONS = {
    "ALLOW_TRANSACTION", "DECLINE_TRANSACTION", "MONITOR_CARD", "MONITOR_CONNECTED_CARDS",
    "WARN_CUSTOMER", "VERIFY_WITH_CUSTOMER", "STEP_UP_AUTH", "BLOCK_CARD", "BLOCK_ALL_CARDS",
    "GENERATE_REPORT", "CREATE_CASE", "FILE_REPORT", "ESCALATE_TO_ANALYST", "CLOSE_NO_FRAUD"
}
VALID_ROUTES = {"auto", "L1", "L2"}


def validate_case_file(filepath: Path) -> (bool, List[str]):
    errors = []
    try:
        data = json.loads(filepath.read_text())
    except Exception as e:
        return False, [f"Invalid JSON: {e}"]

    # 1. Top level
    for k in REQUIRED_TOP_KEYS:
        if k not in data:
            errors.append(f"Missing top-level key: {k}")

    # 2. Case part
    case = data.get("case", {})
    for k in REQUIRED_CASE_KEYS:
        if k not in case:
            errors.append(f"Missing case key: {k}")

    if case.get("verdict") not in VALID_VERDICTS:
        errors.append(f"Invalid verdict: {case.get('verdict')}")

    if case.get("pattern") not in VALID_PATTERNS:
        errors.append(f"Invalid pattern: {case.get('pattern')}")

    if not case.get("written_to_graph"):
        errors.append("written_to_graph must be True")

    # Legitimate rules check
    if case.get("verdict") == "legitimate":
        if case.get("affected_txn_ids") != []:
            errors.append("Legitimate case must have affected_txn_ids == []")
        if case.get("exposure_usd") != 0.0 and case.get("exposure_usd") != 0:
            errors.append("Legitimate case must have exposure_usd == 0")
        if data.get("sar", {}).get("file") is not False:
            errors.append("Legitimate case must have sar.file == False")

    # 3. Next Best Actions
    nba = data.get("next_best_actions", {})
    for k in REQUIRED_NBA_KEYS:
        if k not in nba:
            errors.append(f"Missing NBA key: {k}")

    for a in nba.get("initial", []) + nba.get("final", []):
        if a.get("action") not in VALID_ACTIONS:
            errors.append(f"Invalid action: {a.get('action')}")
        if a.get("route") not in VALID_ROUTES:
            errors.append(f"Invalid route: {a.get('route')}")

    # 4. SAR
    sar = data.get("sar", {})
    for k in REQUIRED_SAR_KEYS:
        if k not in sar:
            errors.append(f"Missing SAR key: {k}")

    if sar.get("file"):
        if not sar.get("narrative") or len(sar.get("narrative")) < 100:
            errors.append("SAR file=true must contain a complete narrative (>= 100 chars)")
        if not sar.get("subjects"):
            errors.append("SAR file=true must contain subjects")
        if sar.get("total_amount_usd", 0.0) <= 0:
            errors.append("SAR file=true must have total_amount_usd > 0")
    else:
        if sar.get("narrative") != "":
            errors.append("SAR file=false must have narrative == ''")
        if sar.get("subjects") != []:
            errors.append("SAR file=false must have subjects == []")
        if sar.get("total_amount_usd") != 0.0 and sar.get("total_amount_usd") != 0:
            errors.append("SAR file=false must have total_amount_usd == 0")

    return len(errors) == 0, errors


def test_submission_packaging():
    print("=" * 70)
    print("PHASE 4 VERIFICATION: SUBMISSION PACKAGING & SCHEMA VALIDATION")
    print("=" * 70)

    if not CASES_DIR.exists():
        print(f"FAIL: {CASES_DIR} directory does not exist.")
        return False

    all_passed = True
    validated_count = 0

    print(f"Checking all {len(EXPECTED_CASE_IDS)} deliverable JSON files in cases/:\n")

    for cid in EXPECTED_CASE_IDS:
        cfile = CASES_DIR / f"{cid}.json"
        if not cfile.exists():
            print(f"  [MISSING] {cid}.json not found!")
            all_passed = False
            continue

        valid, errs = validate_case_file(cfile)
        if valid:
            validated_count += 1
            data = json.loads(cfile.read_text())
            verdict = data['case']['verdict']
            sar_flag = data['sar']['file']
            print(f"  [PASS] {cid}.json: verdict={verdict:<10} | SAR={'YES' if sar_flag else 'NO ':<3} | Schema 100% Valid")
        else:
            all_passed = False
            print(f"  [FAIL] {cid}.json:")
            for e in errs:
                print(f"         - {e}")

    print("\n--- TigerGraph Memory Verification ---")
    conn = get_tg_connection(TG_GRAPH_NAME)
    try:
        sample_graph_case = conn.getVerticesById("ClosedCase", "CASE-HHG-001")
        graph_stored = len(sample_graph_case) > 0
        print(f"  TigerGraph Vertex 'CASE-HHG-001' Found: {graph_stored} [{'PASS' if graph_stored else 'FAIL'}]")
    except Exception as e:
        print(f"  TigerGraph check error: {e}")
        graph_stored = False

    overall = all_passed and (validated_count == 20) and graph_stored
    summary = {
        "files_validated": validated_count,
        "total_expected": len(EXPECTED_CASE_IDS),
        "schema_compliance": "100%" if all_passed else f"{validated_count}/20",
        "tigergraph_writeback_verified": graph_stored,
        "overall": "PASS" if overall else "FAIL"
    }

    update_task("submission_packaging", "completed" if overall else "failed", summary)
    update_task("testing_phase4", "completed" if overall else "failed", summary)

    print("\n" + "=" * 70)
    print(f"PHASE 4 OVERALL RESULT: {'ALL 20 CASES VALIDATED & PACKAGED' if overall else 'TESTS FAILED'}")
    print("=" * 70)
    return overall


if __name__ == "__main__":
    test_submission_packaging()
