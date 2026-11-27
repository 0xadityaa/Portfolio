"""Generate the invented extraction cases (seeded). Writes cases.jsonl next to this script."""
import json, random, os
rng = random.Random(1231)
FIRST = "Maya Owen Priya Lucas Hana Tomas Imani Felix Noor Declan Sofia Idris Greta Mateo Yuki Amara Jonas Lena Rohan Tessa Viktor Alma Colm Dina Emeka Freya Gabe Ines Jamal".split()
LAST = "Okafor Lindqvist Moreau Banerjee Castillo Nakamura Whitfield Haddad Kowalski Abara Brennan Delgado Ferreira Gallagher Ishikawa Jovanovic Kaplan Larsen Mbeki Novak Osei Petrov Quinn Rahman Sorensen Tanaka Uddin Varga Weber Yilmaz".split()
AGENTS = ["Dana", "Sam", "Priyanka", "Luis", "Chen", "Ada"]
PRODUCTS = ["standing desk", "espresso machine", "wireless earbuds", "yoga mat", "desk lamp", "air fryer", "backpack", "mechanical keyboard", "electric kettle", "bike helmet", "monitor arm", "blender", "tent", "running shoes", "bookshelf", "space heater", "webcam", "ceramic planter", "cast iron pan", "office chair"]
WORDS = {1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight"}
HIGH = ["This is urgent, I need it sorted today.", "I need this fixed by tomorrow morning, it is for an event.", "Please treat this as top priority, ASAP.", "It is urgent: the launch is tomorrow."]
MED = ["Could you sort it out sometime this week?", "A reply in the next few days would be great.", "Let me know what you can do this week.", "I would like this handled within the week."]
LOW = ["There is no rush at all.", "Whenever you get a chance is fine.", "No hurry, any time next month works.", "Take your time, nothing depends on it."]
REFUND = ["I would like my money back.", "Please refund the full amount.", "I want a refund, not a replacement.", "Send the money back to my card."]
REPLACE = ["I would like a replacement.", "Please send a new one instead of a refund.", "I want an exchange, not my money back.", "A replacement unit is all I need."]
PROBLEM = ["arrived with a crack in it", "stopped working after two days", "did not match the photo", "arrived late and the box was crushed", "is missing the power cable", "stopped turning on", "came with the wrong parts"]


def distractors():
    d = [f"Order #{rng.randint(10000, 99999)}."]
    if rng.random() < .6: d.append(f"It cost ${rng.randint(19, 480)}.")
    if rng.random() < .5: d.append(f"It took {rng.randint(2, 6)} weeks to arrive.")
    rng.shuffle(d)
    return d[:rng.choice([1, 2, 3])]


def case(i):
    name = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
    prod = rng.choice(PRODUCTS); qty = rng.randint(1, 8)
    pri = rng.choice(["low", "medium", "high"]); ref = rng.random() < .5
    qs = str(qty) if rng.random() < .5 else WORDS[qty]
    plural = prod + ("s" if qty > 1 else "")
    they = "they" if qty > 1 else "it"
    prob = rng.choice(PROBLEM)
    opening = rng.choice([
        f"I ordered {qs} {plural} and {they} {prob}.",
        f"I bought {qs} {plural} last month and {they} {prob}.",
        f"Writing about the {plural} I got ({qs} in total). {they.capitalize()} {prob}.",
    ])
    sents = [opening] + distractors()
    if rng.random() < .5: sents.append(f"{rng.choice(AGENTS)} from support said to write in.")
    tail = [rng.choice(REFUND if ref else REPLACE), rng.choice({"high": HIGH, "medium": MED, "low": LOW}[pri])]
    rng.shuffle(tail); sents += tail
    sign = rng.choice([f"Regards,\n{name}", f"Thanks,\n{name}", f"- {name}"])
    return {"id": i, "text": " ".join(sents) + "\n" + sign,
            "gold": {"customer": name, "product": prod, "quantity": qty, "priority": pri, "refund": ref}}


cases = [case(i) for i in range(123)]
pool = [case(200 + i) for i in range(60)]
def pick(spec):
    got = []
    for pri, ref in spec:
        c = next(c for c in pool if c["gold"]["priority"] == pri and c["gold"]["refund"] == ref and c not in got)
        got.append(c)
    return got
out = [dict(c, split="shots") for c in pick([("high", True), ("low", False), ("medium", True)])]
out += [dict(c, split="eval") for c in cases[3:]]
out += [dict(c, split="shots_b") for c in pick([("low", True), ("high", False), ("medium", False)])]
with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "cases.jsonl"), "w") as f:
    for c in out: f.write(json.dumps(c) + "\n")
print(len(out))
