"""Random-access lookup of full transaction feature rows from the 700MB transactions.csv.

The graph only stores a handful of transaction attributes, but the fraud model needs the full
feature set. On first use we build a small SQLite index of TransactionID -> byte offset (one
sequential scan, no CSV parsing), after which any row is a seek + parse of a single line.
"""
import csv
import io
import sqlite3
import threading
from pathlib import Path
from typing import Any, Dict, Optional

from .config import DATA_DIR, OUTPUTS_DIR

CSV_PATH = DATA_DIR / "transactions.csv"
INDEX_PATH = OUTPUTS_DIR / "txn_offsets.db"


class TransactionFeatureStore:
    def __init__(self, csv_path: Path = CSV_PATH, index_path: Path = INDEX_PATH):
        self.csv_path = Path(csv_path)
        self.index_path = Path(index_path)
        self._lock = threading.Lock()
        self._header: Optional[list] = None

    @property
    def available(self) -> bool:
        return self.csv_path.exists()

    def _read_header(self) -> list:
        if self._header is None:
            with open(self.csv_path, "r", newline="") as f:
                self._header = next(csv.reader(f))
        return self._header

    def _index_is_current(self) -> bool:
        if not self.index_path.exists():
            return False
        try:
            conn = sqlite3.connect(self.index_path)
            row = conn.execute("SELECT v FROM meta WHERE k='csv_size'").fetchone()
            conn.close()
            return bool(row) and int(row[0]) == self.csv_path.stat().st_size
        except sqlite3.Error:
            return False

    def build_index(self) -> int:
        tmp = self.index_path.with_suffix(".tmp")
        tmp.unlink(missing_ok=True)
        conn = sqlite3.connect(tmp)
        conn.execute("CREATE TABLE offsets (txn_id TEXT PRIMARY KEY, off INTEGER) WITHOUT ROWID")
        conn.execute("CREATE TABLE meta (k TEXT PRIMARY KEY, v TEXT)")
        batch, count, pos = [], 0, 0
        with open(self.csv_path, "rb") as f:
            header = f.readline()
            pos = len(header)
            for line in f:
                batch.append((line[:line.index(b",")].decode(), pos))
                pos += len(line)
                if len(batch) >= 50_000:
                    conn.executemany("INSERT OR REPLACE INTO offsets VALUES (?,?)", batch)
                    count += len(batch)
                    batch = []
        if batch:
            conn.executemany("INSERT OR REPLACE INTO offsets VALUES (?,?)", batch)
            count += len(batch)
        conn.execute("INSERT INTO meta VALUES ('csv_size', ?)", (str(self.csv_path.stat().st_size),))
        conn.commit()
        conn.close()
        tmp.replace(self.index_path)
        return count

    def get_row(self, txn_id: str) -> Optional[Dict[str, Any]]:
        if not self.available:
            return None
        with self._lock:
            if not self._index_is_current():
                self.build_index()
        conn = sqlite3.connect(self.index_path)
        try:
            hit = conn.execute("SELECT off FROM offsets WHERE txn_id=?", (str(txn_id),)).fetchone()
        finally:
            conn.close()
        if not hit:
            return None
        with open(self.csv_path, "rb") as f:
            f.seek(hit[0])
            line = f.readline().decode()
        values = next(csv.reader(io.StringIO(line)))
        return {k: (v if v != "" else None) for k, v in zip(self._read_header(), values)}
