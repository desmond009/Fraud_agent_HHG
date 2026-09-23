import sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent.parent))

from langgraph.graph import StateGraph, START, END
from agent.state import InvestigationState
from agent.nodes import (
    trigger_ingestion,
    initial_investigation,
    evidence_synthesis,
    uncertainty_assessment,
    evidence_simulation,
    case_memory_writeback,
)


def build_investigation_graph():
    builder = StateGraph(InvestigationState)

    builder.add_node("trigger_ingestion", trigger_ingestion)
    builder.add_node("initial_investigation", initial_investigation)
    builder.add_node("evidence_synthesis", evidence_synthesis)
    builder.add_node("uncertainty_assessment", uncertainty_assessment)
    builder.add_node("evidence_simulation", evidence_simulation)
    builder.add_node("case_memory_writeback", case_memory_writeback)

    builder.add_edge(START, "trigger_ingestion")
    builder.add_edge("trigger_ingestion", "initial_investigation")
    builder.add_edge("initial_investigation", "evidence_synthesis")
    builder.add_edge("evidence_synthesis", "uncertainty_assessment")
    builder.add_edge("uncertainty_assessment", "evidence_simulation")
    builder.add_edge("evidence_simulation", "case_memory_writeback")
    builder.add_edge("case_memory_writeback", END)

    return builder.compile()


investigation_app = build_investigation_graph()
