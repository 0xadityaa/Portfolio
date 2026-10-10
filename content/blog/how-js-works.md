---
title: 'How JavaScript Actually Runs Your Code'
publishedAt: '2024-09-26'
summary: 'Every bit of JavaScript runs in an execution context built in two passes: memory first, then code. Trace that by hand and the weird stuff stops being weird.'
tags:
  - javascript
updated: '2026-10-10'
devto_url: 'https://dev.to/0xadityaa/how-javascript-works-2fel'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

JavaScript is a **synchronous**, **single-threaded** language. It runs one line at a time, in the order you wrote it. No running things in parallel.

Here's the model this post builds: **every piece of JavaScript runs inside an execution context, and that context gets created in two passes. First the engine sets aside memory for every declaration. Then it runs the code.** Once you can trace those two passes by hand, hoisting, scope, and the call stack stop being surprising.

## Execution context

Everything in JavaScript happens inside an [**execution context**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model).

An execution context has two main parts: the **variable environment** and the **execution stack**.

![Execution Context in JS](/images/blog/js-execution-context.png)

## Variable environment

This is the collection of variables your code can use. It's created when the code runs and destroyed when the code is done.

## Execution stack

This is the data structure that tracks what's running and in what order. It's a stack of the functions that get called as your code executes.

---

## OK, let's watch some code run

Enough definitions. Let's take this code and follow what the JS engine does with it:

```js
var n = 2;

function square(num) {
  var ans = num * num;
  return ans;
}

var squareOfN = square(n); // returns 4
```

Remember, everything happens inside an execution context. So the very first thing the engine does is create one for this code. And we know it has two parts, the **variable environment** and the **execution stack**.

From there, the code runs in **3 phases**.

### Phase 1: memory creation

The engine reserves memory for every variable and function in the code. It doesn't store the real values yet. Every variable just gets `undefined` to start with.

At this point our execution context looks like this:

![JS Memory Creation](/images/blog/js-memory-creation.png)

Memory's reserved. Next up, the **execution phase**.

### Phase 2: execution

![JS Code Execution](/images/blog/js-code-execution.png)

Now the engine runs the code line by line, top to bottom. As it goes, it swaps those `undefined` placeholders for the real values.

When it hits a function call, it creates a brand new execution context inside the current one. That new context computes the square, then returns `ans` to the parent context, which stores it in `squareOfN`.

### Phase 3: garbage collection

When a function finishes, the context created for it gets destroyed. Call the same function again and the whole cycle starts over. It looks like this:

![Execution Cycle in JS](/images/blog/js-execution-cycle.png)

---

## How the engine keeps track of all this

That was the by-hand version. Here's how the engine manages it in practice.

The JS engine is the complex bit of software that runs your code. The most widely used one is [V8](https://v8.dev/), written in C++, which powers Chrome and Node.js. Firefox and Safari ship their own, SpiderMonkey and JavaScriptCore, and they all follow the same [ECMAScript specification](https://tc39.es/ecma262/).

![Execution Cycle in JS](/images/blog/js-execution-in-engine.png)

The engine uses a stack to track the order things run in. Each function call gets its own execution context. When a function is called, its context gets pushed onto the stack. When it returns, the context gets popped off.

At the bottom of the call stack sits the `Global Execution Context`. That's the context for code that isn't inside any function, and it's the first one created when your code starts. Every time a function call finishes, control comes back to the Global Execution Context, which carries on with the rest of the code.

---

## Where I'd stop trusting this post

**This is a mental model, not how V8 is built.** Real engines parse lazily, start in an interpreter, and compile hot functions to machine code while the program runs. The two-pass picture predicts what your code will output. It doesn't describe what the engine is doing inside.

**Garbage collection isn't a phase after each function.** I drew it as phase 3 to keep the cycle simple. In reality [memory is reclaimed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) by a collector that runs on its own schedule, whenever values can no longer be reached. A closure can keep a function's variables alive long after the function has returned.

**Async code is missing.** "Single-threaded" is true of the call stack. But timers, promises, and network calls are handled by the event loop and its queues, and I didn't cover those here. That's the next thing to go read about.

## The takeaway

Here's the habit worth keeping. When a piece of JavaScript surprises you, trace it by hand. Write down what's in memory after the first pass, then step through the second pass one line at a time. Most "weird" behaviour stops being weird by line three.
