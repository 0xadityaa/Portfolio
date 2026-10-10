---
title: 'Going Event-Driven? Read the Bill First.'
publishedAt: '2026-06-19'
summary: 'Events are billed per event, per consumer, and per kilobyte. I did the math at three volumes so your AWS invoice doesn''t have to surprise you.'
tags:
  - microservices
  - architecture
  - event-driven
  - finops
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

Picture this. You ship a gorgeous event-driven architecture. Everything is async, decoupled, cloud-native, the works. You're proud of it. Three weeks later someone drops a screenshot of the AWS bill in Slack, and suddenly nobody's talking about how elegant it is.

Pretty architecture and cheap architecture are two different things.

I spent the past year working closely with solution architects, and I kept seeing the same movie: a team goes event-driven for all the right reasons, then gets blindsided by costs nobody modelled. So here's my claim. **An event-driven system is billed per event, per consumer, and per kilobyte, which means three whiteboard decisions set your bill: fan-out, payload size, and retry behaviour.** You can do that math before writing a line of code. I did it below so you can steal it.

## The short version

Events are great when services don't need to wait on each other. Service A publishes "this happened" and gets on with its life. The catch is that every one of those events is metered. On public AWS prices, one event fanned out to 12 small Lambda consumers costs about $5.90 per million events. That's pocket change at a million events a month. It's about $5,900 at a billion, and that's before a chunky payload or a retry loop gets involved.

## What's wrong with good old HTTP calls?

When services call each other over REST, the whole chain is as fast as its slowest link. `Checkout Service` calls `Payment Service`, which calls `Fraud Service`, which calls `Analytics Service`. One of them hangs, the user's request hangs. One flaky service downstream and your p99 latency is on the moon.

That's the **distributed monolith**. It looks like microservices and behaves like a monolith. You split the code and kept all the coupling. Worst of both worlds.

[Event-driven architecture](https://martinfowler.com/articles/201701-event-driven.html) fixes it by deleting the waiting. Service A publishes an event (say, "Order Placed") to a broker like [Kafka](https://kafka.apache.org/) or [Amazon EventBridge](https://aws.amazon.com/eventbridge/). Whoever cares about that event picks it up and reacts in their own time. Service A is already serving the next request. Nobody waits on anybody.

## So when should something be an event?

Not every call deserves to be one. Here are the two rules I use.

**If Service A can finish its job without knowing what Service B did with the info, make it an event.** When someone checks out, writing the order to the database has to succeed right now, so that stays synchronous. The confirmation email, the analytics update, the loyalty points? Nobody at the checkout button is waiting on those. Make them event consumers and your checkout gets faster for free.

**If your traffic is spiky, events are your shock absorber.** Synchronous APIs fall over under sudden load. A broker soaks up the spike and lets your workers chew through it at a pace they can survive.

## OK, the bill

This is the part I wish someone had sent me before we shipped. To be clear, these numbers are a model I built from the public price list, not a bill from my employer. Prices are AWS list prices in US East, checked on 9 October 2026, free tier ignored.

The inputs:

- [EventBridge](https://aws.amazon.com/eventbridge/pricing/) charges $1.00 per million custom events published. Delivery to a target in the same account is free. Each 64 KB chunk of payload counts as one event.
- [Lambda](https://aws.amazon.com/lambda/pricing/) charges $0.20 per million requests, plus $0.0000166667 per GB-second of compute.
- My assumption for a consumer: 128 MB of memory and 100 ms per invocation. That's 0.0125 GB-seconds, or about $0.21 per million invocations in compute.

So one "Order Placed" event with 12 consumers costs this much per million events:

| Line item | Calculation | Cost per 1M events |
| --- | --- | --- |
| Publish to EventBridge | 1M x $1.00/M | $1.00 |
| Lambda requests | 12M x $0.20/M | $2.40 |
| Lambda compute | 12M x 0.0125 GB-s x $0.0000166667 | $2.50 |
| **Total** | | **$5.90** |

And here it is at three volumes:

| Events per month | 1 consumer | 12 consumers | 12 consumers, 256 KB payload |
| --- | --- | --- | --- |
| 1 million | $1.41 | $5.90 | $8.90 |
| 100 million | $141 | $590 | $890 |
| 1 billion | $1,408 | $5,900 | $8,900 |

Three things jump out.

**Fan-out is the multiplier.** The broker is the cheap part. More than eighty percent of the 12-consumer cost is the consumers. Every new subscriber on a busy event adds its own request line and compute line, forever. So be picky about who gets to listen to what.

**Keep events skinny.** A 256 KB payload is billed as four events, which turns the $1.00 publish line into $4.00. Send an ID and what changed, like `{"order_id": "abc123", "status": "placed"}`. If a consumer needs the whole entity, it can go fetch it from the database or a cache. That's the [claim-check pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/claim-check), and the 256 KB column is what it saves you.

**Infinite loops will ruin your week.** A service that hears an event, processes it, and accidentally emits the same event again will keep going until something stops it. At $5.90 per million that sounds harmless. But a loop doesn't run at your traffic rate. It runs as fast as the platform will scale. Set up [dead-letter queues](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-rule-dlq.html), retry limits, and loop detection before you ship. Lambda has [recursive loop detection](https://docs.aws.amazon.com/lambda/latest/dg/invocation-recursion.html) for some services now. It only covers some of them, so go read which.

## Where I'd stop trusting this post

**It's a small model and I picked the inputs.** Twelve consumers at 128 MB and 100 ms is a believable fan-out, not a measured one. Double the duration or the memory and the compute line doubles too. I also left out logs, data transfer, the database reads claim-check adds, and whatever your consumers call downstream. Any of those can cost more than my whole table.

**At small volume, ignore all of this.** Under a few million events a month the entire event bill is lunch money, and your time is the expensive thing. Optimise for clarity and close this tab.

**The best objection is that the bill is the wrong thing to worry about.** Martin Fowler's [survey of event-driven patterns](https://martinfowler.com/articles/201701-event-driven.html) argues the real price is losing sight of the flow: there's no single place in the code that shows what happens after "Order Placed". I think he's right, and I didn't put a number on that cost.

**Kafka changes the math.** A cluster you run or rent is priced by brokers and storage, not per event. Fan-out gets close to free and idle capacity becomes the thing you pay for. Everything above is about serverless brokers.

## The takeaway

Most teams go event-driven too early and for the wrong reasons. Events aren't the default way for services to talk. They're what you reach for when you need things to happen async and at scale. If a service needs another service's answer to finish its own job, a REST call is still the right tool, and there's zero shame in that.

When you do make the jump, do the multiplication first: events per month, times consumers per event, times 64 KB chunks per payload. If that number scares you on a whiteboard, wait until it shows up on an invoice.
