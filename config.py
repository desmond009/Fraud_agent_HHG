import os
import json
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).parent
DATA_DIR = PROJECT_ROOT / "data"
OUTPUT_DIR = PROJECT_ROOT / "outputs"
OUTPUT_DIR.mkdir(exist_ok=True)

TG_HOST = os.getenv("TG_HOST")
TG_USERNAME = os.getenv("TG_USERNAME", "tigergraph")
TG_PASSWORD = os.getenv("TG_PASSWORD")
TG_SECRET = os.getenv("TG_SECRET", os.getenv("TG_PASSWORD"))
TG_GRAPH_NAME = os.getenv("TG_GRAPH_NAME", "FraudGraph")

PROGRESS_FILE = PROJECT_ROOT / "progress.json"


def get_tg_connection(graph_name=""):
    import pyTigerGraph as tg
    if TG_SECRET:
        conn = tg.TigerGraphConnection(
            host=TG_HOST,
            graphname=graph_name,
            gsqlSecret=TG_SECRET,
        )
        token_res = conn.getToken(TG_SECRET)
        token = token_res[0] if isinstance(token_res, (list, tuple)) else token_res
        conn.apiToken = token
        return conn
    return tg.TigerGraphConnection(
        host=TG_HOST,
        username=TG_USERNAME,
        password=TG_PASSWORD,
        graphname=graph_name,
    )



def load_progress():
    if PROGRESS_FILE.exists():
        return json.loads(PROGRESS_FILE.read_text())
    return {
        "phase": "phase_1",
        "tasks": {
            "eda": {"status": "pending", "script": "scripts/eda.py"},
            "schema": {"status": "pending", "script": "schema/setup_schema.py"},
            "ingestion": {"status": "pending", "script": "scripts/ingest.py"},
            "testing": {"status": "pending", "script": "test_phase1.py"},
        },
        "last_updated": "",
    }


def save_progress(progress):
    from datetime import datetime
    progress["last_updated"] = datetime.now().isoformat()
    PROGRESS_FILE.write_text(json.dumps(progress, indent=2))


def update_task(task_name, status, details=None):
    progress = load_progress()
    if "tasks" not in progress:
        progress["tasks"] = {}
    if task_name not in progress["tasks"]:
        progress["tasks"][task_name] = {}
    progress["tasks"][task_name]["status"] = status
    if details:
        progress["tasks"][task_name].update(details)
    save_progress(progress)

