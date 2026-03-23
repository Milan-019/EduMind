import sys
sys.path.append('.')
from routers.auth import make_token
import urllib.request
import json
token = make_token(1)

req = urllib.request.Request(
    'http://127.0.0.1:8000/multimodal/youtube', 
    data=b'{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ", "translate_hindi": false}', 
    headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'}
)
try:
    print(urllib.request.urlopen(req).read().decode())
except Exception as e:
    print('Youtube Err Code:', getattr(e, 'code', 'Unknown'))
    content = e.read().decode() if hasattr(e, 'read') else str(e)
    print('Youtube Err Body:', content)
