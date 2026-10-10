export const DATA = {
  name: "Aditya Negandhi",
  initials: "AN",
  url: "https://www.0xadityaa.dev",
  repo: "https://github.com/0xadityaa/Portfolio",
  role: "Full stack engineer",
  location: "Toronto, ON",
  locationLink: "https://www.google.com/maps/place/toronto",
  description:
    "Full stack engineer and aspiring solutions architect in Toronto, building things with equal parts brain and heart, and writing about what I learn along the way.",
  about: [
    "I'm a full stack engineer and aspiring solutions architect, building things with equal parts brain and heart. Right now that means helping Enercare move legacy systems to an event-driven architecture.",
    "To me, building is more than making code work. It's about exploring systems, understanding the problem at hand, and seeing how it shapes the architecture around it. I'm endlessly curious about how people use everyday apps, what makes them stick, and how a codebase evolves as it scales.",
  ],
  avatarUrl: "/images/profile/PixelArt.png",
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
      items: ["Azure", "Azure DevOps", "GCP", "Vercel", "Docker", "GitHub Actions", "Bash", "OpenTelemetry", "Datadog", "Sentry"],
    },
    {
      label: "AI",
      items: ["Claude", "Vercel AI SDK", "LangChain", "Vertex AI", "MCP", "TensorFlow"],
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
        "I'm working across the stack with TypeScript, Nest.js, Azure, and React, helping modernize legacy systems into a reliable, event-driven architecture.",
    },
    {
      company: "Architech",
      href: "https://www.architech.ca/",
      location: "Toronto, ON",
      title: "Software Development Mentee",
      start: "Jan 2025",
      end: "May 2025",
      description:
        "I built AI-powered customer support automation with LangGraph and ReAct, made the LLM's answers sharper with semantic search (OpenAI embeddings, pgvector, HNSW), and automated CI/CD for our Python and React apps.",
    },
    {
      company: "J&M Group",
      href: "http://www.jm-group.ca",
      location: "Toronto, ON",
      title: "Software Development Intern",
      start: "Apr 2024",
      end: "Aug 2024",
      description:
        "I designed a location-aware hiring system with PostGIS, pitched in on a Next.js PWA job board, and helped look after our self-hosted Docker Swarm infrastructure.",
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
        "AI agent that repurposes long videos into social media clips using Gemini 2.5 Pro and FFMPEG.",
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
        "Multi-agent tool that automates repository tasks like documentation, Dockerization, and commit history.",
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
        "A scalable chatbot that builds knowledge graphs from scraped data to answer complex questions with citations. Built with a serverless architecture on GCP.",
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
        "Real-time financial chatbot for stock analysis and market trends with interactive charts. Built using RAG and GPT-4o.",
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
        "A local-first chess game where you can play against AI. Features real-time gameplay analysis and scalable difficulty levels.",
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
        "TypeScript-based JSON parser that validates against ECMA-404 and supports local files or APIs.",
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
        "A browser-based streaming tool that lets you stream to platforms like YouTube and Twitch without needing OBS. Handles encoding with FFMPEG on the fly.",
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
        "A mobile app for crypto paper trading using live market data. Allows you to track portfolios and set alerts without financial risk.",
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
