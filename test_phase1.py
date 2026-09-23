import pyTigerGraph as tg
from config import TG_HOST, TG_GRAPH_NAME, update_task, get_tg_connection

EXPECTED_VERTICES = ["Customer", "Card", "Transaction", "DeviceProfile", "EmailDomain", "BillingRegion", "ClosedCase"]
EXPECTED_EDGES = ["OWNS", "MADE", "FROM_DEVICE", "PURCHASER_EMAIL", "BILLED_IN", "NEXT", "INVOLVES", "ON_CARD", "CONNECTED_TO"]

SPOT_CHECK_TXN = "3514030"   # HHG-001 flagged txn
SPOT_CHECK_CASE = "CC-0001"  # first closed case


def connect():
    return get_tg_connection(TG_GRAPH_NAME)



def test_vertex_counts(conn):
    print("\n--- Vertex Counts ---")
    results = {}
    all_pass = True
    for vtype in EXPECTED_VERTICES:
        try:
            count = conn.getVertexCount(vtype)
            status = "PASS" if count > 0 else "FAIL"
            if count == 0:
                all_pass = False
            results[vtype] = {"count": count, "status": status}
            print(f"  {vtype}: {count:,} [{status}]")
        except Exception as e:
            results[vtype] = {"count": 0, "status": "ERROR", "error": str(e)}
            print(f"  {vtype}: ERROR - {e}")
            all_pass = False
    return results, all_pass


def test_edge_counts(conn):
    print("\n--- Edge Counts ---")
    results = {}
    all_pass = True
    for etype in EXPECTED_EDGES:
        try:
            count = conn.getEdgeCount(etype)
            status = "PASS" if count > 0 else "FAIL"
            if count == 0:
                all_pass = False
            results[etype] = {"count": count, "status": status}
            print(f"  {etype}: {count:,} [{status}]")
        except Exception as e:
            results[etype] = {"count": 0, "status": "ERROR", "error": str(e)}
            print(f"  {etype}: ERROR - {e}")
            all_pass = False
    return results, all_pass


def test_spot_checks(conn):
    print("\n--- Spot Checks ---")
    results = {}

    try:
        txn = conn.getVerticesById("Transaction", SPOT_CHECK_TXN)
        found = len(txn) > 0
        results["txn_" + SPOT_CHECK_TXN] = "PASS" if found else "FAIL"
        print(f"  Transaction {SPOT_CHECK_TXN}: {'FOUND' if found else 'NOT FOUND'} [{'PASS' if found else 'FAIL'}]")
        if found:
            attrs = txn[0].get("attributes", txn[0]) if isinstance(txn, list) else txn
            print(f"    amount={attrs.get('amount')}, channel={attrs.get('channel')}, risk_score={attrs.get('risk_score')}")
    except Exception as e:
        results["txn_" + SPOT_CHECK_TXN] = "ERROR"
        print(f"  Transaction {SPOT_CHECK_TXN}: ERROR - {e}")

    try:
        case = conn.getVerticesById("ClosedCase", SPOT_CHECK_CASE)
        found = len(case) > 0
        results["case_" + SPOT_CHECK_CASE] = "PASS" if found else "FAIL"
        print(f"  ClosedCase {SPOT_CHECK_CASE}: {'FOUND' if found else 'NOT FOUND'} [{'PASS' if found else 'FAIL'}]")
        if found:
            attrs = case[0].get("attributes", case[0]) if isinstance(case, list) else case
            print(f"    outcome={attrs.get('outcome')}, pattern={attrs.get('pattern')}")
    except Exception as e:
        results["case_" + SPOT_CHECK_CASE] = "ERROR"
        print(f"  ClosedCase {SPOT_CHECK_CASE}: ERROR - {e}")

    return results


def test_connectivity(conn):
    print("\n--- Connectivity Check ---")
    try:
        edges = conn.getEdges("Card", "C12382-K1", "MADE")
        count = len(edges) if edges else 0
        status = "PASS" if count > 0 else "FAIL"
        print(f"  Card C12382-K1 -> MADE edges: {count} [{status}]")

        if count > 0:
            first_txn = edges[0].get("to_id", edges[0].get("e_type", ""))
            print(f"    First connected txn: {first_txn}")
        return {"card_connectivity": status, "edge_count": count}
    except Exception as e:
        print(f"  Connectivity check: ERROR - {e}")
        return {"card_connectivity": "ERROR", "error": str(e)}


def run_tests():
    print("=" * 60)
    print("PHASE 1 VERIFICATION")
    print("=" * 60)

    conn = connect()
    print(f"Connected to {TG_HOST} / {TG_GRAPH_NAME}")

    v_results, v_pass = test_vertex_counts(conn)
    e_results, e_pass = test_edge_counts(conn)
    spot_results = test_spot_checks(conn)
    conn_results = test_connectivity(conn)

    all_pass = v_pass and e_pass
    all_pass = all_pass and all(v == "PASS" for v in spot_results.values())
    all_pass = all_pass and conn_results.get("card_connectivity") == "PASS"

    print("\n" + "=" * 60)
    verdict = "ALL TESTS PASSED" if all_pass else "SOME TESTS FAILED"
    print(f"RESULT: {verdict}")
    print("=" * 60)

    update_task("testing", "completed" if all_pass else "failed", {
        "vertices": v_results,
        "edges": e_results,
        "spot_checks": spot_results,
        "connectivity": conn_results,
        "overall": "PASS" if all_pass else "FAIL",
    })

    return all_pass


if __name__ == "__main__":
    success = run_tests()
    exit(0 if success else 1)
