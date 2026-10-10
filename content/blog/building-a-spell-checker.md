---
title: Building a Spell Checker
publishedAt: '2024-11-11'
summary: >-
  A spell checker is edit distance plus a dictionary. How Levenshtein distance
  works, with code and a visualizer that shows the matrix filling in.
tags:
  - algorithms
updated: '2026-10-09'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
devto_url: 'https://dev.to/0xadityaa/building-a-spell-checker-3i19'
---

Hey fellow devs! 👋 Let me tell you about my recent adventure with the [Levenshtein's Distance algorithm](https://en.wikipedia.org/wiki/Levenshtein_distance). You know those moments when you discover something that makes you go _"Wow, that's actually pretty cool?"_ This was one of those moments.

The idea in one line: **a spell checker is an edit-distance function plus a dictionary. Measure how many single-character edits separate the typed word from each known word, and suggest the closest ones.**

## The Discovery 🔍

There I was, grinding through DSA problems (like we all do), when I encountered the Levenshtein Distance algorithm. At first glance, it seemed like just another dynamic programming problem to add to my interview prep arsenal. But as I dug deeper, I discovered something fascinating: this algorithm is actually the backbone of spell checkers! You know, that thing that saves us from embarrassing typos in MS Word?

## The Lightbulb Moment 💡

I immediately thought, "What if I could actually *see* this algorithm in action?" Not just the input and output, but the whole process. That's when I decided to build a spell checker visualizer. Nothing fancy, just something to help me (and maybe others) understand how this algorithm thinks. You can check out the live demo [here](https://levenshtein-spell-checker.vercel.app/) or explore the [source code on GitHub](https://github.com/0xadityaa/levenshtein-spell-checker).

## The Algorithm: Understanding Levenshtein Distance

### How It Works (Time Complexity: O(m*n))

Imagine you're comparing two words and want to know how many changes it takes to turn one word into another. Let's break it down using "wrld" and "world" as an example:

1. First, we create a grid (matrix) where:
   - The first row represents the letters of the first word (plus an empty space)
   - The first column represents the letters of the second word (plus an empty space)
2. We fill the first row and column with counting numbers (0,1,2,3...). This represents how many changes it would take to transform an empty string into each letter sequence.
3. Then comes the interesting part. For each cell in the grid, we look at the corresponding letters and ask: **"Are these letters the same?"**
    - If they are **SAME**:
        - We copy the number from the diagonal upper-left cell
    - If they are **DIFFERENT**:
        - We look at three nearby cells (up, left, and diagonal upper-left)
        - Take the smallest number among them
        - Add 1 to it
4. The number in the bottom-right cell gives us our final answer - the minimum number of changes needed.

### Basic implementation of the algorithm:

```typescript
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  // Matrix initialization
  for (let i = 0; i <= str1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= str2.length; j++) {
    matrix[0][j] = j;
  }

  // The magic happens here
  for (let i = 1; i <= str1.length; i++) {
    for (let j = 1; j <= str2.length; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] =
          Math.min(
            matrix[i - 1][j - 1], // substitution
            matrix[i][j - 1],     // insertion
            matrix[i - 1][j]      // deletion
          ) + 1;
      }
    }
  }

  return matrix[str1.length][str2.length];
}
```

### Dictionary Implementation

Here's a simple example of how the dictionary structure works:

```typescript
interface Dictionary {
  words: Set<string>;
}

const dictionary: Dictionary = {
  words: new Set([
    'world',
    'hello',
    'programming',
    // ... more words
  ])
};
```

## Building the Visualizer 🛠️

I grabbed my favorite tools for the job:

- **Vite + React**: (because who doesn't love a speedy DX?)
- **TypeScript**: (to keep my errors honest)
- **Tailwind CSS + ShadCn UI**: (for that clean, modern look, yes with a dark mode!)

The core functionality is pretty straightforward:

1. User types some text
2. The app spots the misspelled words
3. Here's the cool part, it shows the Levenshtein matrix for each suggestion!

### Visualization of the algorithm:
![Interactive matrix visualization showing the Levenshtein distance calculation between 'wrld' and 'world'](/images/blog/matrix.jpeg "Levenshtein Distance Matrix")

## Alternative Approaches

While Levenshtein Distance is great, there are other spell-checking algorithms worth mentioning:

- [**Damerau-Levenshtein Distance**](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance): Handles transposition of adjacent characters
- **Soundex**: Matches words that sound similar
- **N-gram similarity**: Useful for handling larger texts and finding similar phrases

## Where this stops applying

**Comparing against every word does not scale.** The matrix costs O(m*n) per pair, and a naive checker runs it against the whole dictionary for every typo. That is fine for a hardcoded word list and far too slow for a real one. The standard fix is to index the dictionary so most words are never compared, for example with a [BK-tree](https://en.wikipedia.org/wiki/BK-tree).

**Plain Levenshtein gets common typos wrong.** Swapping two adjacent letters ("teh") counts as two edits, so it can rank a worse suggestion first. It also knows nothing about which words are common. Peter Norvig's [spelling corrector](https://norvig.com/spell-correct.html) shows how much word frequency matters, in about twenty lines of Python.

**It checks words, not sentences.** "Their" for "there" is spelled correctly and will never be flagged. Context needs a language model, which is a different tool.

## The Final Thoughts 💭

Is it basic? Absolutely! The dictionary is hardcoded, and it won't be replacing Grammarly anytime soon. But that was never the goal. I wanted to see the algorithm in action, to understand how it transforms "wrld" into "world" one edit at a time. And you know what? It works!

## Learnings from this project 📚

Sometimes the simplest projects are the most satisfying. This wasn't about building the next big thing; it was about taking an algorithm from the realm of interview prep and watching it solve real problems.

Remember: Not every project needs to change the world. Sometimes, just understanding how things work is rewarding enough!

So here's to the small wins, the *"aha"* moments, and the joy of seeing algorithms come to life! 

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: stated the core idea up front, added sources, and added the section on where this stops applying.*
