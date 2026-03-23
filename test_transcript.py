import sys
sys.path.append('.')
from services.youtube_services import get_transcript

try:
    print(get_transcript('dQw4w9WgXcQ')[:100])
except Exception as e:
    import traceback
    traceback.print_exc()
