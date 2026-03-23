import sys
from youtube_transcript_api import YouTubeTranscriptApi

api = YouTubeTranscriptApi()
try:
    transcript = api.fetch('dQw4w9WgXcQ')
    print(transcript)
    for entry in transcript:
        print(entry)
        break
except Exception as e:
    import traceback
    traceback.print_exc()
