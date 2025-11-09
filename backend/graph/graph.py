"""Main LangGraph conversation orchestration"""
from langgraph.graph import StateGraph, END
from graph.state import ConversationState
from graph.nodes import retrieve_node, reason_node, persist_node


def create_conversation_graph():
    """Create the conversation processing graph"""
    
    # Initialize graph
    workflow = StateGraph(ConversationState)
    
    # Add nodes
    workflow.add_node("retrieve", retrieve_node)
    workflow.add_node("reason", reason_node)
    workflow.add_node("persist", persist_node)
    
    # Define edges
    workflow.set_entry_point("retrieve")
    workflow.add_edge("retrieve", "reason")
    workflow.add_edge("reason", "persist")
    workflow.add_edge("persist", END)
    
    # Compile graph
    app = workflow.compile()
    
    return app
