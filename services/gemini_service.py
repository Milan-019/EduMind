import os
import json
import re

from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

_client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])


import time

def _call(prompt: str) -> str:
    models_to_try = [
        "gemini-2.0-flash",
        "gemini-2.5-flash",
        "gemini-2.0-flash-001",
    ]
    
    last_err = None
    for attempt, model_name in enumerate(models_to_try):
        try:
            response = _client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.4,
                    max_output_tokens=8192,
                ),
            )
            return response.text.strip()
        except Exception as e:
            last_err = e
            if attempt == len(models_to_try) - 1:
                print(f" [CRITICAL] All fallback models failed. Last error: {e}")
                raise last_err
            else:
                print(f"Limit or error hit on {model_name}, switching to backup...")
                continue


def _extract_json(text: str):
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        text = fence.group(1).strip()
    else:
        start_obj = text.find('{')
        start_arr = text.find('[')
        start = -1
        if start_obj != -1 and start_arr != -1:
            start = min(start_obj, start_arr)
        else:
            start = max(start_obj, start_arr)
            
        if start != -1:
            end_obj = text.rfind('}')
            end_arr = text.rfind(']')
            end = max(end_obj, end_arr)
            if end != -1:
                text = text[start:end+1]
                
    try:
        return json.loads(text)
    except Exception as e:
        print(f"JSON extract failed. Cleaned text: {text}")
        raise e


def tutor_answer(question: str, context_chunks: list[str]) -> str:
    if not context_chunks:
        context_block = "No study material has been uploaded yet."
    else:
        context_block = "\n\n---\n\n".join(context_chunks)

    prompt = f"""You are EduMind, an expert AI tutor. Answer the student's question 
using the provided study material context below.

Rules:
- Be clear, concise and educational.
- If the answer is not in the context, say: "This topic isn't covered in your uploaded material. Here's what I know generally:" and then answer from general knowledge.
- Use bullet points or numbered steps where helpful.
- Format math expressions in LaTeX using $...$ for inline and $$...$$ for block.

--- STUDY MATERIAL CONTEXT ---
{context_block}
--- END CONTEXT ---

Student's question: {question}

Answer:"""

    try:
        return _call(prompt)
    except Exception as e:
        print(f"Fallback due to Gemini Error: {e}")
        return "I apologize, but your Gemini Free-Tier API limit has been exceeded. Please upgrade your API key or wait until the quota resets to continue asking questions!"


def generate_quiz(topic: str, context_chunks: list[str], num_questions: int = 5) -> list[dict]:
    if not context_chunks:
        context_block = "Use general knowledge about the topic."
    else:
        context_block = "\n\n---\n\n".join(context_chunks)

    prompt = f"""You are an expert exam question writer. Generate exactly {num_questions} 
multiple choice questions about "{topic}" based on the study material below.

Rules:
- Each question must have exactly 4 options labeled A, B, C, D.
- Only one option is correct.
- Include a brief explanation for why the correct answer is right.
- Vary difficulty: mix easy, medium, and hard questions.

--- STUDY MATERIAL CONTEXT ---
{context_block}
--- END CONTEXT ---

Respond with ONLY a valid JSON array, no other text. Format:
[
  {{
    "question": "Question text here?",
    "options": ["A. option1", "B. option2", "C. option3", "D. option4"],
    "answer": "A",
    "explanation": "Brief explanation of why A is correct."
  }}
]"""

    for attempt in range(3):
        try:
            raw = _call(prompt)
            questions = _extract_json(raw)
            break
        except Exception as e:
            if attempt == 2:
                print(f"Fallback due to Gemini Error: {e}")
                questions = [{
                    "question": "The Gemini API rate limit has been reached. What should you do?",
                    "options": ["A. Panic", "B. Wait for the quota to reset", "C. Upgrade your API Key", "D. Both B and C"],
                    "answer": "D",
                    "explanation": "Google's free-tier Gemini API has strict rate limits. Please try again tomorrow or provide a new API key to continue generating unlimited quizzes."
                }]

    validated = []
    for q in questions:
        if isinstance(q, dict) and all(k in q for k in ("question", "options", "answer", "explanation")):
            if len(q["options"]) == 4:
                validated.append(q)
    return validated


def generate_planner(
    subject: str,
    context_chunks: list[str],
    weak_areas: list[str],
    available_days: int,
    hours_per_day: float,
) -> dict:
    if not context_chunks:
        context_block = "Use standard curriculum for this subject."
    else:
        context_block = "\n\n---\n\n".join(context_chunks)

    weak_areas_str = ", ".join(weak_areas) if weak_areas else "none identified yet"

    prompt = f"""You are an expert study coach. Create a personalised {available_days}-day 
study plan for a student studying "{subject}".

Student profile:
- Available: {hours_per_day} hours per day for {available_days} days
- Known weak areas: {weak_areas_str}
- Prioritise weak areas but cover all important topics.

Rules:
- Spread topics logically (foundations first, then advanced).
- Give extra time to weak areas.
- Each day should be realistic for {hours_per_day} hours.

--- STUDY MATERIAL CONTEXT ---
{context_block}
--- END CONTEXT ---

Respond with ONLY valid JSON, no other text. Format:
{{
  "summary": "One sentence overview of the plan.",
  "schedule": [
    {{
      "day": 1,
      "date_label": "Day 1",
      "topics": ["Topic A", "Topic B"],
      "focus": "Short focus label",
      "duration_hours": {hours_per_day},
      "resources": "Relevant sections from uploaded material"
    }}
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}}"""

    for attempt in range(3):
        raw = _call(prompt)
        try:
            return _extract_json(raw)
        except Exception:
            if attempt == 2:
                return {"summary": "Failed to generate plan securely.", "schedule": []}


def explain_weak_areas(weak_areas: list[str], context_chunks: list[str]) -> str:
    if not weak_areas:
        return "No weak areas identified yet. Keep taking quizzes!"

    context_block = "\n\n---\n\n".join(context_chunks) if context_chunks else ""

    prompt = f"""A student is struggling with these topics: {', '.join(weak_areas)}.

{'Using the study material context below, provide:' if context_block else 'Provide:'}
1. A brief explanation of why each topic is commonly difficult.
2. A 3-step approach to master each topic.
3. One quick memory trick or analogy for each.

{'--- STUDY MATERIAL CONTEXT ---' if context_block else ''}
{context_block}
{'--- END CONTEXT ---' if context_block else ''}

Be encouraging, practical and concise. Use bullet points."""

    try:
        return _call(prompt)
    except Exception as e:
        print(f"Fallback due to Gemini Error: {e}")
        return "⚠️ You have reached your Gemini API free-tier limit. Study Insights cannot be generated right now. Check back tomorrow!"