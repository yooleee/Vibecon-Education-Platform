import os
import numpy as np
from scipy.spatial.distance import cosine
from openai import AsyncOpenAI
from dotenv import load_dotenv
from typing import List

load_dotenv()

# Initialize OpenAI client with Emergent LLM key
client = AsyncOpenAI(
    api_key=os.getenv("EMERGENT_LLM_KEY")
)


async def generate_embeddings(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for a list of text chunks using OpenAI
    
    Args:
        texts: List of text strings
    
    Returns:
        List of embedding vectors
    """
    try:
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=texts
        )
        
        embeddings = [item.embedding for item in response.data]
        return embeddings
    
    except Exception as e:
        raise Exception(f"Embedding generation failed: {str(e)}")


def compute_similarity(query_embedding: List[float], doc_embeddings: List[List[float]]) -> List[float]:
    """
    Compute cosine similarity between query and document embeddings
    
    Args:
        query_embedding: Single embedding vector
        doc_embeddings: List of embedding vectors
    
    Returns:
        List of similarity scores (0-1, higher is more similar)
    """
    similarities = []
    for doc_emb in doc_embeddings:
        # Cosine similarity = 1 - cosine distance
        similarity = 1 - cosine(query_embedding, doc_emb)
        similarities.append(similarity)
    
    return similarities
