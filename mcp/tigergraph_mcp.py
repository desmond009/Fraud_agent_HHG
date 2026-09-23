import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

from typing import Dict, Any, List, Optional
from config import get_tg_connection, TG_GRAPH_NAME


class TigerGraphMCPBridge:
    def __init__(self, graph_name: str = TG_GRAPH_NAME):
        self.graph_name = graph_name
        self.conn = get_tg_connection(graph_name)

    def query_txn_window(self, card_id: str, target_ts: str, window_hours: int = 2) -> Dict[str, Any]:
        params = {
            "target_card": (card_id,),
            "target_ts": target_ts,
            "window_hours": window_hours,
        }
        try:
            res = self.conn.runInstalledQuery("txn_window", params)
            if res and isinstance(res, list):
                return res[0]
        except Exception:
            params_interp = {
                "target_card": card_id,
                "target_ts": target_ts,
                "window_hours": window_hours,
            }
            q = f'''
            INTERPRET QUERY (VERTEX<Card> target_card, DATETIME target_ts, INT window_hours) FOR GRAPH {self.graph_name} {{
                SumAccum<INT> @@total_txns;
                SumAccum<DOUBLE> @@exposure_usd;
                SumAccum<INT> @@micro_authorizations;
                SumAccum<INT> @@large_purchases;
                ListAccum<VERTEX<Transaction>> @@txn_ids;

                Start = {{target_card}};
                Txns = SELECT t FROM Start:c -(MADE:e)- Transaction:t
                       WHERE abs(datetime_diff(t.ts, target_ts)) <= window_hours * 3600
                       ACCUM
                           @@total_txns += 1,
                           @@exposure_usd += t.amount,
                           @@txn_ids += t,
                           CASE WHEN t.amount < 5.0 THEN @@micro_authorizations += 1
                           ELSE CASE WHEN t.amount >= 50.0 THEN @@large_purchases += 1 END END;

                PRINT @@total_txns AS total_txns,
                      @@exposure_usd AS exposure_usd,
                      @@micro_authorizations AS micro_authorizations,
                      @@large_purchases AS large_purchases,
                      (@@micro_authorizations >= 3 AND @@large_purchases >= 1) AS is_card_testing,
                      @@txn_ids AS txn_ids;
            }}
            '''
            res = self.conn.runInterpretedQuery(q, params)
            if res and isinstance(res, list):
                return res[0]
        return {}

    def query_neighborhood(self, txn_id: str) -> Dict[str, Any]:
        params = {"target_txn": (txn_id,)}
        try:
            res = self.conn.runInstalledQuery("device_region_neighborhood", params)
            if res and isinstance(res, list):
                return res[0]
        except Exception:
            params_interp = {"target_txn": txn_id}
            q = f'''
            INTERPRET QUERY (VERTEX<Transaction> target_txn) FOR GRAPH {self.graph_name} {{
                SetAccum<VERTEX<DeviceProfile>> @@shared_devices;
                SetAccum<VERTEX<Card>> @@connected_cards;
                SetAccum<VERTEX<ClosedCase>> @@prior_cases;
                SumAccum<INT> @@prior_fraud_cases;

                Start = {{target_txn}};
                Devs = SELECT d FROM Start:t -(FROM_DEVICE:e)- DeviceProfile:d
                       ACCUM @@shared_devices += d;

                OtherTxns = SELECT t FROM Devs:d -(DEVICE_USED_IN:e)- Transaction:t
                            WHERE t != target_txn;

                OtherCards = SELECT c FROM OtherTxns:t -(MADE_BY:e)- Card:c
                             ACCUM @@connected_cards += c;

                Cases = SELECT cc FROM OtherCards:c -(HAS_CASE:e)- ClosedCase:cc
                        ACCUM
                            @@prior_cases += cc,
                            CASE WHEN cc.outcome == "confirmed_fraud" THEN @@prior_fraud_cases += 1 END;

                PRINT @@shared_devices AS shared_devices,
                      @@connected_cards.size() AS connected_card_count,
                      @@connected_cards AS connected_cards,
                      @@prior_cases.size() AS prior_case_count,
                      @@prior_fraud_cases AS prior_fraud_cases,
                      @@prior_cases AS prior_cases;
            }}
            '''
            res = self.conn.runInterpretedQuery(q, params)
            if res and isinstance(res, list):
                return res[0]
        return {}

    def match_historical_cases(self, pattern_filter: str = "", max_results: int = 5) -> List[Dict[str, Any]]:
        params = {"pattern_filter": pattern_filter, "max_results": max_results}
        try:
            res = self.conn.runInstalledQuery("historical_case_matcher", params)
            if res and isinstance(res, list):
                return res[0].get("MatchingCases", [])
        except Exception:
            q = f'''
            INTERPRET QUERY (STRING pattern_filter, INT max_results) FOR GRAPH {self.graph_name} {{
                Cases = {{ClosedCase.*}};
                MatchingCases = SELECT c FROM Cases:c
                                WHERE pattern_filter == "" OR c.pattern == pattern_filter
                                LIMIT max_results;
                PRINT MatchingCases;
            }}
            '''
            res = self.conn.runInterpretedQuery(q, params)
            if res and isinstance(res, list):
                return res[0].get("MatchingCases", [])
        return []

    def get_transaction(self, txn_id: str) -> Dict[str, Any]:
        txns = self.conn.getVerticesById("Transaction", txn_id)
        if txns:
            return txns[0] if isinstance(txns, list) else txns
        return {}

    def get_card(self, card_id: str) -> Dict[str, Any]:
        cards = self.conn.getVerticesById("Card", card_id)
        if cards:
            return cards[0] if isinstance(cards, list) else cards
        return {}

    def get_customer(self, customer_id: str) -> Dict[str, Any]:
        cust = self.conn.getVerticesById("Customer", customer_id)
        if cust:
            return cust[0] if isinstance(cust, list) else cust
        return {}

    def write_investigation_case(self, case_id: str, outcome: str, pattern: str,
                                 exposure_usd: float, analyst_notes: str,
                                 card_id: str = "", txn_ids: Optional[List[str]] = None) -> bool:
        vertex_data = [(case_id, {
            "outcome": outcome,
            "pattern": pattern,
            "exposure_usd": float(exposure_usd),
            "opened_at": "2016-12-31 00:00:00",
            "closed_at": "2016-12-31 00:00:00",
            "actions_taken": "CREATE_CASE",
            "report_filed": "Yes" if exposure_usd > 1000 else "No",
            "analyst_notes": analyst_notes,
            "n_txns": len(txn_ids) if txn_ids else 1,
        })]
        self.conn.upsertVertices("ClosedCase", vertex_data)

        if card_id:
            self.conn.upsertEdges("ClosedCase", "ON_CARD", "Card", [(case_id, card_id, {})])
        if txn_ids:
            edges = [(case_id, tid, {}) for tid in txn_ids]
            self.conn.upsertEdges("ClosedCase", "INVOLVES", "Transaction", edges)
        return True

    def get_mcp_tools_schema(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "query_txn_window",
                "description": "Calculates velocity, micro-authorization card-testing signals, and total exposure for a card around a target timestamp.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "card_id": {"type": "string", "description": "Card ID (e.g. C12382-K1)"},
                        "target_ts": {"type": "string", "description": "Timestamp in YYYY-MM-DD HH:MM:SS"},
                        "window_hours": {"type": "integer", "default": 2, "description": "Window in hours"},
                    },
                    "required": ["card_id", "target_ts"],
                },
            },
            {
                "name": "query_neighborhood",
                "description": "Finds connected cards, shared devices, and prior confirmed fraud cases in the graph neighborhood of a transaction.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "txn_id": {"type": "string", "description": "Transaction ID (e.g. 3514030)"},
                    },
                    "required": ["txn_id"],
                },
            },
            {
                "name": "match_historical_cases",
                "description": "Searches closed investigation memory for prior cases with matching fraud patterns.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "pattern_filter": {"type": "string", "description": "Fraud pattern: card_testing, card_not_present_fraud, out_of_region_use, account_takeover, or empty for all"},
                        "max_results": {"type": "integer", "default": 5},
                    },
                },
            },
            {
                "name": "get_transaction",
                "description": "Fetches raw attributes of a transaction (amount, risk_score, channel, region).",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "txn_id": {"type": "string", "description": "Transaction ID"},
                    },
                    "required": ["txn_id"],
                },
            },
        ]
