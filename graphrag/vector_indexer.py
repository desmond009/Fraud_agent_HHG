import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from config import OUTPUT_DIR, update_task

PERSIST_DIR = OUTPUT_DIR / "vector_store"
PERSIST_DIR.mkdir(parents=True, exist_ok=True)

COLLECTION_NAME = "fraud_policy_rules"

POLICY_CHUNKS = [
    {
        "id": "RULE_R1",
        "category": "rule",
        "rule_id": "R1",
        "title": "Verify before you block on a weak signal",
        "approval_route": "auto",
        "content": (
            "Rule R1. Verify before you block on a weak signal. If the case rests on a single signal "
            "(including a risk score alone) and your assessed fraud probability is below 0.70, recommend "
            "VERIFY_WITH_CUSTOMER or STEP_UP_AUTH before any block. Blocking a legitimate customer on one signal "
            "is a policy breach. Actions are auto-routed."
        ),
    },
    {
        "id": "RULE_R2",
        "category": "rule",
        "rule_id": "R2",
        "title": "Customer denies the transaction",
        "approval_route": "L1/L2",
        "content": (
            "Rule R2. Customer denies the transaction. Recommend BLOCK_CARD and CREATE_CASE. Add FILE_REPORT "
            "if exposure exceeds $1,000 or the case connects to a shared device profile or another card's fraud. "
            "Routing: BLOCK_CARD is L1 (team lead) if exposure <= $2,500, L2 (fraud manager) if exposure > $2,500. "
            "FILE_REPORT is always L2. CREATE_CASE is auto."
        ),
    },
    {
        "id": "RULE_R3",
        "category": "rule",
        "rule_id": "R3",
        "title": "Customer confirms the transaction",
        "approval_route": "auto",
        "content": (
            "Rule R3. Customer confirms the transaction. Recommend CLOSE_NO_FRAUD. Note the confirmation in the case file. "
            "The alert is closed as legitimate with no customer impact. Routing: auto."
        ),
    },
    {
        "id": "RULE_R4",
        "category": "rule",
        "rule_id": "R4",
        "title": "No reply within 24 hours",
        "approval_route": "auto/L1",
        "content": (
            "Rule R4. No reply within 24 hours. Recommend MONITOR_CARD (auto) and DECLINE_TRANSACTION (L1) for pending "
            "authorizations. Escalate to human analyst (ESCALATE_TO_ANALYST, auto) if exposure exceeds $500."
        ),
    },
    {
        "id": "RULE_R5",
        "category": "rule",
        "rule_id": "R5",
        "title": "Card testing sequence",
        "approval_route": "L1/auto",
        "content": (
            "Rule R5. Card testing. Three or more small online authorizations (often under $5) on one card within an hour, "
            "followed by a larger purchase: recommend DECLINE_TRANSACTION (L1) and STEP_UP_AUTH (auto). If a purchase over $100 "
            "has already cleared, recommend BLOCK_CARD (L1/L2 depending on exposure). Confirmed by sequence itself."
        ),
    },
    {
        "id": "RULE_R6",
        "category": "rule",
        "rule_id": "R6",
        "title": "Shared origin and connected devices/regions",
        "approval_route": "auto/L2",
        "content": (
            "Rule R6. Shared origin. When several cards show fraud from the same device profile, the same billing region (addr1), "
            "or the same recipient email in one window, name the shared element, recommend CREATE_CASE (auto) and FILE_REPORT (L2), "
            "and MONITOR_CONNECTED_CARDS (auto) for every card that shares it."
        ),
    },
    {
        "id": "RULE_R7",
        "category": "rule",
        "rule_id": "R7",
        "title": "Disputed but legitimate recurring transaction",
        "approval_route": "auto",
        "content": (
            "Rule R7. Disputed but legitimate. When the customer disputes a charge that matches their own recurring pattern "
            "(same merchant, same amount, monthly interval), recommend CREATE_CASE, VERIFY_WITH_CUSTOMER, and WARN_CUSTOMER. "
            "Do not block the card."
        ),
    },
    {
        "id": "RULE_R8",
        "category": "rule",
        "rule_id": "R8",
        "title": "Escalate when uncertain and exposed",
        "approval_route": "auto",
        "content": (
            "Rule R8. Escalate when uncertain and exposed. If the verdict is uncertain and exposure exceeds $500, or the evidence "
            "conflicts, recommend ESCALATE_TO_ANALYST (auto). Hand the case to a human analyst with graph evidence."
        ),
    },
    {
        "id": "RULE_R9",
        "category": "rule",
        "rule_id": "R9",
        "title": "Undocumented patterns",
        "approval_route": "auto/L2",
        "content": (
            "Rule R9. Undocumented patterns. When activity fits none of the known patterns but the evidence shows coordinated "
            "or repeated abuse across customers, recommend CREATE_CASE (auto), FILE_REPORT (L2), and ESCALATE_TO_ANALYST (auto), "
            "and describe the pattern in your own words. Do not force it into a known category."
        ),
    },
    {
        "id": "RULE_R10",
        "category": "rule",
        "rule_id": "R10",
        "title": "Never block all cards unless compromise confirmed",
        "approval_route": "L2",
        "content": (
            "Rule R10. Never BLOCK_ALL_CARDS unless at least two of the customer's cards show confirmed fraud or the customer's "
            "credentials are confirmed compromised. BLOCK_ALL_CARDS always requires L2 fraud manager approval."
        ),
    },
    {
        "id": "PATTERN_CARD_TESTING",
        "category": "pattern",
        "rule_id": "card_testing",
        "title": "Pattern 1: Card testing",
        "approval_route": "R5",
        "content": (
            "Pattern 1. Card testing. A stolen card number is checked before use: three or more tiny online authorizations, "
            "often under $5, then a larger purchase. Confirmed by the sequence itself. Governed by Policy R5."
        ),
    },
    {
        "id": "PATTERN_CNP",
        "category": "pattern",
        "rule_id": "card_not_present_fraud",
        "title": "Pattern 2: Card-not-present fraud",
        "approval_route": "R1-R4",
        "content": (
            "Pattern 2. Card-not-present fraud. The number is used online without the physical card. Amounts and products "
            "that do not fit the cardholder's history, often in a burst of two to four within 48 hours. On its own, one "
            "unusual online purchase is ambiguous: verify before blocking under Policy R1 to R4."
        ),
    },
    {
        "id": "PATTERN_CNP_NEW_DEVICE",
        "category": "pattern",
        "rule_id": "card_not_present_new_device",
        "title": "Pattern 3: Card-not-present fraud from a new device",
        "approval_route": "R1-R4",
        "content": (
            "Pattern 3. Card-not-present fraud from a new device. Same as Pattern 2, with the identity record marking the device "
            "as New (id_15) for this account, sometimes behind a proxy. Stronger signal than pattern 2, but still requires "
            "verification because customers purchase new phones and computers."
        ),
    },
    {
        "id": "PATTERN_OUT_OF_REGION",
        "category": "pattern",
        "rule_id": "out_of_region_use",
        "title": "Pattern 4: Out-of-region use",
        "approval_route": "R2-R3",
        "content": (
            "Pattern 4. Out-of-region use. Card-present purchases in a billing region (addr1) the cardholder has no history in, "
            "while their normal activity continues at home. Several consecutive days of purchases in one new region indicates travel, "
            "not cloning. Governed by Policy R2, R3."
        ),
    },
    {
        "id": "PATTERN_ATO",
        "category": "pattern",
        "rule_id": "account_takeover",
        "title": "Pattern 5: Account takeover",
        "approval_route": "R10",
        "content": (
            "Pattern 5. Account takeover. Mixed-channel activity inconsistent with the cardholder, often with device and match-flag "
            "anomalies, pointing to stolen credentials rather than a stolen card number. Governed by Policy R10."
        ),
    },
    {
        "id": "REG_FINCEN_SAR",
        "category": "regulatory",
        "rule_id": "FINCEN",
        "title": "FinCEN Suspicious Activity Report (SAR) Filing Requirements",
        "approval_route": "L2",
        "content": (
            "FinCEN SAR Filing Standard: A Suspicious Activity Report (FILE_REPORT) is a standalone regulatory filing sent outside "
            "the bank. File when fraud is confirmed or strongly suspected AND at least one applies: exposure > $1,000; activity "
            "connects to a shared device profile or another customer's fraud; or pattern is undocumented/coordinated (R9). "
            "Narrative must answer: WHO (customer, card, device), WHAT happened, WHEN (dates), WHERE (channel, region), HOW it was "
            "carried out, and WHY it is suspicious. Length: 6 to 12 sentences."
        ),
    },
    {
        "id": "REG_FATF_CYBER",
        "category": "regulatory",
        "rule_id": "FATF",
        "title": "FATF Cyber-Enabled Fraud & Muling Typologies",
        "approval_route": "L2",
        "content": (
            "FATF Guidance on Cyber-Enabled Fraud: Recognizes shared digital identifiers (DeviceProfile, IP proxy, screen resolution) "
            "across unrelated bank accounts as an indicator of organized fraud rings and money mule networks. Requires cross-account "
            "graph analysis and protective monitoring of connected instruments."
        ),
    },
]


class GraphRAGIndexer:
    def __init__(self, persist_dir: Path = PERSIST_DIR):
        self.persist_dir = str(persist_dir)
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self._get_or_create_collection()

    def _get_embedding_fn(self):
        openai_key = os.getenv("OPENAI_API_KEY")
        if openai_key:
            try:
                import chromadb.utils.embedding_functions as ef
                return ef.OpenAIEmbeddingFunction(
                    api_key=openai_key,
                    model_name="text-embedding-3-small"
                )
            except Exception:
                pass
        return None

    def _get_or_create_collection(self):
        emb_fn = self._get_embedding_fn()
        kwargs = {"name": COLLECTION_NAME}
        if emb_fn:
            kwargs["embedding_function"] = emb_fn
        return self.client.get_or_create_collection(**kwargs)

    def build_index(self) -> int:
        ids = [chunk["id"] for chunk in POLICY_CHUNKS]
        documents = [chunk["content"] for chunk in POLICY_CHUNKS]
        metadatas = [
            {
                "category": chunk["category"],
                "rule_id": chunk["rule_id"],
                "title": chunk["title"],
                "approval_route": chunk["approval_route"],
            }
            for chunk in POLICY_CHUNKS
        ]

        self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)
        count = self.collection.count()
        update_task("vector_indexer", "completed", {
            "collection": COLLECTION_NAME,
            "indexed_documents": count,
            "storage_path": self.persist_dir,
        })
        return count

    def retrieve_guidance(self, query: str, top_k: int = 3, category: Optional[str] = None) -> List[Dict[str, Any]]:
        where_filter = {"category": category} if category else None
        results = self.collection.query(
            query_texts=[query],
            n_results=top_k,
            where=where_filter,
        )

        formatted = []
        if results and results.get("ids") and results["ids"][0]:
            for i in range(len(results["ids"][0])):
                formatted.append({
                    "id": results["ids"][0][i],
                    "content": results["documents"][0][i],
                    "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                    "distance": results["distances"][0][i] if results.get("distances") else 0.0,
                })
        return formatted


def get_graphrag_retriever() -> GraphRAGIndexer:
    indexer = GraphRAGIndexer()
    if indexer.collection.count() == 0:
        indexer.build_index()
    return indexer


if __name__ == "__main__":
    print("Building GraphRAG vector index...")
    indexer = GraphRAGIndexer()
    total = indexer.build_index()
    print(f"[OK] Indexed {total} policy, pattern, and regulatory documents.")

    sample_query = "three micro authorizations under 5 dollars followed by large charge"
    print(f"\nTest retrieval for query: '{sample_query}'")
    hits = indexer.retrieve_guidance(sample_query, top_k=2)
    for hit in hits:
        print(f"  [{hit['id']}] {hit['metadata']['title']} (dist: {hit['distance']:.4f})")
        print(f"    {hit['content'][:120]}...\n")
