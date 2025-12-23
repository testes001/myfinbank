import openai
import json
import sys

openai.api_key = "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"

SYSTEM_PROMPT = """
You generate precise technical search queries.
Rules:
- Target official documentation only
- No opinions
- No blogs
- Output JSON array of queries
"""

def plan(user_input: str):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_input}
        ],
        temperature=0
    )

    return json.loads(response.choices[0].message.content)

if __name__ == "__main__":
    queries = plan(sys.argv[1])
    print(json.dumps(queries, indent=2))
