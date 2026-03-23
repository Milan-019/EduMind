from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routers.auth import get_current_user
from services.youtube_services import (
    extract_video_id,
    get_transcript,
    generate_structured_notes,
    translate_to_hindi
)
from services.gemini_service import _call

router = APIRouter(tags=["Multimodal Content Processor"])

class YouTubeRequest(BaseModel):
    url:             str
    translate_hindi: bool = False  # optional Hindi translation

@router.post("/youtube")
def process_youtube(req: YouTubeRequest, user=Depends(get_current_user)):
    """
    Takes a YouTube URL and returns structured study notes.
    Optionally translates the summary to Hindi.
    """

    # Step 1 — Extract video ID
    try:
        video_id = extract_video_id(req.url)
    except ValueError as e:
        raise HTTPException(400, str(e))

    # Step 2 — Get transcript
    try:
        transcript = get_transcript(video_id)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, f"Could not fetch transcript: {str(e)}")

    if not transcript or len(transcript) < 100:
        raise HTTPException(422, "Transcript too short to generate notes.")

    # Step 3 — Generate structured notes via Gemini
    try:
        notes = generate_structured_notes(transcript, _call)
    except Exception as e:
        raise HTTPException(500, f"Note generation failed: {str(e)}")

    # Step 4 — Optional Hindi translation
    hindi_summary = None
    if req.translate_hindi and notes.get("summary"):
        try:
            hindi_summary = translate_to_hindi(notes["summary"], _call)
        except:
            hindi_summary = "Translation unavailable"

    return {
        "video_id":     video_id,
        "url":          req.url,
        "notes":        notes,
        "hindi_summary": hindi_summary,
        "transcript_length": len(transcript),
        "message":      "Notes generated successfully"
    }


@router.post("/youtube/transcript-only")
def get_raw_transcript(req: YouTubeRequest, user=Depends(get_current_user)):
    """Just returns the raw transcript — useful for debugging."""
    try:
        video_id   = extract_video_id(req.url)
        transcript = get_transcript(video_id)
        return {
            "video_id":   video_id,
            "transcript": transcript[:3000],  # first 3000 chars only
            "total_length": len(transcript)
        }
    except ValueError as e:
        raise HTTPException(400, str(e))