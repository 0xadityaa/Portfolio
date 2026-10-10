---
title: 'Do You Really Need AI Agents?'
publishedAt: '2025-03-30'
summary: 'Usually not. Most LLM features are cheaper, faster, and easier to trust as a fixed workflow. Here''s when an agent earns its keep.'
tags:
  - llm
  - ai
  - agents
  - workflows
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

Whether you work with LLMs or not, you've heard "agent" and "agentic AI" about four thousand times by now. After months of building projects (hobby ones and production ones), eating a ton of content, and working daily with agentic frameworks like [LangGraph](https://langchain-ai.github.io/langgraph/) and [Google Vertex AI](https://cloud.google.com/vertex-ai?hl=en), I have some thoughts.

The short answer to the title: **usually not. Most of what gets built as an agent would be cheaper, faster, and easier to trust as a fixed workflow. An agent should have to earn its spot with a measured result.**

## The short version

Agents are great when a task needs adaptability: messy inputs, lots of steps you can't predict, automation at scale. They're also wildly overused. For simple, predictable jobs, a workflow or even a single LLM call is more efficient and more reliable. So start with the boring solution, measure it, and bring in an agent only when the extra complexity clearly pays for itself.

## Why is everyone so hyped about agents?

LLMs opened up automation that old-school algorithms couldn't touch. They can reason through a problem on the fly, so naturally every dev and every company wants that in their product, automating the repetitive stuff like updating docs or reviewing PRs. Even coding is semi-automated now, which backs up what OpenAI, Anthropic, and Google have been saying about LLMs handling the small stuff.

Agentic AI wants to take that all the way and automate the whole process. As a software engineer, I get the urge. But the hype also brought a lot of FOMO, and now agents get thrown at problems a much simpler solution would handle. It's like using a bazooka to kill a fly.

## Workflows vs agents: what's the difference?

I use the split Anthropic draws in [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): in a workflow, your code decides the path. In an agent, the model does.

### Workflows

A workflow is a predefined sequence. The LLM follows the code path you wrote, so it's predictable and structured. Every step has a clear goal.

Say a user sends a message. A workflow could classify it as "query", "complaint", "feedback", or "information", then send back the matching predefined response. Perfect when consistency matters more than flexibility.

![ai workflow](/images/blog/ai-workflow.png)

### Agents

An agent is more free-range. It doesn't follow a set path. It decides, step by step, how to find and use information. That makes it non-deterministic: it adapts to the context and to whatever tools it has.

So where the workflow just classifies the message, an agent might go poke around several data sources, combine what it finds, and write a tailored answer. Powerful for complex tasks, and also a lot harder to predict and control.

![ai agent](/images/blog/ai-agent.png)

## When should you use an agent?

When small time savings add up. Take expense reports: an agent can scan receipts, categorise expenses, and build the report. A person spends several minutes per receipt on that. Multiply by hundreds of reports and the manual work mostly disappears.

Agents also shine when you need flexibility and lots of decisions that can't be scripted ahead of time. Just know the deal you're making: you pay in cost and latency to get better results on the task. Only take that deal when it's worth it.

## When should you NOT use an agent?

When the inputs are so ambiguous that you can't verify the output. Think automated legal contract review, where the nuance of language and intent needs a human expert. Or generating personalised investment strategies, where subjective judgment is the whole game. In cases like that, a small misread turns into an expensive mistake.

If the task needs strict reliability, a workflow is the better pick, because predictability and consistency are what get you there. And for a lot of apps, one well-tuned LLM call with [retrieval](https://en.wikipedia.org/wiki/Retrieval-augmented_generation) and a few in-context examples gets the job done without any of the extra machinery.

## Where I'd stop trusting this post

**I wrote this in March 2025, and models have moved since.** Things that needed a carefully scripted workflow back then can go to a single capable model call now, and agents fail less often than they used to. The line between "workflow" and "agent" shifts with every model generation. Treat my examples as dated and the method as the part that lasts.

**The best case for going agent-first** is that a workflow encodes how you understand the task today, and you pay to rewrite it every time the task shifts. For open-ended work like coding or research, where you can't list the steps up front, starting with an agent is the honest design. Anthropic's guide carves out the same exception.

**I didn't put numbers on any of this.** The cost and latency trade-off is stated, not measured. A fair version of this post would run one task both ways and report tokens, seconds, and error rate.

## The takeaway

My prediction when I wrote this: 2025 would be the year we go from "agentic" to "multi-agent" systems, with several specialised agents working together on complex workflows. Exciting stuff. It's also a great way to pile on complexity and cost if you're not measuring at every step.

My rule: write the task as a single prompt first. Then as a fixed workflow. Reach for an agent only when you can point at the exact step where a fixed path fails, and you have an eval showing the agent does better.
