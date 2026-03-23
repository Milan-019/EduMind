
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound

def extract_video_id(url: str) -> str:
    """Extract video ID from any YouTube URL format."""
    patterns = [
        r"v=([a-zA-Z0-9_-]{11})",        # youtube.com/watch?v=xxx
        r"youtu\.be/([a-zA-Z0-9_-]{11})", # youtu.be/xxx
        r"embed/([a-zA-Z0-9_-]{11})",     # youtube.com/embed/xxx
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError("Could not extract video ID from URL. Please check the URL.")


def get_transcript(video_id: str) -> str:
    """Fetch transcript — tries English first, then any available language."""
    api = YouTubeTranscriptApi()
    try:
        transcript = api.fetch(video_id, languages=["en"])
    except Exception:
        # Try any available transcript
        try:
            transcript_list = api.list(video_id)
            transcript = next(iter(transcript_list)).fetch()
        except:
            raise ValueError("This video has transcripts disabled. Try a different video.")

    # Join all text chunks into one string
    full_text = " ".join([entry.text for entry in transcript])
    return full_text


def generate_structured_notes(transcript: str, _call_fn) -> dict:
    """Send transcript to Gemini and get structured study notes back."""

    # Trim transcript to avoid token limits — first 8000 chars is enough
    trimmed = transcript[:8000]

    prompt = f"""You are an expert educational content processor for JEE/NEET students.

A student has shared this YouTube video transcript. Convert it into structured study notes.

TRANSCRIPT:
{trimmed}

Generate comprehensive study notes in the following JSON format.
Return ONLY valid JSON, no markdown, no extra text:
{{
  "title": "Inferred topic/title of the video",
  "subject": "Physics / Chemistry / Biology / Maths / Other",
  "summary": "3-4 sentence overview of what this video covers",
  "key_concepts": [
    {{
      "concept": "Concept name",
      "explanation": "Clear explanation in 2-3 lines",
      "example": "Relevant example if mentioned"
    }}
  ],
  "important_formulas": [
    {{
      "name": "Formula name",
      "formula": "The formula in plain text or LaTeX",
      "usage": "When to apply this formula"
    }}
  ],
  "key_points": [
    "Important point 1",
    "Important point 2",
    "Important point 3"
  ],
  "exam_relevance": "How this topic is tested in JEE/NEET — common question types",
  "quick_revision": "5-line revision summary a student can read in 30 seconds"
}}"""

    try:
        raw = _call_fn(prompt)
    except Exception as e:
        print(f"Fallback due to Gemini Error: {e}")
        return {
            "title": "API Limit Reached",
            "subject": "System Warning",
            "summary": "You have exhausted your free-tier Gemini API quota. The AI cannot summarize this video right now.",
            "key_points": ["Wait for quota to reset (usually 24hrs)", "Or configure a dedicated API Key"],
            "key_concepts": [{"concept": "Resource Exhausted", "explanation": "Google restricts API bursts on the free tier."}],
            "important_formulas": [],
            "exam_relevance": "N/A",
            "quick_revision": "Wait for API reset."
        }

    # Clean and parse JSON
    import re, json
    clean = re.sub(r"```json|```", "", raw).strip()
    try:
        return json.loads(clean)
    except:
        # If JSON parsing fails return raw as summary
        return {
            "title":      "Video Notes",
            "summary":    raw,
            "key_points": [],
            "key_concepts": [],
            "important_formulas": [],
            "quick_revision": raw[:500]
        }


def translate_to_hindi(text: str, _call_fn) -> str:
    """Translate summary to Hindi using Gemini."""
    prompt = f"""Translate the following educational content to Hindi.
Keep technical terms (like Newton, DNA, Integration) in English.
Write in simple Hindi that a student can easily understand.

Content to translate:
{text}

Return only the Hindi translation, nothing else."""
    return _call_fn(prompt)