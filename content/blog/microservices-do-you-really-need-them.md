---
title: 'Microservices? Do You Really Need Them?'
publishedAt: '2026-06-17'
summary: 'Split a monolith and every multi-step operation becomes a distributed transaction. Here''s why I''d hand that job to an orchestrator.'
tags:
  - microservices
  - architecture
  - saga
  - distributed-systems
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

Feels like every team runs [microservices](https://martinfowler.com/articles/microservices.html) now. Split the monolith, they said. It'll scale better, they said. And honestly, they're not wrong. But chopping your app into a pile of independent services is the easy part. Keeping those services in sync when something blows up halfway through? That's the actual job.

I've spent the past year as an associate engineer shipping and scaling production microservices, working closely with solution architects and principal engineers. And early on, one thing really bugged me. Our UI called an orchestrator, and the orchestrator called the real service. Why the extra hop? Just call the service directly. One less network call, less latency, simpler everything... right?

Boy, was I wrong.

So, do you really need microservices? **Only if you're ready to own distributed transactions, because that's what you sign up for the second each service gets its own database.** And once you're there, my claim is that an orchestrated saga is how you run them. One component that owns the workflow beats a bunch of services reacting to each other's events.

## The short version

When your data lives in several independent services, a boring multi-step operation (like placing an order) becomes a distributed transaction. If step three fails, something has to cleanly undo steps one and two. The [saga pattern](https://microservices.io/patterns/data/saga.html) is how you do that. It comes in two flavours: choreography (decentralised, event-driven) and orchestration (centralised, command-driven). Orchestration takes more setup and is almost always the right call as you grow. Here's why.

## What even is a distributed transaction?

In a monolith, if something breaks mid-operation, the database rolls everything back for you. ACID has your back and life is good.

With microservices, that safety net is gone. `Order Service`, `Payment Service`, and `Inventory Service` each own their own database (the [database-per-service](https://microservices.io/patterns/data/database-per-service.html) rule). No single transaction covers all three. So if the payment goes through and the inventory reservation fails, congrats, you have a half-finished order in production and real money stuck in the middle.

That's the distributed transaction problem. It's the first wall every team runs into when they go all in on microservices.

## Enter the saga

A [saga](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga) is a chain of local transactions. Each service does its bit. If a step fails, you run **compensating transactions** to undo the steps that already worked. It's an undo plan baked into your architecture.

There are two ways to wire one up.

## Choreography vs orchestration

Think of a restaurant kitchen.

**Choreography** is a kitchen with no head chef. Every station listens for the previous one to yell that they're done, then does its thing. Grill hears "prep done!" and fires the steak. Fry hears "steak done!" and drops the fries. It works, right up until somebody misses a shout, or two stations react to the same shout, and now nobody knows what state the order is in.

**Orchestration** is a kitchen with a head chef holding the ticket. They tell grill to fire, wait for the nod, then tell fry to drop. If something goes wrong, they know exactly what happened and who has to undo what.

### Choreography

Services publish events. Other services listen and react. No central controller, everything decoupled.

**The good part:** services truly don't know about each other. On paper it's clean, pure microservices.

**The bad part:** once a workflow grows past 3 or 4 services (my rule of thumb, not a measured threshold), debugging turns into a murder mystery. There's no single place to check where a transaction is. You're stitching together logs from six services and praying the timestamps line up. And cyclic dependencies creep in, because services start listening to each other's failure events just to compensate for them.

### Orchestration

One central **orchestrator** runs the whole workflow. It sends each service an explicit command, waits for a reply, and decides what happens next.

- **Command-driven:** the orchestrator tells `Payment Service` to charge and gets back "success". It tells `Inventory Service` to reserve and gets back "failed". It tells `Payment Service` to refund. Done.
- **You can see everything:** at any moment you can ask the orchestrator which step a transaction is on and why it stopped.
- **Compensation lives in one place:** when something fails, the orchestrator knows what already succeeded and fires the rollbacks in order. No guessing.

Written out, that failed order is a short script you can read top to bottom, which is the whole point:

```text
UI            -> Orchestrator : placeOrder(order-42)
Orchestrator  -> Payment      : charge(order-42)        <- ok
Orchestrator  -> Inventory    : reserve(order-42)       <- FAILED: out of stock
Orchestrator  -> Payment      : refund(order-42)        <- ok   (compensation)
Orchestrator  -> UI           : order-42 rejected: out of stock
```

With choreography the same five steps still exist. They're just scattered across the event handlers of three services, and no file has them in order.

## Back to my "why the extra hop?" question

Here's why calling the service directly would have been worse.

When our UI calls the orchestrator, the orchestrator isn't a middleman forwarding traffic. It's running a multi-step transaction that might touch 3 or 4 services. If the UI called each service itself, the UI would have to run the saga: decide what to call next, handle partial failures, send the compensation calls. You'd be building an orchestrator in your frontend. Please don't.

Route through the orchestrator and the UI stays dumb and focused. The orchestrator stays smart and focused. Each service stays dumb and focused. Everybody has one job. That "extra network call" isn't overhead. It's the architecture doing its job.

## Why orchestration wins as you grow

**Visibility.** One place to check the state of any business transaction. Priceless when you're on call at 2am.

**Simpler services.** A service runs commands and reports back. It doesn't need to know the bigger business flow. That's the orchestrator's problem.

**No cyclic dependencies.** Choreography breeds coupling in disguise, because services end up reacting to each other's events to handle failures. With orchestration the arrows only point one way.

**Easier testing.** Mock the service replies and you can test the whole workflow. No need to spin up the entire event mesh.

## Where I'd stop trusting this post

**The best objection: the orchestrator is a single point of failure and a bottleneck.** AWS says so in its own [guidance on saga orchestration](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-orchestration.html). Fair hit. Every workflow now leans on one component, so it has to persist its state, survive a restart mid-saga, and scale with all your traffic. That's why teams reach for a durable workflow engine like [AWS Step Functions](https://aws.amazon.com/step-functions/) or [Temporal](https://docs.temporal.io/) instead of rolling their own, and that's real operational weight choreography doesn't carry.

**Simple flows don't need it.** Two or three services and no compensation logic? [Choreography](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/saga-choreography.html) is less to build and less to run.

**Orchestrators attract business logic.** Keep yours to sequencing and compensation. Once pricing rules and validation move in, you've rebuilt the monolith with extra network calls.

**You might not need the split at all.** Martin Fowler's [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) points out that most successful microservice systems started as a monolith that got too big. A single database transaction is still the cheapest saga there is.

**And this isn't a benchmark.** The comparison comes from working inside an orchestrated system and from reading, not from running both styles side by side on the same workflow.

## The takeaway

Choreography is a fine place to start. Orchestration is where a microservices setup that ships and scales tends to end up.

Lots of teams start with choreography because it feels elegant. And for simple stuff, it is. But complexity always shows up eventually, and then you're spending more time debugging event flows than building features. An orchestrator forces your business logic to be explicit, visible, and testable. That's not overhead. That's just being kind to future you.

My rule: if a business operation needs a compensating step in more than one service, give it an orchestrator. Future you, and whoever's on call, will say thanks.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 10 October 2026: rewrote this in plainer language and dropped the GIF. The worked order flow, sources, and limits section were added on 9 October 2026.*
