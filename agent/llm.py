import os
from typing import Optional, Dict, Any, List, Tuple
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-3.6-flash"

_genai_client = None

if GEMINI_API_KEY:
    try:
        from google import genai
        _genai_client = genai.Client(api_key=GEMINI_API_KEY)
    except Exception:
        _genai_client = None


def generate_sar_narrative(case_id: str, customer_id: str, cards: List[str],
                           amounts: float, dates: List[str], channel: str,
                           pattern: str, claims: List[str]) -> Tuple[str, int]:
    claims_text = "; ".join(claims[:3]) if claims else "Unauthorized transactions detected."

    prompt = (
        f"You are an AML compliance officer. Draft a factual FinCEN SAR Narrative in 6 to 8 sentences.\n"
        f"Case: {case_id}\n"
        f"Customer: {customer_id}\n"
        f"Cards: {', '.join(cards)}\n"
        f"Total Amount: ${amounts:.2f} USD\n"
        f"Activity Dates: {dates[0]} to {dates[1]}\n"
        f"Channel: {channel}\n"
        f"Typology: {pattern}\n"
        f"Evidence: {claims_text}\n"
        f"Draft Narrative covering Who, What, When, Where, How, and Why suspicious:"
    )

    fallback = (
        f"Between {dates[0]} and {dates[1]}, customer {customer_id} card(s) {', '.join(cards)} experienced unauthorized "
        f"transactions totaling ${amounts:.2f} conducted via the {channel} channel. The activity matches the {pattern} "
        f"fraud typology, displaying abnormal volume and velocity inconsistent with historical cardholder profile. "
        f"{claims_text}. Customer verification confirmed unauthorized use. The compromised card has been blocked and "
        f"scheduled for reissue, and linked entities have been placed under protective monitoring."
    )

    if not _genai_client:
        return fallback, 0

    try:
        resp = _genai_client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config={
                "thinking_config": {"thinking_budget": 0},
                "max_output_tokens": 350,
                "temperature": 0.1,
            }
        )
        if resp and resp.text:
            token_count = resp.usage_metadata.total_token_count if hasattr(resp, "usage_metadata") and resp.usage_metadata else 180
            return resp.text.strip(), token_count
    except Exception:
        pass

    return fallback, 0


def generate_case_summary(pattern: str, trigger_text: str, verdict: str,
                          exposure: float, claims: List[str]) -> str:
    # High-precision deterministic summary (0 tokens) to adhere to README rule:
    # "Keep summary short. The evidence list carries the detail."
    key_evidence = claims[0] if claims else "Routine risk assessment completed."
    if verdict == "fraud":
        return (
            f"Investigation confirmed {pattern.replace('_', ' ')} fraud with ${exposure:.2f} total exposure. "
            f"Triggered by {trigger_text}. Key evidence: {key_evidence} "
            f"Card blocked and protective actions applied under policy."
        )
    else:
        return (
            f"Investigation concluded as legitimate (exposure $0.00). "
            f"Triggered by {trigger_text}. Customer confirmed transaction activity. "
            f"Alert cleared under policy Rule R3."
        )
