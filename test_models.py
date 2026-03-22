import os
from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])

models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro']
for m in models:
    try:
        response = client.models.generate_content(model=m, contents='hello')
        print(f"{m}: OK")
    except Exception as e:
        print(f"{m}: ERROR: {e}")
