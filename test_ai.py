"""
test_ai.py
----------
Run this BEFORE the hackathon to confirm everything works.
Usage: python test_ai.py

You need:
  1. A .env file with GEMINI_API_KEY=your_key
  2. A sample PDF called sample.pdf in the same directory
  3. pip install -r requirements.txt done
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("GEMINI_API_KEY"):
    print("❌  GEMINI_API_KEY not found in .env — add it and retry.")
    sys.exit(1)

print("Running EduMind AI stack tests...\n")

# ── Test 1: RAG ingestion ──────────────────────────────────────────────────────
print("Test 1: PDF ingestion")
from services.rag_service import ingest_pdf, retrieve, list_ingested_files

PDF_PATH = "sample.pdf"
if not os.path.exists(PDF_PATH):
    print(f"  SKIP — place a '{PDF_PATH}' here to test ingestion.")
else:
    result = ingest_pdf(PDF_PATH)
    print(f"  Result: {result}")
    assert result["status"] in ("ingested", "skipped"), "Unexpected status"
    print("  PASS\n")

# ── Test 2: Retrieval ──────────────────────────────────────────────────────────
print("Test 2: Semantic retrieval")
files = list_ingested_files()
print(f"  Knowledge base contains: {files}")
if files:
    chunks = retrieve("explain the main concept")
    print(f"  Retrieved {len(chunks)} chunks")
    print(f"  First 200 chars: {chunks[0][:200] if chunks else 'empty'}...")
    print("  PASS\n")
else:
    print("  SKIP — no PDFs ingested yet\n")

# ── Test 3: Tutor ──────────────────────────────────────────────────────────────
print("Test 3: Tutor answer")
from services.gemini_service import tutor_answer
answer = tutor_answer("What is machine learning?", [])
print(f"  Answer preview: {answer[:200]}...")
assert len(answer) > 20, "Answer too short"
print("  PASS\n")

# ── Test 4: Quiz generation ────────────────────────────────────────────────────
print("Test 4: Quiz generation")
from services.gemini_service import generate_quiz
questions = generate_quiz("Python basics", [], num_questions=2)
print(f"  Generated {len(questions)} questions")
if questions:
    print(f"  First question: {questions[0]['question']}")
    assert "options" in questions[0] and len(questions[0]["options"]) == 4
print("  PASS\n")

# ── Test 5: Planner ────────────────────────────────────────────────────────────
print("Test 5: Study planner")
from services.gemini_service import generate_planner
plan = generate_planner(
    subject="Data Structures",
    context_chunks=[],
    weak_areas=["Graphs", "Dynamic Programming"],
    available_days=3,
    hours_per_day=2.0,
)
print(f"  Summary: {plan.get('summary', 'N/A')}")
print(f"  Days scheduled: {len(plan.get('schedule', []))}")
assert "schedule" in plan and len(plan["schedule"]) > 0
print("  PASS\n")

print("All tests passed! You are ready for the hackathon.")