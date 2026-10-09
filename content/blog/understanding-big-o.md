---
title: Understanding Big O
publishedAt: '2024-09-23'
summary: >-
  Big O describes how an algorithm's work grows as its input grows. Four common
  classes with JavaScript examples, and a table of what they mean at real sizes.
tags:
  - dsa
updated: '2026-10-09'
---


[Big O notation](https://en.wikipedia.org/wiki/Big_O_notation) answers one question: **when the input gets bigger, how much more work does the algorithm do?** It ignores how fast your machine is and looks only at the shape of the growth. Here are the four shapes you will meet most often, each with a JavaScript example.

## O(n): The Linear Path

Imagine you have a list of numbers and you need to find a specific number. You check each number one by one until you find the target. This is O(n), where the execution time of an algorithm grows linearly with the size of the input data.

```js
let nums = [1, 2, 3, 4, 5];
let target = 4;
for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) {
        return i;
    }
}
```

In this example, your search time increases directly with the number of elements in the array. Simple and straightforward!

## O(1): The Constant Time

Now, imagine you need to access a specific element in an array by its index. This is O(1), where the execution time remains constant regardless of the input size.

```js
let nums = [1, 2, 3, 4, 5];
let index = 2;
let value = nums[index]; // Should return '3'
```

Here, you instantly access the element without any extra effort. Efficient and swift!

## O(n^2): The Quadratic Time

Picture yourself needing to compare every pair of elements in a list to find a specific condition. This is O(n^2), where the execution time grows quadratically with the input size.

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

The inner loop runs for every step of the outer loop, so the number of comparisons grows with the square of the input. Double the array and the work roughly quadruples.

## O(n log n): The Log-Linear Path

Consider the scenario where you need to sort a list of numbers. Many efficient sorting algorithms, like Merge Sort and Quick Sort, have an average time complexity of O(n log n). JavaScript's own [`Array.prototype.sort`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) is in this class too; V8 implements it with [TimSort](https://v8.dev/blog/array-sort). This means the execution time grows in a log-linear fashion with the size of the input data.

```js
let nums = [5, 3, 8, 4, 2];
nums.sort((a, b) => a - b);
// Should return [2, 3, 4, 5, 8]
```

In this example, the sorting operation involves dividing the list and merging it back, resulting in a log-linear time complexity. It's more efficient than O(n^2) but more complex than O(n).

## What the classes mean at real sizes

The names are abstract until you put numbers in. This is the count of basic steps for each class as the input grows:

| Input size (n) | O(1) | O(n) | O(n log n) | O(n^2) |
| --- | --- | --- | --- | --- |
| 10 | 1 | 10 | 33 | 100 |
| 1,000 | 1 | 1,000 | 9,966 | 1,000,000 |
| 1,000,000 | 1 | 1,000,000 | 19,931,569 | 1,000,000,000,000 |

At ten items nothing matters. At a million, the quadratic algorithm does a million times more work than the linear one. That gap is the whole reason the notation exists.

## Where this stops applying

**Big O hides constants.** An O(n) algorithm with a slow step can lose to an O(n^2) one on small inputs. For arrays of a few dozen items, the simple nested loop is often the faster and clearer choice.

**It describes growth, not time.** Cache behaviour, memory allocation, and the engine's optimiser decide real speed. When performance matters, measure with real data instead of reasoning from the notation alone.

**This post covers four classes and only time.** O(log n) (binary search), exponential time, and space complexity are missing, and worst case versus average case is only mentioned in passing.

The rule I use: look at the loops. One loop over the input is O(n), a loop inside a loop is O(n^2), and anything that halves the problem each step earns a log.

---

If you want to learn more about Data Structures and Algorithms, check out my [GitHub Repo](https://github.com/0xadityaa/dsa-in-js) where I'm diving into Neetcode's blind 75 problems using JS.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: corrected the explanation of quadratic growth, added the table of step counts and sources, and added the section on where this stops applying.*
