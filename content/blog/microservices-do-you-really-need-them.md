---
title: Microservices? Do You Really Need Them?
publishedAt: '2026-06-17'
summary: >-
  Splitting a monolith turns every multi-step operation into a distributed
  transaction. Why an orchestrated saga handles that better than choreography.
tags:
  - microservices
  - architecture
  - saga
  - distributed-systems
updated: '2026-10-09'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

![GIF of a chaotic network of connected nodes](https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTg3cXJieTRzeWh1enVvNndqbndwc25zdThoM2ZsMXZ3cmxpOTh6ZCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/PPvY7HQkmuyGfgmFUa/giphy.gif)

It feels like every team is running [microservices](https://martinfowler.com/articles/microservices.html) these days. Split the monolith, they said. It will scale better, they said. And look, they are not wrong. But breaking your app into a bunch of independent services is the easy part. Keeping them in sync when something goes wrong is where the real work is.

I have spent the past year as an associate engineer shipping and scaling production microservices, working closely with solution architects and principal engineers. Somewhere along the way, I noticed something that genuinely confused me. Our UI was calling an orchestrator, which then called the actual service. And I thought, wait. Why are we adding an extra hop here? Why not just call the service directly? That would save a network call, cut latency, and simplify the whole thing... right?

Boy, was I wrong.

So, do you really need microservices? **Only if you are ready to own distributed transactions, because that is what you are signing up for the moment each service gets its own database.** And once you are there, my claim is that an orchestrated saga is the way to run them: one component that owns the workflow beats a set of services reacting to each other's events.

## TL;DR

When your data is spread across multiple independent services, a simple multi-step operation (like placing an order) becomes a distributed transaction. If one step fails halfway through, you need a way to cleanly undo everything that came before it. That is what the [saga pattern](https://microservices.io/patterns/data/saga.html) solves. There are two ways to implement it: Choreography (decentralized, event-driven) and Orchestration (centralized, command-driven). Orchestration is harder to set up initially but it is almost always the right call as you scale. Here is why.

## So what even is a distributed transaction?

In a monolith, if something breaks mid-operation, your database rolls everything back automatically. ACID properties handle it for you and life is good.

In a microservices world, that safety net is gone. Your `Order Service`, `Payment Service`, and `Inventory Service` each own their own database (the [database-per-service](https://microservices.io/patterns/data/database-per-service.html) rule). There is no single transaction that spans all three of them. So if your payment goes through but inventory reservation fails, you now have a partially completed order sitting in production with real money on the line.

This is the distributed transaction problem, and it is the first wall every team hits when they go all-in on microservices.

## Enter the SAGA Pattern

A [saga](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) is a sequence of local transactions chained together. Each service does its own thing, and if a step fails, you run **compensating transactions** to undo the steps that already succeeded. Think of it as a structured "undo" plan baked directly into your architecture.

There are two ways to wire this up.

## Choreography vs Orchestration what is the difference?

Think of a restaurant kitchen.

**Choreography** is a kitchen with no head chef. Every station just listens for the previous one to yell out that their job is done, then reacts accordingly. The grill chef hears "prep done!" and fires the steak. The fry station hears "steak done!" and drops the fries. It works. Until someone misses a shout, or two stations react to the same event at the same time, and now nobody knows what state the order is actually in.

**Orchestration** is a kitchen with a head chef holding the ticket. They tell grill to fire, wait for confirmation, then tell fry to drop. If anything fails, they know exactly what happened and who needs to roll back what.

### Choreography

Services publish events. Other services listen and react. No central controller, fully decoupled.

**The good part:** Services genuinely do not know about each other. Feels very clean and "pure microservices" on paper.

**The bad part:** Once your workflow grows past 3 or 4 services (my rule of thumb, not a measured threshold), debugging becomes a murder mystery. You have no single place to check the state of a transaction. You are piecing together logs from 6 different services hoping the timestamps line up. And cyclic dependencies start appearing because services end up listening to each other's failure events just to compensate for them.

### Orchestration

One central **Orchestrator** manages the whole workflow. It sends explicit commands to each service, waits for a reply (success or failure), and decides what happens next.

- **Command-driven:** Orchestrator tells `Payment Service` to charge. Gets back "success". Tells `Inventory Service` to reserve. Gets back "failed". Issues a refund command back to `Payment Service`. Done.
- **Full state visibility:** At any point you can query the orchestrator and know exactly what step the transaction is on and why it stopped.
- **Compensation is centralized:** When something fails, the orchestrator knows exactly what already succeeded and fires rollback commands in order. No guessing.

Written out, the failed order above is a short, readable script, and that is the point:

```text
UI            -> Orchestrator : placeOrder(order-42)
Orchestrator  -> Payment      : charge(order-42)        <- ok
Orchestrator  -> Inventory    : reserve(order-42)       <- FAILED: out of stock
Orchestrator  -> Payment      : refund(order-42)        <- ok   (compensation)
Orchestrator  -> UI           : order-42 rejected: out of stock
```

In choreography the same five steps exist, but they are spread across the event handlers of three services and no file contains them in order.

## Back to my "why the extra hop" question

So here is why I was wrong to think calling the service directly would be better.

When our UI calls the orchestrator, the orchestrator is not just a middleman passing traffic. It is managing a multi-step transaction that might touch 3 or 4 services behind the scenes. If the UI called each service directly, it would have to manage the SAGA logic itself: deciding what to call next, handling partial failures, issuing compensation calls. You would essentially be building an orchestrator in your frontend. Which is a terrible idea.

By routing through the orchestrator, the UI stays dumb and focused. The orchestrator stays smart and focused. Each service stays dumb and focused. Everyone has one job and does it well. The "extra network call" is not overhead, it is the architecture doing its job.

## Why Orchestration wins at scale

**Visibility:** One place to check the state of any business transaction. Priceless when you are on-call at 2am.

**Simpler services:** Individual microservices just execute commands and report back. They do not need to know about the broader business flow. That is the orchestrator's job.

**No cyclic dependencies:** Choreography breeds coupling in disguise because services end up reacting to each other's events to handle failures. Orchestration keeps the dependency graph strictly one-directional.

**Easier testing:** You can test the orchestration workflow by mocking the service replies. No need to spin up the entire event mesh.

## Where this stops applying

**The strongest objection: the orchestrator is a single point of failure and a bottleneck.** AWS says as much in its own [guidance on saga orchestration](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html). It is a fair hit. Every workflow now depends on one component, so that component has to persist its state, survive restarts mid-saga, and scale with total traffic. That is why teams reach for a durable workflow engine such as [AWS Step Functions](https://aws.amazon.com/step-functions/) or [Temporal](https://docs.temporal.io/) instead of hand-rolling one, and it is real operational weight that choreography does not carry.

**Simple flows do not need it.** For two or three services with no compensation logic, [choreography](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html) is less to build and less to run.

**Orchestrators attract business logic.** Keep the orchestrator to sequencing and compensation. Once pricing rules and validation move in, you have rebuilt the monolith with extra network calls.

**You might not need the split at all.** Martin Fowler's [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) argues that most successful microservice systems started as a monolith that got too big. A single database transaction is still the cheapest saga there is.

**What this post is not:** a benchmark. The comparison comes from working inside an orchestrated system and from reading, not from running both styles side by side on the same workflow.

## Final Thoughts

Choreography is a great starting point, but orchestration is where a microservices architecture that ships and scales tends to end up.

A lot of teams start with choreography because it feels elegant and decoupled. And it is, for simple things. But the moment complexity creeps in (and it always does), you will spend more time debugging event flows than building features. The orchestrator pattern forces you to make your business logic explicit, visible, and testable. That is not overhead. That is engineering discipline.

Start simple. My decision rule: if a business operation needs a compensating step in more than one service, give it an orchestrator. Your future self, and your on-call rotation, will thank you.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: answered the title question directly, added the worked order flow, sources, and the section on where this stops applying.*
