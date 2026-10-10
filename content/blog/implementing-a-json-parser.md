---
title: 'I Wrote a JSON Parser From Scratch'
publishedAt: '2024-11-15'
summary: 'A JSON parser is two small programs: a tokenizer and a recursive descent parser. I built both in TypeScript on Deno to see how they tick.'
tags:
  - computer science
  - typescript
  - parsers
updated: '2026-10-10'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
devto_url: 'https://dev.to/0xadityaa/implementing-a-json-parser-2od8'
---

Ever wondered how an app actually understands the data an API sends it? Most of the time that data is JSON, a human-readable format that's all over the internet. But computers don't read "human-readable". Something has to turn that text into real data. That something is a JSON parser.

In this devlog I build one with **Deno** and **TypeScript**. It can parse local JSON files and JSON responses from an API. The thing I want you to walk away with: **a parser is two small programs. A tokenizer turns characters into tokens, and one recursive function per grammar rule turns tokens into a tree.** JSON's grammar is small enough that you can see the whole idea in one sitting.

## What is JSON, and why is it everywhere?

[JSON](https://www.json.org/json-en.html), or *JavaScript Object Notation*, is a lightweight, text-based format for exchanging data. It's the default for sending data around the internet, especially through APIs. Devs love it because it's simple and easy to read.

- **Language-independent.** It isn't tied to any one programming language.
- **Real data structures.** You can nest objects and arrays as deep as you need.
- **Easy to parse.** Which makes it fast to process.

```json
//  This is what a valid JSON looks like:
{
  "name": "Alice",
  "age": 25,
  "isDeveloper": true
}
```

You'll find it in API responses, config files, saved app settings, you name it. So how does software make sense of it? Parsers.

## What's a parser?

A parser is a program that turns text into structured data, and rejects anything that doesn't follow the grammar. For JSON, its job is to turn a raw string into objects you can use. That usually happens in two steps:

1. **Tokenizing (lexical analysis).** Chop the input into meaningful chunks called tokens, like `{`, `"name"`, `:`, `"Alice"`.
2. **Parsing (building an AST).** Arrange those tokens into a tree, called an Abstract Syntax Tree (AST), that represents the data.

#### Example

```json
// Here's a JSON snippet:
{ "id": 1, "isActive": true }
```

After tokenizing, it looks like this:

```typescript
[
  { type: "BraceOpen", value: "{" },
  { type: "String", value: "id" },
  { type: "Colon", value: ":" },
  { type: "Number", value: "1" },
  { type: "Comma", value: "," },
  { type: "String", value: "isActive" },
  { type: "Colon", value: ":" },
  { type: "True", value: "true" },
  { type: "BraceClose", value: "}" },
];
```

And after parsing, the **Abstract Syntax Tree (AST)** looks like this:

```typescript
{
  type: "Object",
  value: {
    id: { type: "Number", value: 1 },
    isActive: { type: "Boolean", value: true }
  }
}
```

Here's the flow for a ***valid*** JSON:

![Valid JSON Parser Flow](/images/blog/json-valid.png "Valid JSON Parser Flow")

And for an ***invalid*** one:

![Invalid JSON Parser Flow](/images/blog/json-invalid.png "Invalid JSON Parser Flow")

## Building it with Deno and TypeScript

I went with [Deno](https://deno.com/) because it supports TypeScript out of the box and ships with handy tools like a test runner and a coverage checker.

```bash
# The project structure is as follows:

/json-parser
      ├── main.ts          # Entry point for the application
      ├── parser.ts        # Contains the parser logic
      ├── tokenizer.ts      # Contains the tokenizer logic
      ├── types.ts         # Type definitions for tokens and AST nodes
      └── utils.ts         # Utility functions for type checking
      │
      ├── main_test.ts     # Contains tests for the parser and tokenizer
      └── test-data.json   # Sample JSON data for testing
      │
      ├── deno.json                # Deno configuration file
      ├── .vscode/settings.json     # VSCode settings for Deno
      └── deno.lock                # Deno lock file for dependencies
```

### The tokenizer (lexical analysis)

Tokenizing is always step one when you write an interpreter or a compiler. Even your favourite code formatter tokenizes the whole file before it prettifies anything. You're breaking the input into small parts the parser can reason about, so it knows where each thing starts and stops.

It also gives you the structure of the input: keywords, symbols, literals. And it's a big part of error handling. Once you can identify and categorise tokens, catching syntax errors gets a lot easier.

One rule here: *only use the grammar from [ECMA-404](https://ecma-international.org/publications-and-standards/standards/ecma-404/) when tokenizing JSON*. (The diagrams on [json.org](https://www.json.org/json-en.html) are the same grammar, drawn out.) That's how you make sure the tokenizer recognises JSON tokens correctly.

Here's what `tokenizer.ts` looks like:

```typescript
export const tokenizer = (input: string): Token[] => {
  let current = 0;
  const tokens: Token[] = [];

  while (current < input.length) {
    let char = input[current];

    if (char === "{") {
      tokens.push({ type: "BraceOpen", value: char });
      current++;
      continue;
    }
    // handlers for other token types (e.g., strings, numbers, etc.)
  }
};
```

### The parser (building the AST)

The parser is where the tokens start to mean something. Now we build the Abstract Syntax Tree. The AST captures the structure of the data as a tree, with the relationships between all the pieces: which values belong to which keys, what's nested inside what.

Here's what `parser.ts` looks like:

```typescript
function parseValue(): ASTNode {
  const token = tokens[current];
  switch (token.type) {
    case "String":
      return { type: "String", value: token.value };
    case "Number":
      return { type: "Number", value: Number(token.value) };
    case "True":
      return { type: "Boolean", value: true };
    case "False":
      return { type: "Boolean", value: false };
    case "Null":
      return { type: "Null" };
    case "BraceOpen":
      return parseObject(); // recursive fn
    case "BracketOpen":
      return parseArray(); // recursive fn
    default:
      throw new Error(`Unexpected token type: ${token.type}`);
  }
}
```

### Testing it

To check the parser works and actually follows the ***ECMA-404 standard***, we need tests. And we need the annoying edge cases too: `\n`, `\t`, `\r`, `\f`, and `\b` in strings, `-` for negative numbers, and so on.

Here's what `main_test.ts` looks like:

```typescript
Deno.test("parser should correctly parse an array with mixed types", () => {
  const jsonString = `[-1, "string\n\t\r\f\b", true, null, {}]`;
  const tokens = tokenizer(jsonString);
  const ast: ASTNode = parser(tokens);

  assertEquals(ast, {
    type: "Array",
    value: [
      { type: "Number", value: -1 },
      { type: "String", value: "string\n\t\r\f\b" },
      { type: "Boolean", value: true },
      { type: "Null" },
      { type: "Object", value: {} },
    ],
  });
});

Deno.test("parser should throw an error for invalid JSON", () => {
  const jsonString = `{
    "key": "value",
    "invalid": 
  }`;

  const tokens = tokenizer(jsonString);

  try {
    parser(tokens);
    throw new Error("Expected an error to be thrown for invalid JSON");
  } catch (e) {
    assertEquals((e as Error).message, "Unexpected token type: BraceClose");
  }
});

// More tests...
```

## What I learned

Tokenizing is the foundation. Break the input into small, understandable parts and the parser's job becomes manageable.

The tokenizer takes a JSON string and hands back an array of tokens that describe the structure of the data. The parser takes those tokens and builds an AST that neatly organises the key-value pairs and nested structures.

Put the two together and, yep, that's a JSON parser. I built one. Feels good.

## Where I'd stop trusting this post

**Passing my tests isn't the same as being correct.** My tests cover the cases I thought of. [JSONTestSuite](https://github.com/nst/JSONTestSuite) has hundreds of files that real parsers disagree on, and it's the honest benchmark for any parser that claims to follow the standard.

**The standards leave things open.** ECMA-404 defines the syntax only. [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259) adds interoperability advice and still leaves choices to whoever's implementing it: what to do with duplicate keys, how big a number can be, how deep nesting can go. My parser makes those choices without telling you.

**Recursive descent has a depth limit.** Every nested array or object is another function call, so a deep enough document will blow the call stack. Production parsers either cap the depth or use an explicit stack.

**Please don't use this in production.** `JSON.parse` is native code and heavily optimised. The reason to write your own is to understand the one you already have.

---

Want the full code? Here's the [GitHub repo](https://github.com/0xadityaa/json-parser).

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 10 October 2026: rewrote this in plainer language and gave it a new title. A broken sentence, the ECMA-404 link, and the limits section were fixed or added on 9 October 2026.*
