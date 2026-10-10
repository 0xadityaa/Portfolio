---
title: 'What Are LLMs, and How Do You Build Stuff With Them?'
publishedAt: '2025-02-18'
summary: 'An LLM just predicts the next token. Everything useful is the scaffolding around it: context, tools, and memory. My map, via LangChain and LangGraph.'
tags:
  - llm
  - ai
  - langchain
  - langgraph
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
devto_url: 'https://dev.to/0xadityaa/what-are-llms-and-how-to-build-stuff-using-it-4l68'
---

Ever wondered how ChatGPT, Claude, Gemini, Deepseek, Llama and friends understand you and write back like a person? Here's the idea this whole post hangs on: **an LLM only predicts the next token. So every useful app is the scaffolding you build around it: what context it sees, which tools it can call, and what it remembers.**

## So what is an LLM?

A Large Language Model is an AI system built to process and generate human-like text. Under the hood it's deep learning, specifically the [Transformer architecture](<https://en.wikipedia.org/wiki/Transformer_(deep_learning_architecture)>) from the paper [Attention Is All You Need](https://arxiv.org/abs/1706.03762). These models are trained on enormous piles of text like [fineweb](https://huggingface.co/datasets/HuggingFaceFW/fineweb), which is how they pick up language patterns, context, and meaning. That's what makes them good at generating text, translating, summarising, and a lot more.

Old rule-based systems followed instructions someone wrote. LLMs are probabilistic. They predict the most likely next word based on what they saw in training. That's why they can handle such a wide range of questions and still give answers that fit the context.

### The five words you'll keep hearing

1. **Tokenization.** Breaking text into smaller units called tokens. A token can be a word, part of a word, or a single character, depending on the tokenizer. Models work on tokens, not raw text.
2. **Embeddings.** Lists of numbers (vectors) that represent words or phrases and capture how they relate to each other. They're how a model knows two different words mean similar things.
3. **Context window.** The most text a model can handle at once. Bigger window, more it can keep in mind, more coherent the answers. Go past it and the early parts of the conversation fall off.
4. **Temperature.** The randomness dial. Turn it up for creative, varied output. Turn it down for predictable, repeatable output.
5. **Fine-tuning.** Training a model further on a specific dataset so it gets better at a specialised job, like medical, legal, or financial work.

## What LLMs are good and bad at

LLMs, and AI in general, are ***NOT a magic bullet***. Here's where they shine and where they fall on their face.

### Where they're awesome

- Writing human-like, coherent text that fits the context.
- Pulling out and summarising big chunks of information fast.
- Working across lots of languages.
- Producing structured output.

### Where they struggle

- They hallucinate, and they're confident about it.
- Short memory and a limited context window.
- They can be biased, depending on the training data.
- Logical reasoning isn't their strong suit.
- They're expensive and energy-hungry to run.

OK, that's the model. Now, how do you actually build something with it?

## How to build with LLMs

On its own, an LLM can't do much. If you want to solve a real problem and not just ship one more chatbot, you have to give it resources: internet access, tools for the tasks you need (calling an API, hitting a database), and so on. For that, you want [LangChain](https://www.langchain.com/).

### LangChain

If you're serious about building apps with LLMs, LangChain is worth having in your toolbox. It gives you a structured way to talk to models and makes it much easier to hook them up to outside data sources, databases, and APIs. It comes with pre-built pieces for memory, for chaining several LLM calls together, and for using external tools like search APIs. Chatbot, research assistant, AI-powered knowledge base, whatever you're making, it takes a lot of the plumbing off your plate.

#### Why LangChain rocks

- **Integrations.** Plug into different models, databases, and external APIs without much fuss.
- **Tools.** The model can use search APIs, calculators, and other tools to give better answers.
- **Chains.** String several LLM calls together like a conversation flow.
- **Memory.** Keep conversation context across multiple exchanges.

#### Keeping your AI chat on track

LLMs have a limited attention span (that context window again), so long conversations get messy. Three ways to keep them manageable:

- **Trimming.** Cut the parts of the conversation you don't need.
- **Filtering.** Keep only the most relevant messages.
- **Summarising.** Turn a long-winded chat into a short recap.

#### What can you build with it?

Plenty: chatbots, smart search, writing assistants, automated research tools. It's great for anything that needs to talk to databases, external APIs, and knowledge retrieval systems.

It has limits though. LangChain structures your AI interactions, but it's still stuck with the model's own constraints, like the context window and no long-term memory. And on its own it doesn't give you advanced decision-making or complex multi-step orchestration. That's where LangGraph comes in.

### LangGraph

[LangGraph](https://langchain-ai.github.io/langgraph/) is a flexible framework for building dynamic, multi-step AI apps. Where a simple app is prompt in, answer out, LangGraph lets you build workflows with multiple decision points, several agents talking to each other, and structured automation. It's especially handy when your AI needs to go back and forth with users, juggle different workflows, or remember things across sessions.

With it you can route queries, break a big task into smaller steps, and run things in parallel. Automating customer service flows, walking users through a process step by step, generating content with AI in the loop, it gives you the pieces to orchestrate all of that.

#### Storing conversation data

Want your AI to "remember" things? LangGraph gives you options:

1. **Memory Saver.** Stores data locally for quick access.
2. **Postgres Saver.** Uses PostgreSQL for external storage.
3. **MongoDB.** Stores conversations in a NoSQL database.
4. **Redis Saver.** Fast, efficient storage for AI memory.

#### Getting it production-ready

- Use a different thread ID for each conversation.
- Save conversation history with persistent checkpoints.
- Avoid huge user prompts that overwhelm the model.
- Stream responses so it feels smooth.
- Handle errors (rate limits, content moderation, and so on).

### Prompt engineering

To get accurate, relevant answers out of an LLM, the prompt matters a lot. [Prompt engineering](https://en.wikipedia.org/wiki/Prompt_engineering) is part art, part science, and how you structure the question changes the quality of the answer.

#### Who's who in a conversation

- **SystemMessage.** Sets the ground rules, behaviour, and personality of the AI. It's where you define a persona, a tone, or overall guidelines.
- **HumanMessage.** What the user sends, usually text typed by a person.
- **AIMessage.** What the model sends back: text, or a request to call a tool.
- **ToolMessage.** Carries the result of a tool call back to the model, usually when outside data got fetched or processed.

## Where I'd stop trusting this post

**You might not need a framework at all.** The best counter-argument comes from Anthropic's [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents), which says to start with direct API calls, because frameworks add layers that hide the prompts and make debugging harder. If your app is one or two model calls, the plain SDK is less to learn and less to break.

**This is a map from February 2025.** Framework APIs in this space change every few months, and my list of things LLMs "struggle" with has shrunk since. Check the current docs before you copy a pattern from here.

**It's an overview, not a build log.** There's no code in this post and no measurements. For a worked example, [Finchat](/projects/Finchat) is the app these notes came out of.

## The takeaway

Building with LLMs is easier than ever with frameworks like LangChain and LangGraph. Chatbots, smart assistants, knowledge-search tools, they all come down to prompt engineering, context management, and conversation workflows.

If you remember one thing: decide what the model needs to see, what it's allowed to do, and what it should remember. In that order. The right framework is whichever one makes those three decisions easiest to read.
