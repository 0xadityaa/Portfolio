---
title: 'Big O, Minus the Scary Math'
publishedAt: '2024-09-23'
summary: 'Big O is just how much more work your code does when the input grows. Four common shapes, JavaScript examples, and what they cost at real sizes.'
tags:
  - dsa
  - algorithms
  - javascript
updated: '2026-10-10'
devto_url: 'https://dev.to/0xadityaa/understanding-big-o-5foa'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
---

[Big O notation](https://en.wikipedia.org/wiki/Big_O_notation) sounds scarier than it is. It answers one question: **when the input gets bigger, how much more work does the algorithm do?** It doesn't care how fast your laptop is. It only cares about the shape of the growth. Here are the four shapes you'll run into most, each with a JavaScript example.

## O(n): the linear path

You have a list of numbers and you're hunting for one of them. You check each number, one by one, until you find it. That's O(n): the time grows in a straight line with the size of the input.

```js
let nums = [1, 2, 3, 4, 5];
let target = 4;
for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) {
        return i;
    }
}
```

More elements, more checking. Twice the list, twice the work. Simple.

## O(1): constant time

Now say you want one specific element and you already know its index. That's O(1). The time stays the same no matter how big the array is.

```js
let nums = [1, 2, 3, 4, 5];
let index = 2;
let value = nums[index]; // Should return '3'
```

You go straight to it. A list of five or five million, same effort. Lovely.

## O(n^2): quadratic time

Now picture comparing every pair of elements in a list to check some condition. That's O(n^2). The time grows with the square of the input.

```js
let nums = [1, 2, 3, 4, 5];
let target = 6;
// Finding the indices of two numbers that add up to the target
for (let i = 0; i < nums.length; i++) {
    for (let j = i+1; j < nums.length; j++) {
        if (nums[i] + nums[j] === target) {
            return [i, j];
        }
    }
}
```

The inner loop runs once for every step of the outer loop, so the comparisons pile up fast. Double the array and the work roughly quadruples. This is the one that gets you in trouble.

## O(n log n): the log-linear path

Sorting time. Most efficient sorting algorithms, like Merge Sort and Quick Sort, average out at O(n log n). JavaScript's own [`Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is in this class too, and V8 implements it with [TimSort](https://v8.dev/blog/array-sort).

```js
let nums = [5, 3, 8, 4, 2];
nums.sort((a, b) => a - b);
// Should return [2, 3, 4, 5, 8]
```

Sorting like this means splitting the list up and merging it back together, which is where the log comes from. It's a lot better than O(n^2) and a bit worse than O(n).

## What this means at real sizes

The names stay abstract until you plug in numbers. Here's the count of basic steps for each class as the input grows:

| Input size (n) | O(1) | O(n) | O(n log n) | O(n^2) |
| --- | --- | --- | --- | --- |
| 10 | 1 | 10 | 33 | 100 |
| 1,000 | 1 | 1,000 | 9,966 | 1,000,000 |
| 1,000,000 | 1 | 1,000,000 | 19,931,569 | 1,000,000,000,000 |

At ten items, nothing matters. Write whatever you want. At a million, the quadratic algorithm does a million times more work than the linear one. That gap is the entire reason this notation exists.

## Where I'd stop trusting this post

**Big O hides constants.** An O(n) algorithm with a slow step can lose to an O(n^2) one on small inputs. For an array of a few dozen items, the simple nested loop is often faster and easier to read.

**It describes growth, not time.** Cache behaviour, memory allocation, and the engine's optimiser decide how fast something really runs. When performance matters, measure with real data. Don't just reason from the notation.

**I only covered four classes, and only time.** O(log n) (binary search), exponential time, and space complexity aren't here, and worst case versus average case only gets a passing mention.

The rule I use: look at the loops. One loop over the input is O(n). A loop inside a loop is O(n^2). Anything that cuts the problem in half each step earns a log.

---

Want more data structures and algorithms? Check out my [GitHub repo](https://github.com/0xadityaa/dsa-in-js), where I'm working through Neetcode's Blind 75 in JS.
