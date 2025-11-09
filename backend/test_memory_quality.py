"""
Comprehensive Memory Quality Testing for V2 Conversation System

Tests conversation memory across multiple complexity levels
"""

import asyncio
import httpx
import json
from typing import List, Dict, Tuple
from datetime import datetime


class MemoryQualityTester:
    def __init__(self, backend_url: str, lecture_id: str):
        self.backend_url = backend_url
        self.lecture_id = lecture_id
        self.session_id = None
        self.conversation_history = []
        
    async def initialize_session(self) -> bool:
        """Create a V2 session"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/api/v2/session/start",
                    json={"lecture_id": self.lecture_id, "language": "en"}
                )
                if response.status_code == 200:
                    self.session_id = response.json()["session_id"]
                    print(f"✅ Session created: {self.session_id}")
                    return True
                else:
                    print(f"❌ Session creation failed: {response.status_code}")
                    return False
        except Exception as e:
            print(f"❌ Error creating session: {e}")
            return False
    
    async def ask_question(self, question: str) -> Tuple[bool, str, Dict]:
        """Ask a question and get response"""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.backend_url}/api/v2/graph/query",
                    json={"session_id": self.session_id, "question": question}
                )
                
                if response.status_code == 200:
                    data = response.json()
                    answer = data["answer"]
                    self.conversation_history.append({
                        "question": question,
                        "answer": answer,
                        "timestamp": datetime.now().isoformat()
                    })
                    return True, answer, data
                else:
                    return False, f"Error {response.status_code}", {}
        except Exception as e:
            return False, str(e), {}
    
    def check_answer_contains(self, answer: str, expected_terms: List[str]) -> Tuple[bool, str]:
        """Check if answer contains expected terms"""
        answer_lower = answer.lower()
        missing = [term for term in expected_terms if term.lower() not in answer_lower]
        
        if not missing:
            return True, "✅ All expected terms found"
        else:
            return False, f"❌ Missing terms: {missing}"
    
    def check_context_reference(self, answer: str, previous_concept: str) -> Tuple[bool, str]:
        """Check if answer references a previous concept"""
        answer_lower = answer.lower()
        concept_lower = previous_concept.lower()
        
        # Check for direct mention
        if concept_lower in answer_lower:
            return True, f"✅ Directly references '{previous_concept}'"
        
        # Check for synonyms/related terms
        related_keywords = ["mentioned", "discussed", "talked about", "earlier", "previous", "before"]
        if any(keyword in answer_lower for keyword in related_keywords):
            return True, f"✅ References prior context with keywords"
        
        return False, f"❌ No clear reference to '{previous_concept}'"
    
    async def run_test_suite(self):
        """Run comprehensive memory quality tests"""
        print("\n" + "="*80)
        print("CONVERSATION MEMORY QUALITY TEST SUITE")
        print("="*80 + "\n")
        
        if not await self.initialize_session():
            print("❌ Cannot proceed without session")
            return
        
        # Test Level 1: Direct Follow-ups
        print("\n📋 TEST LEVEL 1: Direct Follow-ups (Basic)")
        print("-" * 80)
        
        success, answer1, _ = await self.ask_question("What is machine learning?")
        if success:
            print(f"Q1: What is machine learning?")
            print(f"A1: {answer1[:100]}...")
            
            success, answer2, _ = await self.ask_question("Can you explain that in simpler terms?")
            if success:
                print(f"\nQ2: Can you explain that in simpler terms?")
                print(f"A2: {answer2[:100]}...")
                
                # Validation: Should reference machine learning
                valid, msg = self.check_context_reference(answer2, "machine learning")
                print(f"\n{msg}")
                print(f"Level 1 Status: {'PASS ✅' if valid else 'FAIL ❌'}")
        
        await asyncio.sleep(2)
        
        # Test Level 2: Multi-turn with Ordinal References
        print("\n\n📋 TEST LEVEL 2: Multi-turn with Ordinal References (Intermediate)")
        print("-" * 80)
        
        success, answer1, _ = await self.ask_question("What are the three main types of machine learning?")
        if success:
            print(f"Q1: What are the three main types of machine learning?")
            print(f"A1: {answer1[:150]}...")
            
            success, answer2, _ = await self.ask_question("Can you explain the first type in more detail?")
            if success:
                print(f"\nQ2: Can you explain the first type in more detail?")
                print(f"A2: {answer2[:150]}...")
                
                # Validation: Should mention supervised learning
                valid, msg = self.check_answer_contains(answer2, ["supervised"])
                print(f"\n{msg}")
                
                success, answer3, _ = await self.ask_question("What about the second type?")
                if success:
                    print(f"\nQ3: What about the second type?")
                    print(f"A3: {answer3[:150]}...")
                    
                    # Validation: Should mention unsupervised learning
                    valid2, msg2 = self.check_answer_contains(answer3, ["unsupervised"])
                    print(f"\n{msg2}")
                    print(f"Level 2 Status: {'PASS ✅' if (valid and valid2) else 'FAIL ❌'}")
        
        await asyncio.sleep(2)
        
        # Test Level 3: Deep Context References
        print("\n\n📋 TEST LEVEL 3: Deep Context References (Advanced)")
        print("-" * 80)
        
        success, answer1, _ = await self.ask_question("Give me an example of supervised learning")
        if success:
            print(f"Q1: Give me an example of supervised learning")
            print(f"A1: {answer1[:150]}...")
            
            # Extract key concept from first answer for later reference
            example_keywords = ["example", "cat", "dog", "image", "label"]
            
            success, answer2, _ = await self.ask_question("How does unsupervised learning differ?")
            if success:
                print(f"\nQ2: How does unsupervised learning differ?")
                print(f"A2: {answer2[:150]}...")
                
                success, answer3, _ = await self.ask_question("Compare the example from my first question with unsupervised learning")
                if success:
                    print(f"\nQ3: Compare the example from my first question with unsupervised learning")
                    print(f"A3: {answer3[:150]}...")
                    
                    # Validation: Should reference the example
                    valid, msg = self.check_context_reference(answer3, "example")
                    print(f"\n{msg}")
                    print(f"Level 3 Status: {'PASS ✅' if valid else 'FAIL ❌'}")
        
        await asyncio.sleep(2)
        
        # Test Level 4: Pronouns and Ambiguous References
        print("\n\n📋 TEST LEVEL 4: Pronouns and Ambiguous References (Expert)")
        print("-" * 80)
        
        success, answer1, _ = await self.ask_question("What is clustering in machine learning?")
        if success:
            print(f"Q1: What is clustering in machine learning?")
            print(f"A1: {answer1[:150]}...")
            
            success, answer2, _ = await self.ask_question("Where is it used?")
            if success:
                print(f"\nQ2: Where is it used?")
                print(f"A2: {answer2[:150]}...")
                
                # Validation: Should understand "it" = clustering
                valid, msg = self.check_context_reference(answer2, "clustering")
                print(f"\n{msg}")
                
                success, answer3, _ = await self.ask_question("Can you give me more details about that?")
                if success:
                    print(f"\nQ3: Can you give me more details about that?")
                    print(f"A3: {answer3[:150]}...")
                    
                    # Validation: Should still reference clustering context
                    valid2, msg2 = self.check_context_reference(answer3, "clustering")
                    print(f"\n{msg2}")
                    print(f"Level 4 Status: {'PASS ✅' if (valid and valid2) else 'FAIL ❌'}")
        
        # Get final conversation history from MongoDB
        print("\n\n📊 MEMORY PERSISTENCE CHECK")
        print("-" * 80)
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_url}/api/v2/session/{self.session_id}"
                )
                if response.status_code == 200:
                    data = response.json()
                    message_count = data["conversation"]["message_count"]
                    expected_count = len(self.conversation_history) * 2  # Q+A pairs
                    
                    print(f"Expected messages: {expected_count}")
                    print(f"Stored in MongoDB: {message_count}")
                    print(f"Persistence Status: {'PASS ✅' if message_count >= expected_count else 'FAIL ❌'}")
        except Exception as e:
            print(f"❌ Could not check MongoDB: {e}")
        
        print("\n" + "="*80)
        print("TEST SUITE COMPLETE")
        print("="*80)
        print(f"\nTotal Questions Asked: {len(self.conversation_history)}")
        print(f"Session ID: {self.session_id}")
        print("\nReview the results above to assess memory quality.")
        print("Look for:")
        print("  - Correct interpretation of pronouns (it, that, this)")
        print("  - References to specific prior turns")
        print("  - Understanding of ordinal references (first, second, third)")
        print("  - Persistence of all messages in MongoDB")


async def main():
    # Configuration
    BACKEND_URL = "http://localhost:8001"
    LECTURE_ID = "1695f54f-63c1-4080-bf7f-4cff58704315"  # Test lecture from Phase 1
    
    tester = MemoryQualityTester(BACKEND_URL, LECTURE_ID)
    await tester.run_test_suite()


if __name__ == "__main__":
    asyncio.run(main())
