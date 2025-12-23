from collections import defaultdict

def merge(extracted_facts):
    counter = defaultdict(int)
    sources = defaultdict(set)

    for fact in extracted_facts:
        counter[fact["fact"]] += 1
        sources[fact["fact"]].add(fact["source"])

    merged = []
    for fact, count in counter.items():
        merged.append({
            "fact": fact,
            "sources": list(sources[fact]),
            "confidence": "high" if count > 1 else "medium"
        })

    return merged
