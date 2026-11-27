PROMPTS = [
    "Explain what a hash map is in two sentences.",
    "Write a haiku about debugging.",
    "Give me three tips for a first marathon.",
    "Why is the sky blue? Keep it short.",
    "Summarize the plot of Romeo and Juliet in two sentences.",
    "What are the pros and cons of microservices?",
    "Describe a cat to someone who has never seen one.",
    "Write a one-line product description for a reusable water bottle.",
    "What does a load balancer do?",
    "Suggest a name for a coffee shop and say why.",
    "Explain recursion to a ten-year-old.",
    "List four uses for a paperclip.",
    "What is the difference between TCP and UDP?",
    "Write a short apology email for missing a meeting.",
    "How do vaccines work, in plain words?",
    "Give me a mnemonic for the planets.",
    "What should I check before buying a used car?",
    "Explain compound interest with an example.",
    "Write a tweet announcing a new open-source library.",
    "Why do we sleep?",
    "What is a race condition?",
    "Describe the taste of coffee to someone who dislikes it.",
    "Give two reasons to write tests before code.",
    "Explain what DNS does in one paragraph.",
]


TOPICS = [
    "password managers", "index funds", "sourdough bread", "unit tests", "code review",
    "remote work", "git branching", "cold emailing", "learning to swim", "container orchestration",
    "public speaking", "database indexes", "composting", "sleep schedules", "rate limiting",
    "budgeting", "caching", "learning a second language", "home networking", "feature flags",
    "running a meeting", "backups", "photography basics", "debugging production issues", "recycling",
    "onboarding a new hire", "time zones", "reading research papers", "bike maintenance", "API versioning",
    "cooking rice", "technical writing", "houseplants", "two-factor authentication", "stand-up comedy",
    "load testing", "chess openings", "monitoring and alerts", "learning guitar", "pair programming",
    "travel packing", "writing a changelog", "cleaning a laptop", "negotiating salary",
]
TEMPLATES = [
    "Explain {t} in two sentences.",
    "Give me three practical tips about {t}.",
    "What are the most common mistakes people make with {t}?",
    "Write a short, friendly note to a colleague about {t}.",
]
PROMPTS += [tpl.format(t=t) for t in TOPICS for tpl in TEMPLATES]
assert len(PROMPTS) == 200, len(PROMPTS)
