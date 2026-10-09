---
title: Going Event-Driven? Read the Bill First.
publishedAt: '2026-06-19'
summary: >-
  Fan-out, payload size, and retry loops decide what an event-driven system
  costs. Here is the arithmetic at three volumes, from the public price list.
tags:
  - microservices
  - architecture
  - event-driven
  - finops
updated: '2026-10-09'
---

![GIF of dominoes falling in perfect, complex harmony](https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzVnZzdwNjk4ZDhwcjl4dHB6Y2dyeHNra2w2eDYyaXE2bHJwaWdseSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/TdwziQPhbNAzK/giphy.gif)

Picture this. You ship a beautiful event-driven architecture. Everything is async, decoupled, and properly cloud-native. You are genuinely proud of it. Three weeks later, someone sends a Slack message with a screenshot of the AWS bill. Elegant architecture and cheap architecture are not always the same thing.

Working closely with solution architects this past year, I saw teams jump into event-driven systems for all the right reasons and get caught by costs they never modelled. My claim in this post: **an event-driven design is priced per event, per consumer, and per kilobyte, so its bill is set by three choices you make on the whiteboard: fan-out, payload size, and retry behaviour.** You can do that arithmetic before you write any code, and below I do it.

## TL;DR

Event-driven systems shine when your services do not need to wait on each other. Instead of Service A blocking on a response from Service B, it publishes an event and moves on. The tradeoff is that every event is metered. On public AWS prices, one event fanned out to 12 small Lambda consumers costs about $5.90 per million events. That is nothing at a million events a month and about $5,900 at a billion, before a fat payload or a retry loop multiplies it.

## So what is actually broken with plain HTTP calls?

When services call each other over REST, the whole chain is only as fast as the slowest link. Your `Checkout Service` calls `Payment Service`, which calls `Fraud Service`, which calls `Analytics Service`. If any one of those hangs, the entire user request hangs with it. One flaky downstream service and your p99 latency goes through the roof.

This is the **distributed monolith** problem. Microservices in shape, monolith in behavior. You split the code but kept all the coupling.

[Event-driven architecture](https://martinfowler.com/articles/201701-event-driven.html) fixes this by removing the waiting. Service A publishes an event (say, "Order Placed") to a broker like [Kafka](https://kafka.apache.org/) or [Amazon EventBridge](https://aws.amazon.com/eventbridge/). Every other service that cares about that event listens and reacts on its own time. Service A is already done and responding to the next request. Nobody is waiting on anybody.

## When does it actually make sense to go event-driven?

Not every inter-service call deserves to be an event. Here is a practical rule I use.

**If Service A can finish its job without knowing what Service B did with the information, make it an event.** When a user completes a purchase, writing the order to the database is synchronous (you need that to succeed right now). Sending a confirmation email, updating the analytics dashboard, or triggering a loyalty points calculation? All of those can happen asynchronously in the background. Turn them into event consumers and your checkout response time drops immediately.

**If your traffic is unpredictable and spiky, events are your shock absorber.** Synchronous APIs under sudden load are fragile. An event broker lets your ingestion layer absorb the spike and lets your downstream workers process at a steady, sustainable pace without anything falling over.

## The bill, worked out

This is the section I wish someone had sent me before we shipped. The numbers are a model built from the public price list, not a bill from my employer. Prices are AWS list prices in US East, checked on 9 October 2026, with the free tier ignored.

The inputs:

- [EventBridge](https://aws.amazon.com/eventbridge/pricing/) charges $1.00 per million custom events published. Delivery to a target in the same account is free. Each 64 KB chunk of payload is billed as one event.
- [Lambda](https://aws.amazon.com/lambda/pricing/) charges $0.20 per million requests, plus $0.0000166667 per GB-second of compute.
- My assumption for a consumer: 128 MB of memory, 100 ms per invocation. That is 0.0125 GB-seconds, or about $0.21 per million invocations in compute.

One "Order Placed" event with 12 consumers therefore costs, per million events:

| Line item | Calculation | Cost per 1M events |
| --- | --- | --- |
| Publish to EventBridge | 1M x $1.00/M | $1.00 |
| Lambda requests | 12M x $0.20/M | $2.40 |
| Lambda compute | 12M x 0.0125 GB-s x $0.0000166667 | $2.50 |
| **Total** | | **$5.90** |

And at three volumes:

| Events per month | 1 consumer | 12 consumers | 12 consumers, 256 KB payload |
| --- | --- | --- | --- |
| 1 million | $1.41 | $5.90 | $8.90 |
| 100 million | $141 | $590 | $890 |
| 1 billion | $1,408 | $5,900 | $8,900 |

Three things fall out of that table.

**Fan-out is the multiplier.** The broker is the cheap part. More than eighty percent of the 12-consumer cost is the consumers. Every new subscriber to a busy event adds its own request and compute line forever, so be deliberate about who is listening to what.

**Keep events skinny.** A 256 KB payload is billed as four events, which turns the $1.00 publish line into $4.00. Keep events minimal: an ID and the state change that happened, like `{"order_id": "abc123", "status": "placed"}`. If a consumer needs the full entity, let it fetch from the database or a cache. This is the [claim-check pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/claim-check), and the 256 KB column is what it saves you.

**Infinite loops will ruin your day.** A service that listens to an event, processes it, and accidentally emits the same event again will loop until something stops it. At $5.90 per million that sounds harmless, but a loop does not run at your traffic rate, it runs as fast as the platform will scale. Set up [dead-letter queues](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-dlq.html), maximum retry limits, and loop detection before you ship. Lambda now has [recursive loop detection](https://docs.aws.amazon.com/lambda/latest/dg/invocation-recursion.html) for some services, which covers a subset of these and is a reason to learn exactly which ones.

## Where this stops applying

**The model is small and I chose the inputs.** Twelve consumers at 128 MB and 100 ms is a plausible fan-out, not a measured one. Double the duration or the memory and the compute line doubles with it. It also leaves out logs, data transfer, the database reads that claim-check adds, and downstream services the consumers call. Those can cost more than everything in the table.

**At small volume none of this matters.** Under a few million events a month the entire event bill is lunch money, and engineering time is the real cost. If that is you, optimise for clarity and ignore this post.

**The strongest objection is that the bill is the wrong thing to worry about.** Martin Fowler's [survey of event-driven patterns](https://martinfowler.com/articles/201701-event-driven.html) makes the case that the real price is losing sight of the overall flow: no single place in the code shows what happens after "Order Placed". I think that is right, and it is a cost this post does not put a number on.

**Kafka changes the shape of the arithmetic.** A cluster you run or rent is priced by brokers and storage, not per event, so fan-out is close to free and idle capacity is what you pay for. The per-event reasoning above is for serverless brokers.

## Final Thoughts

Most teams go event-driven too early and for the wrong reasons. Events are not a default communication pattern. They are a choice you make when your system needs async elasticity. If your services need each other's responses to finish their own jobs, a REST call is still the right tool and there is nothing wrong with that.

When you do make the jump, do the multiplication first: events per month, times consumers per event, times 64 KB chunks per payload. If that number surprises you on a whiteboard, it will surprise you more on an invoice.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: added the cost model and its sources, links to the patterns named, and the section on where this stops applying.*
