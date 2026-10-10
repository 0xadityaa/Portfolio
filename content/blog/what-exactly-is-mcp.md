---
title: 'What Exactly Is MCP?'
publishedAt: '2025-03-08'
summary: 'MCP is a standard plug for AI tools. Write a tool once and any app that speaks the protocol can use it. What it fixes, and what it costs you.'
tags:
  - llm
  - ai
  - mcp
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

If you hang out in tech corners of LinkedIn, YouTube, or X, your feed has probably been buried in MCP posts. Mine was. So a few days into the noise I decided to actually dig in, and this post is everything I managed to find and understand so far.

My one-line take: **MCP is to AI tools what a common plug is to hardware. It doesn't make a model smarter. It makes a tool you write once usable from every app that speaks the protocol.**

## The short version

[MCP](https://www.anthropic.com/news/model-context-protocol) (Model Context Protocol) is **not** just another API. It's a standard way to hand structured context to AI models. Think USB-C for AI: one plug for data sources, tools, and workflows.

Why does that matter? Because models are often context-blind. They struggle to use real-world information well. MCP helps by bridging data silos, tightening up security, and making integrations reusable across models. For devs, that means less glue code, faster builds, and setups that don't break every time you swap a model.

## What's the big deal?

Lots of people assume MCP is one more API. If you're picturing REST endpoints and JSON payloads, think bigger. MCP is a protocol that gives a model proper context about the tools it has, then lets the model's own reasoning decide which tool it needs and when.

### Why does context matter so much?

Today's models are seriously capable, but they trip up when they don't have the right context. In frameworks like LangChain, we handled that by giving models tools and teaching them when and how to use each one. MCP goes a step further and structures that context from the start, so the model isn't leaning on a vague system prompt and some tool descriptions.

**More context ~= better, more accurate output**

Here's an analogy. Think about asking a friend for homework help. You wouldn't just say "How do I solve this?" You'd say:

- "Hey, I'm working on algebra homework." (Domain)
- "We're learning about quadratic equations." (Specific topic)
- "I need to solve x² + 5x + 6 = 0." (Task)
- "Can you walk me through the steps?" (Request)

The traditional way, a model gets a prompt, reads whatever the system prompt says, and tries to work out which tools to use and how.

MCP gives it structured context up front, so it can make a much better call about which tool to pick.

### What's wrong with how AI uses tools today?

![AI tool use without MCP](https://res.cloudinary.com/total-typescript/image/upload/v1741365059/posts/post_hmxpo/ig9sx9vzc5oxzaywlff0.png)

<cite>Image credit: Matt Pocock</cite>

Right now, models don't magically know how to use external tools. You have to teach them. Usually that means building custom data access tools, writing prompts (like docstrings) explaining when and how to use each one, and attaching it all to the LLM through a system prompt. Then you hope the model picks the right tool for the user's question.

That approach has some real downsides:

**Glue code overload.** You write a pile of extra code just to make the tools behave.

**Prompt engineering headaches.** The model depends on carefully worded system prompts to understand its tools, and getting that wording right is fiddly.

**Tight coupling.** Change a tool and you have to update its docs, the system prompt, and the implementation. That's a maintenance headache that never goes away.

### How does MCP fix this?

![AI tool use with MCP](https://res.cloudinary.com/total-typescript/image/upload/v1741365059/posts/post_hmxpo/k36sjzjwkv1bimytecqe.png)

<cite>Image credit: Matt Pocock</cite>

MCP takes out the guesswork by standardising how tools and data are accessed, so you're not starting from scratch for every new source. You build a tool once and reuse it across agents and apps.

The model gets structured context up front, which cuts the ambiguity and the dependence on system prompts. You're no longer asking it to infer everything from fuzzy instructions. The key details are just there.

**Bridging data silos.** A big problem in enterprise AI is that the important data is everywhere. Some in databases, some in cloud storage, some buried in Slack. MCP gives the model one unified way to reach all of it, so it's working with the full picture.

**Works with any model.** MCP isn't tied to one model. Claude, GPT, your own custom LLM, it handles context the same way across all of them. And it's modular, so it plays nicely with different data sources and systems.

**Security and access control.** Dealing with sensitive data? MCP builds in controlled access to data and tools, so a model only touches what it's supposed to.

**Pre-built integrations.** MCP ships with ready-made connectors for things like Google Drive, Slack, GitHub, and databases, so you can hook a model up to common data sources quickly.

### How do you get started?

MCP is still new, but it's an open standard, so you can start playing with it today.

**Read the official docs.** The [architecture overview](https://modelcontextprotocol.io/docs/learn/architecture) and the [specification](https://modelcontextprotocol.io/specification/latest) are the primary sources. The [reference servers](https://github.com/modelcontextprotocol/servers) are the best code to read.

**Try pre-built MCP servers.** Since it's open source, npm-style registries are popping up with servers for tools we use every day. The most useful ones I've found so far: [smithery](https://smithery.ai/), [mcp-get](https://mcp-get.com/), [glama](https://glama.ai/mcp/servers), [mcp.so](https://mcp.so/).

**Build your own.** The [quick start guide](https://modelcontextprotocol.io/tutorials/building-mcp-with-llms) walks you through creating a custom MCP server.

## Where I'd stop trusting this post

**You don't need MCP for one app with a few tools.** Plain function calling does the same job with less machinery. The protocol pays off when the same tool has to work across several clients, or when you want to use servers other people wrote.

**The best objection is security.** An MCP server is somebody else's code and instructions, running with your credentials and feeding text straight into your model. The spec's own [security section](https://modelcontextprotocol.io/specification/latest) says descriptions of tool behaviour should be treated as untrusted unless they come from a trusted server, and that users must explicitly consent to data access and tool use. Installing a server from a registry deserves the same care as installing a package.

**More tools isn't more capability.** Every connected server adds its tool definitions to the context window. Connect ten and your model burns tokens, and attention, reading menus.

**This is a summary of my reading.** Nothing here is a measurement or a production report. Treat it as an explainer.

## The takeaway

MCP is early. It promises a smarter way to connect AI to real-world data, and it's too soon to say how big it'll get. On the upside, standardising context could mean better accuracy, easier integrations, and smoother automation. The pre-built connectors and modular design make it tempting if you want simpler workflows.

There are open questions too. Will companies actually adopt it? Can it scale across different models and enterprise systems? Right now it's an interesting idea with a lot of potential. If you're in the AI space, it's worth watching and worth a weekend of tinkering. Will it *truly* change the agentic AI game? Guess we twiddle our thumbs and find out.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 10 October 2026: rewrote this in plainer language and dropped the GIF. The one-line take, primary sources, and limits section were added on 9 October 2026.*
