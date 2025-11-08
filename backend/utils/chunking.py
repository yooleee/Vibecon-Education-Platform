from typing import List
import re


def chunk_text(text: str, max_tokens: int = 800, overlap: int = 100) -> List[str]:
    """
    Split text into chunks of approximately max_tokens
    
    Args:
        text: Input text to chunk
        max_tokens: Maximum tokens per chunk (approximate)
        overlap: Number of tokens to overlap between chunks
    
    Returns:
        List of text chunks
    """
    # Rough approximation: 1 token ≈ 4 characters
    max_chars = max_tokens * 4
    overlap_chars = overlap * 4
    
    # Split by sentences
    sentences = re.split(r'(?<=[.!?])\s+', text)
    
    chunks = []
    current_chunk = []
    current_length = 0
    
    for sentence in sentences:
        sentence_length = len(sentence)
        
        if current_length + sentence_length > max_chars and current_chunk:
            # Save current chunk
            chunks.append(' '.join(current_chunk))
            
            # Start new chunk with overlap
            # Keep last few sentences for context
            overlap_sentences = []
            overlap_len = 0
            for s in reversed(current_chunk):
                if overlap_len + len(s) <= overlap_chars:
                    overlap_sentences.insert(0, s)
                    overlap_len += len(s)
                else:
                    break
            
            current_chunk = overlap_sentences
            current_length = overlap_len
        
        current_chunk.append(sentence)
        current_length += sentence_length
    
    # Add last chunk
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks
