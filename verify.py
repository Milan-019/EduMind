import sys
sys.path.append('.')
from routers.auth import make_token
import urllib.request
import json
token = make_token(1)

req2 = urllib.request.Request('http://127.0.0.1:8000/planner/generate', data=b'{"exam_date":"2026-05-01"}', headers={'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json'})
try:
    print(urllib.request.urlopen(req2).read().decode())
except Exception as e:
    print('Planner Err:', getattr(e, 'code', 'Unknown'), e.read().decode() if hasattr(e, 'read') else str(e))
