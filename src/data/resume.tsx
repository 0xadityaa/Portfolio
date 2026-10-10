export const DATA = {
  name: "Aditya Negandhi",
  initials: "AN",
  url: "https://www.0xadityaa.dev",
  repo: "https://github.com/0xadityaa/Portfolio",
  role: "Full stack engineer",
  location: "Toronto, ON",
  locationLink: "https://www.google.com/maps/place/toronto",
  description:
    "Full stack engineer in Toronto who can't leave things alone until I know how they work. I build stuff and write about what I figure out.",
  about: [
    "I'm a full stack engineer and aspiring solutions architect who can't leave things alone until I know how they work. I build stuff with equal parts brain and heart, and I think of engineering as architecture, just with fewer hard hats.",
    "To me, building is more than making code work. It's about exploring systems, understanding the problem at hand, and seeing how it shapes the architecture around it. I'm endlessly curious about how people use everyday apps, what makes them stick, and how a codebase evolves as it scales.",
  ],
  // What Aditya is building now. Facts come from gethivemind.xyz and its docs.
  building: {
    name: "Hivemind",
    tagline: "One memory for every AI you use.",
    href: "https://gethivemind.xyz",
    docs: "https://gethivemind.xyz/docs",
    paragraphs: [
      "Every AI tool I use starts from zero. I explain my project to Claude Code, then to Cursor, then to ChatGPT, and by Friday I've said the same thing five times. Hivemind is my fix: one memory that all of them read and write. Tell one tool something once, and the others already know.",
      "Where I'm taking it: a context layer that sits under everything you do with AI. Not a dump of your chat history. It picks what matters for the question, packs it into a token budget, and hands it over in the shape that tool expects. Switch tools mid-task and the next one gets what you decided, what's next, and what to watch out for.",
      "It plugs into coding tools over MCP, into chat sites through a browser extension, and into your own agents through an SDK. It's live, and free to start.",
    ],
    stats: [
      { value: "13", label: "AI clients set up by one command" },
      { value: "78.2%", label: "of answers found on a public memory benchmark, measured on the live service" },
      { value: "1,500", label: "tokens is the default ceiling on what a recall adds to your context" },
    ],
    stack: ["TypeScript", "Cloudflare", "Bun", "React", "MCP"],
  },
  avatarUrl: "/images/profile/avatar.png",
  stack: [
    {
      label: "Frontend",
      items: ["TypeScript", "JavaScript", "React", "Next.js", "React Native", "TanStack Query", "Redux", "Tailwind", "Storybook"],
    },
    {
      label: "Backend",
      items: ["Node", "Nest.js", "Bun", "Deno", "Spring Boot", "FastAPI", "Kafka", "WebSockets", "Dapr", "Prisma", "TypeORM"],
    },
    {
      label: "Data",
      items: ["PostgreSQL", "MySQL", "MS SQL", "MongoDB", "Redis", "Firebase", "Supabase", "Convex"],
    },
    {
      label: "Cloud",
      items: ["Azure", "Azure DevOps", "GCP", "Cloudflare", "Oracle", "Vercel", "Docker", "GitHub Actions", "Bash", "OpenTelemetry", "Datadog", "Sentry"],
    },
    {
      label: "AI",
      items: ["Claude", "Codex", "OpenCode", "Ollama", "Vercel AI SDK", "LangChain", "Vertex AI", "MCP", "TensorFlow"],
    },
    {
      label: "Testing",
      items: ["Jest", "Playwright"],
    },
  ],
  // The name in the header links home, so the nav lists only the other two pages.
  navbar: [
    { href: "/projects", label: "Projects" },
    { href: "/blog", label: "Blog" },
  ],
  contact: {
    email: "negandhi.aditya@gmail.com",
    tel: "",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/0xadityaa",
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/aditya-negandhi",
      },
      X: {
        name: "X",
        url: "https://x.com/0xadityaa",
      },
      RSS: {
        name: "RSS",
        url: "/rss.xml",
      },
      email: {
        name: "Send Email",
        url: "mailto:negandhi.aditya@gmail.com",
      },
    },
  },

  work: [
    {
      company: "Enercare",
      href: "https://www.enercare.ca/",
      location: "Markham, ON",
      title: "Associate Software Engineer",
      start: "Jul 2025",
      end: "Present",
      description:
        "Full stack, all the way down: TypeScript, Nest.js, Azure, React. Mostly I'm dragging legacy systems into a reliable, event-driven future.",
    },
    {
      company: "Architech",
      href: "https://www.architech.ca/",
      location: "Toronto, ON",
      title: "Software Development Mentee",
      start: "Jan 2025",
      end: "May 2025",
      description:
        "Built AI customer support automation with LangGraph and ReAct, got the LLM giving sharper answers with semantic search (OpenAI embeddings, pgvector, HNSW), and set up CI/CD so our Python and React apps stopped needing a babysitter.",
    },
    {
      company: "J&M Group",
      href: "http://www.jm-group.ca",
      location: "Toronto, ON",
      title: "Software Development Intern",
      start: "Apr 2024",
      end: "Aug 2024",
      description:
        "Designed a location-aware hiring system with PostGIS, shipped pieces of a Next.js PWA job board, and kept our self-hosted Docker Swarm alive and mostly happy.",
    },
  ],
  education: [
    {
      school: "Humber Polytechnic",
      href: "https://humber.ca/",
      degree: "MS Information Technology",
      start: "Jan 2023",
      end: "Aug 2024",
    },
    {
      school: "GLS University",
      href: "https://www.glsuniversity.ac.in/",
      degree: "BS Computer Applications",
      start: "Apr 2019",
      end: "Aug 2022",
    },
  ],
  projects: [
    {
      title: "Clipper",
      href: "https://github.com/0xadityaa/clipper",
      dates: "Jul 2025",
      active: true,
      description:
        "An AI agent that chops long videos into social-ready clips. Gemini 2.5 Pro does the watching, FFMPEG does the cutting.",
      technologies: [
        "Next.js",
        "PostgreSQL",
        "FastAPI",
        "Gemini 2.5 Pro",
        "Tailwind + ShadCN",
        "AWS S3",
        "FFMPEG",
        "Vercel AI SDK",
      ],
      links: [
        {
          type: "Devlog",
          href: "https://devpost.com/software/clipper-ndiy1m",
        },
        {
          type: "Website",
          href: "https://clipper-ai-omega.vercel.app/",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/clipper",
        },
      ],
      image: "/images/projects/clipper.png",
    },
    {
      title: "Gitbuddy",
      href: "https://github.com/0xadityaa/Gitbuddy",
      dates: "Jun 2025",
      active: true,
      description:
        "A crew of agents that handles the repo chores nobody wants: docs, Dockerfiles, and commit history.",
      technologies: [
        "Next.js",
        "Supabase",
        "Langchain",
        "Gemini 2.5 Flash + 2.5 Pro",
        "Tailwind + ShadCN",
      ],
      links: [
        {
          type: "Devlog",
          href: "https://devpost.com/software/gitbuddy-8feigv",
        },
        {
          type: "Website",
          href: "https://gitbuddy-dev.lovable.app/",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Gitbuddy",
        },
      ],
      image: "/images/projects/gitbuddy.png",
    },
    {
      title: "GraphRAG Chat",
      href: "https://github.com/0xadityaa/GraphRAGChat",
      dates: "May - Jun 2025",
      active: true,
      description:
        "A chatbot that scrapes the web, builds a knowledge graph, and answers the hard questions with receipts. Serverless on GCP.",
      technologies: [
        "Next.js",
        "FastAPI",
        "Spanner Graph DB",
        "Langchain",
        "Gemini 2.5 Flash",
        "Serverless",
        "Playwright",
        "GCP",
      ],
      links: [
        {
          type: "Website",
          href: "https://frontend-471866182091.us-central1.run.app",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/GraphRAGChat",
        },
      ],
      image: "/images/projects/graphrag-chat.png",
    },
    {
      title: "Finchat",
      href: "https://github.com/0xadityaa/Finchat",
      dates: "Jan - Feb 2025",
      active: true,
      description:
        "Ask it about a stock and it answers in real time, charts included. RAG and GPT-4o under the hood.",
      technologies: [
        "Python",
        "Fast API",
        "GPT-4o",
        "LangChain",
        "LangGraph",
        "Pandas",
        "Azure OpenAI",
        "Docker",
      ],
      links: [
        {
          type: "Devlog",
          href: "/blog/what-are-llms-and-how-to-build-apps-using-it",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Finchat",
        },
      ],
      image: "/images/projects/Finchat.png",
    },
    {
      title: "React Rooks",
      href: "https://github.com/0xadityaa/React-Rooks",
      dates: "Jun - Jul 2024",
      active: true,
      description:
        "Local-first chess against an AI that analyzes your game as you play. Crank the difficulty when you're feeling brave.",
      technologies: [
        "Next.js",
        "Typescript",
        "WebSockets",
        "WASM",
        "MongoDB",
        "TailwindCSS",
        "Shadcn UI",
      ],
      links: [
        {
          type: "Website",
          href: "https://chess-against-ai.vercel.app/",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/React-Rooks",
        },
      ],
      image: "/images/projects/ReactRooks.png",
    },
    {
      title: "JSON Parser",
      href: "https://github.com/0xadityaa/json-parser",
      dates: "Dec 2024 - Jan 2025",
      active: true,
      description:
        "A JSON parser I wrote from scratch in TypeScript. Validates against ECMA-404 and eats local files or APIs.",
      technologies: [
        "Deno",
        "Typescript",
        "Tokenizer",
        "Parser",
        "AST",
        "ECMA-404",
        "JSON",
      ],
      links: [
        {
          type: "Devlog",
          href: "/blog/implementing-a-json-parser",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/json-parser",
        },
      ],
      image: "/images/projects/json-parser.png",
    },
    {
      title: "Byte Cast",
      href: "https://github.com/0xadityaa/Byte-Cast",
      dates: "March 2024",
      active: true,
      description:
        "Stream to YouTube and Twitch straight from the browser, no OBS required. FFMPEG handles the encoding on the fly.",
      technologies: [
        "Node.js",
        "FFMPEG",
        "Docker",
        "Socket.io",
        "React",
        "Remix",
        "AWS",
      ],
      links: [
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Byte-Cast",
        },
      ],
      image: "/images/projects/Bytecast.png",
    },
    {
      title: "Crypto Maniac",
      href: "https://github.com/0xadityaa/Crypto-Maniac",
      dates: "Jul 2021 - Jan 2022",
      active: true,
      description:
        "Paper-trade crypto with live market data. Track a portfolio, set alerts, lose zero real dollars.",
      technologies: [
        "Flutter",
        "Firebase",
        "FCM",
        "GCP",
        "Firestore",
        "Android",
        "iOS",
      ],
      links: [
        {
          type: "Devlog",
          href: "https://docs.google.com/document/d/11gGMB3EVEGWfyBg2vHAreBNJFQk7ecJCeQyt98Mv0Vs/edit?usp=sharing",
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Crypto-Maniac",
        },
      ],
      image: "/images/projects/Crypto-Maniac.png",
    },
  ],
} as const;
