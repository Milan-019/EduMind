import sys
import traceback
sys.path.append('.')
from services.youtube_services import get_transcript

try:
    print(get_transcript('dQw4w9WgXcQ')[:100])
except Exception as e:
    print("Caught Exception:", type(e).__name__)
    print("Message:", str(e))
    traceback.print_exc()
