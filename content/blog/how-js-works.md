---
title: How JavaScript Works
publishedAt: '2024-09-26'
summary: >-
  A mental model of how a JavaScript engine runs code: execution contexts, the
  memory and execution phases, and the call stack, traced through an example.
tags:
  - javascript
updated: '2026-10-09'
devto_url: 'https://dev.to/0xadityaa/how-javascript-works-2fel'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

Javascript is a **Synchronous** and **Single Threaded** language. Meaning that it executes one line of code at a time and in the order that it is written. It cannot run in parallel.

The model this post builds: **every piece of JavaScript runs inside an execution context, which is created in two passes. First the engine sets aside memory for every declaration, then it runs the code.** Once you can trace those two passes by hand, hoisting, scope, and the call stack stop being surprising.

## Execution Context

Everything in Javascript happens inside an [**execution context**](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model).

Execution context consists of 2 main parts - **Variable Environment** and **Execution Stack**.
![Execution Context in JS](/images/blog/js-execution-context.png)

## Variable Environment

Variable Environment is a collection of variables that are available to the code. It is created when the code is executed and destroyed when the execution is finished.

## Execution Stack

Execution Stack is a data structure that keeps track of the order in which the code is executed. It is a stack of functions that are called when the code is executed.

---

## Let's look at how JS is executed under the hood

Now that we have a basic understanding of how Javascript works, here is its execution engine at work on an example.

lets take this JS code as an example and look how it is executed by JS engine:

```js
var n = 2;

function square(num) {
  var ans = num * num;
  return ans;
}

var squareOfN = square(n); // returns 4
```

Remember that we said everything in JS happens inside an execution context. So, the first step JS engine takes is to create an execution context of the code.

Now we know that the execution context consists of 2 main parts - **Variable Environment** and **Execution Stack**.

There are **3 phases** in the execution of JS code:

### Phase 1 - Memory Creation Phase

In this phase, JS engine reserves the memory for all the variables and functions in the code. It does not store the actual values inside that variable just yet. Instead, it initializes the defined variable with `undefined` value initially.

at this point our execution context looks like this:

![JS Memory Creation](/images/blog/js-memory-creation.png)

Now that the required memory is reserved, the next phase is called **Execution Phase**.

### Phase 2 - Execution Phase

![JS Code Execution](/images/blog/js-code-execution.png)

In this phase, JS engine executes the code line by line. It starts with the first line of code and executes it one by one. It now updates the initially reserved memory which was set to `undefined` with the actual value of the variable.

When the code execution reaches to the function call, a new execution context is created inside of current context.
Now, after creating new execution context and computing the square, the `ans` variable is returned to the parent context which will then store that value in the `squareOfN` variable.

### Phase 3 - Garbage Collection Phase

After the execution of a function is complete, the context created for it will be destroyed and if we call same function again, entire execution cycle repeats. Execution cycle looks like this:

![Execution Cycle in JS](/images/blog/js-execution-cycle.png)

---

## How JS engine handles the code execution

Now that we have an understanding of the brute force way fo JS execution, lets look at how it is executed in a more practical way by the JS engine.

The JS engine is a complex system that is responsible for executing the code. The most widely used one is [V8](https://v8.dev/), written in C++, which powers Chrome and Node.js. Firefox and Safari ship their own engines, SpiderMonkey and JavaScriptCore, and all of them follow the same [ECMAScript specification](https://tc39.es/ecma262/).

![Execution Cycle in JS](/images/blog/js-execution-in-engine.png)

JS engine uses a stack to keep track of the order in which the code is executed. It is a data structure that stores the execution context of each function call. When a function is called, it is pushed onto the stack. When the function returns, the context is popped off the stack.

The call stack also has a core component called `Global Execution Context`. This is the context that is used to execute the code outside of any function. It is the initial context that is created when the code is executed first. After completion of every function call in the stack, control of execution returns to the Global Execution Context which then runs further code.

---

## Where this stops applying

**This is a mental model, not how V8 is built.** Real engines parse lazily, start in an interpreter, and compile hot functions to machine code while the program runs. The two-pass picture predicts what your code will output. It does not describe what the engine is doing internally.

**Garbage collection is not a phase after each function.** I drew it as phase 3 to keep the cycle simple. In practice [memory is reclaimed](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) by a collector that runs on its own schedule, whenever values are no longer reachable. A closure can keep a function's variables alive long after the function has returned.

**Asynchronous code is missing.** "Single threaded" is true of the call stack, but timers, promises, and network calls are handled by the event loop and its queues, which this post does not cover. That is the natural next thing to read about.

## Wrapping Up

The habit worth keeping: when a piece of JavaScript surprises you, trace it by hand. Write down what is in memory after the first pass, then step through the second pass one line at a time. Most "weird" behaviour stops being weird by line three.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: corrected the description of JavaScript engines, added sources, and added the section on where this stops applying.*
