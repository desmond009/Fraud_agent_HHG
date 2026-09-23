import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

import pyTigerGraph as tg
from config import TG_HOST, TG_GRAPH_NAME, update_task, get_tg_connection
from pathlib import Path

SCHEMA_FILE = Path(__file__).parent / "schema.gsql"


def get_connection(graph_name=""):
    return get_tg_connection(graph_name)



def setup_schema():
    print("Connecting to TigerGraph...")
    conn = get_connection()
    print(f"  Host: {TG_HOST}")

    gsql = SCHEMA_FILE.read_text()
    print("Executing schema.gsql...")
    res = conn.gsql(gsql)
    print(res)


    print(f"\nSwitching to graph '{TG_GRAPH_NAME}'...")
    conn = get_connection(TG_GRAPH_NAME)
    try:
        schema = conn.getSchema()
        vtypes = list(schema.get("VertexTypes", []))
        etypes = list(schema.get("EdgeTypes", []))
        print(f"  Vertex types: {len(vtypes)}")
        print(f"  Edge types: {len(etypes)}")
    except Exception as e:
        print(f"  Schema check: {e}")

    update_task("schema", "completed")
    print("\n[OK] Schema setup complete.")


if __name__ == "__main__":
    setup_schema()
