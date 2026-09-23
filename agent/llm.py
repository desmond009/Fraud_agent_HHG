import os
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-3.6-flash"

_genai_client = None

if GEMINI_API_KEY:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        _genai_client = genai.GenerativeModel(MODEL_NAME)
    except Exception:
        _genai_client = None


def generate_llm_text(prompt: str, default_fallback: str = "") -> str:
    if not _genai_client:
        return default_fallback
    try:
        resp = _genai_client.generate_content(prompt)
        if resp and resp.text:
            return resp.text.strip()
    except Exception:
        pass
    return default_fallback


def generate_sar_narrative(case_id: str, customer_id: str, cards: List[str],
                           amounts: float, dates: List[str], channel: str,
                           pattern: str, summary: str, claims: List[str]) -> str:
    claim_text = "; ".join(claims[:4]) if claims else "Unrecognized transactions detected."
    prompt = f"""
You are a senior banking anti-money laundering and fraud compliance analyst drafting an official FinCEN Suspicious Activity Report (SAR) narrative.
Draft a concise, professional narrative (6 to 12 sentences) that strictly answers:
1. WHO: Customer {customer_id}, card(s) {', '.join(cards)}.
2. WHAT: Unauthorized activity matching pattern '{pattern}', totaling ${amounts:.2f}.
3. WHEN: Date range from {dates[0]} to {dates[1]}.
4. WHERE: Channel '{channel}' and associated billing/network environments.
5. HOW: Method of compromise and sequence observed ({claim_text}).
6. WHY: Why this activity is suspicious, how it deviates from cardholder baseline, and actions taken (card blocked, connected cards monitored).

Narrative:
"""
    fallback = (
        f"Between {dates[0]} and {dates[1]}, customer {customer_id} card(s) {', '.join(cards)} experienced unauthorized "
        f"activity totaling ${amounts:.2f} conducted via the {channel} channel. The transactions were identified under the "
        f"{pattern} fraud typology, exhibiting abnormal volume and velocity inconsistent with historical cardholder profile. "
        f"{claim_text}. The customer was contacted and unauthorized use was confirmed. The compromised card has been blocked "
        f"and scheduled for reissue. Connected cards and devices have been placed under elevated risk monitoring."
    )
    return generate_llm_text(prompt, default_fallback=fallback)


def generate_case_summary(pattern: str, trigger_text: str, verdict: str,
                          exposure: float, claims: List[str]) -> str:
    claim_str = " ".join(claims[:3]) if claims else ""
    prompt = f"""
Write a 2 to 4 sentence executive fraud investigation summary for an internal analyst review.
Case Details:
- Trigger: {trigger_text}
- Verdict: {verdict}
- Pattern: {pattern}
- Exposure: ${exposure:.2f}
- Key Evidence: {claim_str}

Summary:
"""
    fallback = (
        f"Investigation initiated via {trigger_text}. Conclusion reached: {verdict} under {pattern} typology "
        f"with total exposure of ${exposure:.2f}. Key findings: {claim_str}"
    )
    return generate_llm_text(prompt, default_fallback=fallback)
