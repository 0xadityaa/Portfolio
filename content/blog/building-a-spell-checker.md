---
title: 'I Built a Spell Checker to Watch an Algorithm Think'
publishedAt: '2024-11-11'
summary: 'A spell checker is edit distance plus a dictionary. Here''s how Levenshtein distance works, with code and a visualizer that shows the matrix filling in.'
tags:
  - algorithms
  - typescript
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
devto_url: 'https://dev.to/0xadityaa/building-a-spell-checker-3i19'
---

Hey fellow devs! 👋 Let me tell you about my little adventure with the [Levenshtein distance algorithm](https://en.wikipedia.org/wiki/Levenshtein_distance). You know those moments when you find something that makes you go *"wait, that's actually pretty cool"*? This was one of those.

The idea in one line: **a spell checker is an edit-distance function plus a dictionary. Count how many single-character edits separate the typed word from each known word, and suggest the closest ones.**

## The discovery

There I was, grinding through DSA problems (like we all do), when I ran into Levenshtein distance. At first it looked like one more dynamic programming problem to stuff into my interview prep. Then I dug a little deeper and found out this algorithm is the backbone of spell checkers. You know, the thing that saves us from embarrassing typos in MS Word.

## The lightbulb moment

My first thought was, "What if I could actually *see* this algorithm work?" Not just input and output, but the whole process. So I built a spell checker visualizer. Nothing fancy, just something to help me (and maybe you) understand how the algorithm thinks. There's a [live demo](https://levenshtein-spell-checker.vercel.app/), and the [source is on GitHub](https://github.com/0xadityaa/levenshtein-spell-checker).

## The algorithm: Levenshtein distance

### How it works (time complexity: O(m*n))

Say you're comparing two words and you want to know how many changes it takes to turn one into the other. Let's use "wrld" and "world".

1. Make a grid (a matrix) where:
   - The first row is the letters of the first word, plus an empty slot.
   - The first column is the letters of the second word, plus an empty slot.
2. Fill the first row and first column with 0, 1, 2, 3 and so on. That's how many changes it takes to get from an empty string to each prefix.
3. Now the fun part. For each cell, look at the two letters it lines up with and ask: **"Are these the same?"**
    - If they're the **SAME**:
        - Copy the number from the diagonal upper-left cell.
    - If they're **DIFFERENT**:
        - Look at three neighbours (up, left, and diagonal upper-left).
        - Take the smallest number.
        - Add 1.
4. The number in the bottom-right cell is your answer: the minimum number of changes.

### A basic implementation

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

### The dictionary

Here's a simple example of how the dictionary is set up:

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

## Building the visualizer

I grabbed my favourite tools for the job:

- **Vite + React** (because who doesn't love a speedy dev experience?)
- **TypeScript** (to keep my errors honest)
- **Tailwind CSS + shadcn/ui** (for a clean look, and yes, there's dark mode)

What it does is pretty simple:

1. You type some text.
2. The app spots the misspelled words.
3. And the cool part: it shows the Levenshtein matrix for each suggestion.

### What it looks like

![Interactive matrix visualization showing the Levenshtein distance calculation between 'wrld' and 'world'](/images/blog/matrix.jpeg "Levenshtein Distance Matrix")

## Other ways to do it

Levenshtein is great, but it's not the only game in town:

- [**Damerau-Levenshtein distance**](https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance): also handles two adjacent letters being swapped.
- **Soundex**: matches words that sound alike.
- **N-gram similarity**: useful for longer text and for finding similar phrases.

## Where I'd stop trusting this post

**Comparing against every word doesn't scale.** The matrix costs O(m*n) per pair, and a naive checker runs it against the entire dictionary for every typo. Fine for a hardcoded word list, way too slow for a real one. The usual fix is to index the dictionary so most words never get compared, for example with a [BK-tree](https://en.wikipedia.org/wiki/BK-tree).

**Plain Levenshtein gets common typos wrong.** Swapping two adjacent letters ("teh") counts as two edits, so it can rank a worse suggestion first. It also has no idea which words are common. Peter Norvig's [spelling corrector](https://norvig.com/spell-correct.html) shows how much word frequency matters, in about twenty lines of Python.

**It checks words, not sentences.** "Their" when you meant "there" is spelled correctly and will never get flagged. Context needs a language model, and that's a different tool.

## The takeaway

Is it basic? Absolutely. The dictionary is hardcoded and it won't be replacing Grammarly any time soon. But that was never the goal. I wanted to watch the algorithm turn "wrld" into "world" one edit at a time. And you know what? It works.

Sometimes the simplest projects are the most satisfying. This wasn't about building the next big thing. It was about taking an algorithm out of interview prep and watching it solve a real problem.

Not every project has to change the world. Sometimes just understanding how a thing works is reward enough. So here's to the small wins, the *"aha"* moments, and the joy of seeing an algorithm come to life.

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 10 October 2026: rewrote this in plainer language and gave it a new title. The core idea, sources, and limits section were added on 9 October 2026.*
