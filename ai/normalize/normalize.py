import openai

openai.api_key = "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"

SYSTEM_PROMPT = """
Extract atomic, verifiable technical facts.
Rules:
- No opinions
- No advice
- One fact per line
- Include version or date if present
"""

def normalize(text, source):
    response = openai.ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text}
        ],
        temperature=0
    )

    facts = response.choices[0].message.content.splitlines()
    return [{"fact": f, "source": source} for f in facts if f.strip()]
