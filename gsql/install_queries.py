import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

from pathlib import Path
from config import get_tg_connection, TG_GRAPH_NAME, update_task

QUERIES_FILE = Path(__file__).parent / "queries.gsql"


def install_queries():
    print(f"Connecting to TigerGraph for graph '{TG_GRAPH_NAME}'...")
    conn = get_tg_connection(TG_GRAPH_NAME)

    gsql_script = QUERIES_FILE.read_text()
    print("Creating queries on FraudGraph...")
    res = conn.gsql(gsql_script)
    print(res)

    print("[OK] Queries registered on graph.")
    update_task("gsql_queries", "completed", {"file": "gsql/queries.gsql"})


if __name__ == "__main__":
    install_queries()
