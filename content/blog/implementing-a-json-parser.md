---
title: Implementing a JSON Parser
publishedAt: '2024-11-15'
summary: >-
  A JSON parser is two small programs: a tokenizer and a recursive descent
  parser. Both built in TypeScript on Deno and tested against the JSON grammar.
tags:
  - computer science
updated: '2026-10-09'
crosspost_issue: 'https://github.com/0xadityaa/Portfolio/issues/90'
devto_url: 'https://dev.to/0xadityaa/implementing-a-json-parser-2od8'
---

Ever wondered how applications understand and process data from APIs? The magic often lies in a data format called JSON. This human-readable format is widely used to transmit data over the internet. But how do computers interpret this data? That's where JSON parsers come in.

In this devlog, we'll implement a JSON parser using **Deno** and **Typescript** which can parse local JSON files as well as JSON responses from an API. The thing I want you to take away: **a parser is two small programs. A tokenizer turns characters into tokens, and a recursive function per grammar rule turns tokens into a tree.** JSON's grammar is small enough to see the whole idea in one sitting.

## What is JSON and why is it everywhere? 🤔

[JSON](https://www.json.org/json-en.html), or _JavaScript Object Notation_, is a lightweight, text-based data-interchange format. It's the de facto standard for data transmission over the internet, especially in APIs. Its simplicity and readability make it a favorite among developers.

- **Language-Independent:** It's not tied to any specific programming language.
- **Data Structures:** It allows for complex data structures, making it versatile.
- **Efficient Parsing:** It's relatively easy to parse, leading to fast processing.

```json
//  This is what a valid JSON looks like:
{
  "name": "Alice",
  "age": 25,
  "isDeveloper": true
}
```

Its use cases range from transmitting API responses to saving application settings. But how does software make sense of JSON? That's where parsers come into play.

## What is a Parser? 🧐

At its core, a parser is a program that converts text into a structured format and rejects anything that does not follow the grammar. For JSON, the parser's job is to transform raw strings into usable objects or data structures. The process typically involves two steps:

1. **Tokenizing (Lexical Analysis):** Breaking the input into meaningful chunks called tokens (e.g. `{`, `"name"`, `:`, `"Alice"`).
2. **Parsing (Constructing AST's):** Arranging these tokens into a hierarchical structure, known as an Abstract Syntax Tree (AST), that represents the JSON data.

#### Example:

```json
// Here's a JSON snippet:
{ "id": 1, "isActive": true }
```

After tokenizing, it becomes:

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

After parsing, the **Abstract Syntax Tree (AST)** looks like this:

```typescript
{
  type: "Object",
  value: {
    id: { type: "Number", value: 1 },
    isActive: { type: "Boolean", value: true }
  }
}
```

Here's a visual flow of parsing a **_valid JSON_** :
![Valid JSON Parser Flow](/images/blog/json-valid.png "Valid JSON Parser Flow")

Here's a visual flow of parsing a **_invalid JSON_** :
![Invalid JSON Parser Flow](/images/blog/json-invalid.png "Invalid JSON Parser Flow")

## Implementing a JSON Parser using Deno and Typescript 🛠️

Using [Deno](https://deno.com/) because, it comes with out-of-the-box support for Typescript and lots of other cool tools like test-runners, coverage-checker etc.

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

### Implementing Tokenizer _(Lexical Analysis)_

Tokenizing is always the first step when writing your own interpreter or compiler. Even your favorite prettifiers tokenize the entire file before prettifying it. Tokenizing involves breaking the code or input into smaller, understandable parts. This is essential because it allows the parser to determine where to start and stop during the parsing process.

Tokenizing helps us understand the structure of the code or input being processed. By breaking it down into tokens, such as keywords, symbols, and literals, we gain insight into the underlying components. Additionally, tokenizing plays a crucial role in error handling. By identifying and categorizing tokens, we can detect and handle syntax errors more effectively.

It is important to _only use the grammar provided in [ECMA-404](https://ecma-international.org/publications-and-standards/standards/ecma-404/) for tokenizing JSON_ (the diagrams on [json.org](https://www.json.org/json-en.html) are the same grammar drawn out). This ensures that the tokenizer can correctly identify and categorize JSON tokens.

Here's an example of how `tokenizer.ts` file looks:

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

### Implementing Parser _(Constructing AST's)_

The parser is where we make sense out of our tokens. Now we have to build our Abstract Syntax Tree (AST). The AST represents the structure and meaning of the code in a hierarchical tree-like structure. It captures the relationships between different elements of the code, such as statements, expressions, and declarations.

Here's an example of how `parser.ts` file looks:

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

### Testing our JSON Parser

In order to ensure that our parser is working correctly and supporting all the **_ECMA-404 Standards_**, we need to write tests. We also need to check for edge cases like `\n`, `\t`, `\r`, `\f`, and `\b` characters for Strings, `-` for negative numbers and so on.

Here's an example of how `main_test.ts` file looks:

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

## Learnings from this project 📚

We learned about the crucial concept of tokenizing, breaking down the code into smaller, understandable parts. This sets the foundation for the parser to work its magic.

Our tokenizer expertly handles JSON strings and produces an array of tokens that capture the essence of the data structure.

Moving on to the parser, we built an Abstract Syntax Tree (AST) that neatly organizes the key-value pairs and nested structures of the JSON data.

So, with our tokenizer and parser working hand in hand, we can confidently say that we've successfully crafted our very own JSON parser!

## Where this stops applying

**Passing my tests is not the same as being correct.** The tests above cover the cases I thought of. [JSONTestSuite](https://github.com/nst/JSONTestSuite) has hundreds of files that real parsers disagree on, and it is the honest benchmark for any parser that claims to follow the standard.

**The standards leave things open.** ECMA-404 defines the syntax only. [RFC 8259](https://datatracker.ietf.org/doc/html/rfc8259) adds interoperability advice and still leaves choices to the implementer: what to do with duplicate keys, how large a number may be, how deep nesting can go. This parser makes those choices implicitly.

**Recursive descent has a depth limit.** Each nested array or object is another function call, so a document nested deeply enough will overflow the call stack. Production parsers either cap the depth or use an explicit stack.

**Do not use this in production.** `JSON.parse` is implemented in native code and heavily optimised. The reason to write your own is to understand the one you already have.

---

If you are curious to check out full code, here's the [GitHub Repo](https://github.com/0xadityaa/json-parser).

✌️ Stay curious, Keep coding, Peace nerds!

*Updated 9 October 2026: fixed a broken sentence, pointed the ECMA-404 link at the standard itself, and added the section on where this stops applying.*
