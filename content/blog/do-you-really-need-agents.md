---
title: Do you really need AI Agents?
publishedAt: '2025-03-30'
summary: >-
  Most LLM features are better built as a fixed workflow than as an agent. When
  an agent earns its extra cost and latency, and when it does not.
tags:
  - llm
  - ai
  - agents
  - workflows
updated: '2026-10-09'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

![GIF of a robot looking at a screen with a confused expression](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExbzhramtrcGVvMzRnZG15dzBhYW5vMzI1eDl2NjJwc25hdzV1djU1ciZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/1BdJd24oEwvuSvXYb0/giphy.gif)

Whether you've been working with LLMs or not, you've probably heard the terms _"Agent"_ or _"Agentic AI"_ thrown around a lot. After spending months building projects (both hobby and production), consuming a ton of content, and working daily with agentic frameworks like [LangGraph](https://langchain-ai.github.io/langgraph/) and [Google Vertex AI](https://cloud.google.com/vertex-ai?hl=en), I have some thoughts.

The short answer to the title: **usually not. Most of what gets built as an agent would be cheaper, faster, and easier to trust as a fixed workflow, and an agent should have to earn its place with a measured result.**

## TL;DR

AI agents are powerful tools for tasks requiring adaptability and large-scale automation, but they are often overused. They shine in scenarios where flexibility and dynamic decision-making are essential, such as automating complex workflows or handling unpredictable inputs. However, for simpler, more predictable tasks, workflows or single LLM calls are often more efficient and reliable. The key is to start with straightforward solutions, measure their effectiveness, and only introduce agentic systems when the added complexity delivers clear, measurable benefits.

## Why are AI Agents so hyped?

With rapid advancements in generative AI, LLMs are unlocking automation opportunities that were previously impossible with traditional algorithms. Their dynamic reasoning and problem-solving abilities have sparked excitement among developers and companies eager to integrate these capabilities into their software to automate repetitive tasks like updating documentation or reviewing PRs. Even coding has become semi-automated, validating claims from AI giants like OpenAI, Anthropic, and Google about LLMs' potential to assist with trivial tasks. Agentic AI takes this further by aiming to fully automate such processes, which, as a software engineer, I completely understand the urge to pursue. However, this enthusiasm has also led to widespread FOMO, causing AI agents to be applied to problems where simpler solutions would suffice it's _like using a bazooka to kill a fly_.

## Workflows vs Agents what's the difference?

The split I use is the one Anthropic draws in [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents): in a workflow, your code decides the path; in an agent, the model does.

### Workflows

Workflows are predefined sequences where LLMs follow strict code paths, making them predictable and structured. Each step is designed with a clear goal in mind, ensuring that the system operates in a controlled, deterministic way. For example, if a user submits a prompt, a workflow could categorize it into "query," "complaint," "feedback," or "information" and then return a predefined response accordingly. This approach is ideal for cases where consistency and reliability are more important than flexibility.
![ai workflow](/images/blog/ai-workflow.png)

### Agents

Agents, on the other hand, take a more dynamic and flexible approach. Instead of following a predetermined path, they make real-time decisions about how to retrieve and use information iteratively. This makes them non-deterministic, allowing them to adapt based on context and available resources. For instance, rather than simply classifying a user's prompt, an agent might explore multiple data sources, combine relevant information, and construct a tailored response. This makes agents powerful for complex tasks but also introduces challenges in predictability and control.
![ai agent](/images/blog/ai-agent.png)

## When to use Agents?

Using agents make sense when even small time savings provide value, such as automating expense report processing where an AI agent can scan receipts, categorize expenses, and generate a report which is something that would take an employee several minutes per receipt. This automation accumulates over hundreds of reports, significantly reducing manual effort. They also excel when flexibility and large-scale decision-making are crucial, allowing them to adapt dynamically instead of following rigid paths. However, this comes at a cost of trading efficiency and latency for improved performance, so they should only be used when that tradeoff is justified.

## When to NOT use Agents?

Agents are a poor choice when user inputs are too ambiguous, making it hard to verify their outputs, like automating a legal contract review where the nuances of language and intent require human expertise, or trying to generate personalized investment strategies where subjective judgment plays a critical role. In such cases, even minor misinterpretations can lead to costly errors. When tasks require strict reliability, workflows are the better option, predictability and consistency are also key factors to ensure that. For many applications, a well-optimized single LLM call with [retrieval](https://en.wikipedia.org/wiki/Retrieval-augmented_generation) and in-context learning is often sufficient to achieve the desired outcome without unnecessary complexity.

## Where this stops applying

**This was written in March 2025 and models have moved since.** Tasks that needed a carefully scripted workflow then can be handed to a single capable model call now, and agents fail less often than they did. The boundary between "workflow" and "agent" moves every model generation, so treat the examples above as dated and the method as the durable part.

**The strongest case for agents first** is that workflows encode today's understanding of the task, and you pay to rewrite them every time the task shifts. For open-ended work such as coding or research, where you cannot list the steps in advance, starting with an agent is the honest design. Anthropic's guide makes the same carve-out.

**I have not put numbers on it here.** The cost and latency tradeoff is stated, not measured. A fair version of this post would run one task both ways and report tokens, seconds, and error rate.

## Final Thoughts

My prediction when I wrote this: 2025 will be the year we move from _"agentic"_ to _"multi-agent"_ systems, where multiple specialized AI agents collaborate to handle complex workflows efficiently. As exciting as this shift is, it's crucial to measure results at every stage to avoid unnecessary complexity and cost. My decision rule: write the task as a single prompt first, then as a fixed workflow, and reach for an agent only when you can name the step where a fixed path fails and you have an eval that shows the agent doing better.

*Updated 9 October 2026: added a direct answer to the title, the source for the workflow and agent definitions, and the section on where this stops applying.*
