import json
import subprocess
from retriever.search import search
from validator.validate_sources import validate
from normalize.normalize import normalize
from consensus.merge_facts import merge

USER_INPUT = input("What do you need to verify? ")

queries = json.loads(
    subprocess.check_output(
        ["python", "ai/planner/plan_queries.py", USER_INPUT]
    )
)

all_facts = []

for q in queries:
    results = validate(search(q))
    for r in results:
        all_facts.extend(normalize(r["snippet"], r["url"]))

final_facts = merge(all_facts)

output = {
    "topic": USER_INPUT,
    "facts": final_facts
}

with open("ai/facts/latest.json", "w") as f:
    json.dump(output, f, indent=2)

print("Facts written to ai/facts/latest.json")
