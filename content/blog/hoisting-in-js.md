---
title: 'Hoisting in JavaScript, Without the Hand-Waving'
publishedAt: '2024-09-30'
summary: 'JavaScript registers every declaration before it runs any code. That one fact explains undefined from var, callable functions, and the temporal dead zone.'
tags:
  - javascript
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
devto_url: 'https://dev.to/0xadityaa/hoisting-in-javascript-76h'
---

## What is hoisting?

[Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting) is the name for a JavaScript behaviour where variable and function declarations act as if they got moved to the top of their scope. Nothing actually moves. **The engine registers every declaration in a scope before it runs any code in that scope**, and the rest of this post is just consequences of that one fact.

The practical upshot: you can use variables and functions before the line where they're declared. Sometimes that works out fine. Sometimes it bites. So it's worth knowing which is which.

## How it works

Variable declarations (`var`, `let`, `const`) and function declarations all get hoisted. They just don't all behave the same way.

### Variable hoisting

When you declare a variable with `var`, the declaration gets hoisted to the top of its function or global scope. The assignment stays where you wrote it. So if you read the variable before the assignment, you get `undefined`.

```js
console.log(myVar); // returns undefined
var myVar = 5;
console.log(myVar); // returns 5
```

The first `console.log` prints `undefined` because the declaration of `myVar` was hoisted and the `myVar = 5` part wasn't. The engine treats it like this:

```js
var myVar;
console.log(myVar); // returns undefined
myVar = 5;
console.log(myVar); // returns 5
```

### Function hoisting

Function declarations are hoisted completely, body and all. That's why you can call a function above the line where it's defined.

```js
greet(); // returns "Hello, World!"

function greet() {
  console.log("Hello, World!");
}
```

`greet` works before its declaration because the whole function got hoisted to the top.

### let and const hoisting

Here's the twist. Variables declared with `let` and `const` are hoisted too. They're just not initialised. Touch them before their declaration and you get a `ReferenceError`.

```js
// returns ReferenceError: Cannot access 'myLet' before initialization
console.log(myLet);
let myLet = 10;

// returns ReferenceError: Cannot access 'myConst' before initialization
console.log(myConst);
const myConst = 20;
```

Both `myLet` and `myConst` throw, because they sit in a ["temporal dead zone"](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) from the start of the block until the line that declares them. Great name, by the way.

## So what do I do with this?

Two things to remember:

1. **Declare your variables up top.** Put them at the top of their scope and there's nothing to be confused about.
2. **Function declarations and function expressions are different.** A function declaration is hoisted with its body. With a [function expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/function) (arrow functions included), only the variable is hoisted, not the function you assigned to it.

```js
// returns TypeError: square is not a function
console.log(square(5)); 

var square = function (num) {
  return num * num;
};
```

`square` the variable is hoisted. But it's a function expression, so it doesn't hold the function until the assignment runs. Call it early and you get a `TypeError`.

## Why does it work this way?

If you're wondering why `function` declarations are hoisted and `var func = function() {}` or `const func = () => {}` aren't, I wrote about how the JS engine reserves memory for your code in [this post](/blog/how-js-works).

Short version: when you use the `function` keyword, the engine stores the entire function definition along with its reference, so you can call it before the definition at runtime. In the other cases, the memory starts out as `undefined` until execution reaches the assignment.

## Where I'd stop trusting this post

**In modern code, hoisting rarely bites.** With `let`, `const`, and ES modules, using a name too early throws right away. It doesn't quietly hand you `undefined`. The confusing cases above are mostly `var` cases, and most codebases stopped writing `var` a while ago.

**"Moved to the top" is a teaching model.** The spec never moves code. It describes environment records that get filled in before execution starts. The model predicts the right output, but it'll mislead you if you take it literally, for example about where a `let` variable "is" during its dead zone.

**Classes behave like `let`.** A `class` declaration is hoisted but uninitialised, so using it before its definition is a `ReferenceError`. I didn't cover that case here.

The rule that makes all of this a non-issue: declare before use, prefer `const`, and let a linter yell about the rest.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 10 October 2026: rewrote this in plainer language and gave it a new title. The definition, a dead link, sources, and limits section were fixed or added on 9 October 2026.*
