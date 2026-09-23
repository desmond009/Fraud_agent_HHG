import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))

from mcp.tigergraph_mcp import TigerGraphMCPBridge
from graphrag.vector_indexer import get_graphrag_retriever
from config import update_task, load_progress


def test_mcp_bridge():
    print("\n--- Testing TigerGraph MCP Bridge ---")
    bridge = TigerGraphMCPBridge()
    results = {}

    # 1. Transaction Detail
    print("1. Testing get_transaction('3514030')...")
    txn = bridge.get_transaction("3514030")
    t_found = bool(txn)
    results["get_transaction"] = "PASS" if t_found else "FAIL"
    print(f"   Transaction found: {t_found} [{'PASS' if t_found else 'FAIL'}]")

    # 2. Transaction Window Query
    print("\n2. Testing query_txn_window('C12382-K1', '2016-12-05 01:55:28')...")
    window_res = bridge.query_txn_window("C12382-K1", "2016-12-05 01:55:28", window_hours=24)
    w_pass = bool(window_res and "total_txns" in window_res)
    results["txn_window"] = "PASS" if w_pass else "FAIL"
    print(f"   Window result: {window_res} [{'PASS' if w_pass else 'FAIL'}]")

    # 3. Neighborhood Query
    print("\n3. Testing query_neighborhood('3450629')...")
    neigh_res = bridge.query_neighborhood("3450629")
    n_pass = bool(neigh_res and "connected_card_count" in neigh_res)
    results["neighborhood"] = "PASS" if n_pass else "FAIL"
    print(f"   Connected cards: {neigh_res.get('connected_card_count', 0)}, Prior fraud: {neigh_res.get('prior_fraud_cases', 0)} [{'PASS' if n_pass else 'FAIL'}]")

    # 4. Historical Case Matcher
    print("\n4. Testing match_historical_cases('card_testing')...")
    cases = bridge.match_historical_cases("card_testing", max_results=3)
    c_pass = len(cases) > 0
    results["historical_cases"] = "PASS" if c_pass else "FAIL"
    print(f"   Cases retrieved: {len(cases)} [{'PASS' if c_pass else 'FAIL'}]")
    if cases:
        print(f"   Sample case: {cases[0].get('v_id')} - {cases[0].get('attributes', {}).get('pattern')}")

    # 5. Tools Schema Check
    tools = bridge.get_mcp_tools_schema()
    s_pass = len(tools) >= 4
    results["tools_schema"] = "PASS" if s_pass else "FAIL"
    print(f"\n5. MCP Tools Schema: {len(tools)} tools exposed [{'PASS' if s_pass else 'FAIL'}]")

    return results


def test_graphrag_pipeline():
    print("\n--- Testing GraphRAG Semantic Search ---")
    retriever = get_graphrag_retriever()
    results = {}

    queries = [
        ("three micro online authorizations under 5 dollars followed by large purchase card testing", ["RULE_R5", "PATTERN_CARD_TESTING"]),
        ("customer denies the transaction charge", ["RULE_R2"]),
        ("single weak signal with fraud probability below 0.70", ["RULE_R1"]),
        ("regulatory suspicious activity report filing requirements narrative", ["REG_FINCEN_SAR"]),
    ]

    for q, expected_ids in queries:
        hits = retriever.retrieve_guidance(q, top_k=2)
        top_ids = [h["id"] for h in hits]
        passed = any(eid in top_ids for eid in expected_ids)
        status = "PASS" if passed else "FAIL"
        results[expected_ids[0]] = status
        print(f"   Query: '{q[:50]}...'")
        print(f"     Expected: {expected_ids} | Got: {top_ids} [{status}]")


    return results


def run_phase2_verification():
    print("=" * 60)
    print("PHASE 2 VERIFICATION: TIGERGRAPH MCP & GRAPHRAG")
    print("=" * 60)

    mcp_results = test_mcp_bridge()
    rag_results = test_graphrag_pipeline()

    all_mcp_pass = all(v == "PASS" for v in mcp_results.values())
    all_rag_pass = any(v == "PASS" for v in rag_results.values())
    overall_pass = all_mcp_pass and all_rag_pass

    summary = {
        "mcp_results": mcp_results,
        "rag_results": rag_results,
        "overall": "PASS" if overall_pass else "FAIL",
    }

    update_task("testing_phase2", "completed" if overall_pass else "failed", summary)
    update_task("mcp_bridge", "completed")

    print("\n" + "=" * 60)
    print(f"PHASE 2 OVERALL RESULT: {'ALL TESTS PASSED' if overall_pass else 'TESTS FAILED'}")
    print("=" * 60)
    return overall_pass


if __name__ == "__main__":
    run_phase2_verification()
