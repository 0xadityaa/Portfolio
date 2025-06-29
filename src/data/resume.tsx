import { Icons } from "@/components/icons";
import { CodeIcon, HomeIcon, NotebookIcon, FileDownIcon } from "lucide-react";

export const DATA = {
  name: "Aditya Negandhi",
  initials: "AN",
  url: "https://0xadityaa.xyz",
  location: "Toronto, ON",
  locationLink: "https://www.google.com/maps/place/toronto",
  description:
    "Converting coffee into code, I craft elegant and scalable software solutions, turning ideas into impactful products.",
  summary:
    "Hello! Namaste! Bonjour! I&apos;m a passionate full-stack developer and architect from the vibrant heart of India 🇮🇳, currently based in Toronto 🇨🇦. At work, I blend code and creativity, transforming ideas into captivating digital products. Beyond work, I immerse myself in the whimsical realms of nature ⛰️, music 🥁, and games 🎮, where every hike, new beat, and winning move connects a dot in my creative journey.",
  avatarUrl: "/Me.jpeg",
  skills: [
    "React",
    "Next",
    "Remix",
    "Node",
    "Bun",
    "Deno",
    "Javascript",
    "Typescript",
    "React Query",
    "Redux",
    "Tailwind",
    "Jest",
    "Playwright",
    "Sentry",
    "Storybook",
    "Java",
    "Spring Boot",
    "Docker",
    "Microservices",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "DynamoDB",
    "Firebase",
    "Supabase",
    "Convex",
    "Redis",
    "Kafka",
    "WebSockets",
    "ORM's [Prisma, Drizzle, Hibernate, SQLAlchemy]",
    "Git",
    "GitHub Actions",
    "Azure",
    "GCP",
    "Vercel",
    "LangChain",
    "LangGraph",
    "Vertex AI",
    "MCP",
    "Vector (Semantic) Search",
    "Opentelemetry",
    "Datadog",
  ],
  navbar: [
    { href: "/", icon: HomeIcon, label: "Home" },
    { href: "/projects", icon: CodeIcon, label: "Projects" },
    { href: "/blog", icon: NotebookIcon, label: "Blog" },
  ],
  contact: {
    email: "negandhi.aditya@gmail.com",
    tel: "",
    social: {
      GitHub: {
        name: "GitHub",
        url: "https://github.com/0xadityaa",
        icon: Icons.github,

        navbar: true,
      },
      LinkedIn: {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/aditya-negandhi",
        icon: Icons.linkedin,
        navbar: true,
      },
      X: {
        name: "X",
        url: "https://x.com/0xadityaa",
        icon: Icons.x,

        navbar: true,
      },
      email: {
        name: "Send Email",
        url: "mailto:negandhi.aditya@gmail.com",
        icon: Icons.email,
        navbar: false,
      },
    },
  },

  work: [
    {
      company: "Architech",
      href: "https://www.architech.ca/",
      location: "Toronto, ON",
      title: "Software Development Mentee",
      logoUrl: "/architech.png",
      start: "Jan 2025",
      end: "May 2025",
      description:
        "Developed AI-powered customer support automation using LangGraph/ReAct for diverse query handling and agentic workflows. Improved LLM performance via Semantic Search with OpenAI embeddings/pgvector/HNSW. Implemented human escalation and automated CI/CD pipelines for Python/React apps using Azure DevOps/GitHub Actions.",
    },
    {
      company: "J&M Group",
      href: "http://www.jm-group.ca",
      location: "Toronto, ON",
      title: "Software Development Intern",
      logoUrl: "/j&m.png",
      start: "Apr 2024",
      end: "Aug 2024",
      description:
        "Designed and implemented a PostGIS-based location-aware system optimizing job seeker placement for faster hiring cycles. Built a PWA job board UI using React/Typescript/Tailwind/ShadCn. Enabled self-hosted Next.js deployment with dependencies (Supabase, Redis, RabbitMQ) via Docker Swarm on Linux.",
    },
  ],
  education: [
    {
      school: "Humber College",
      href: "https://humber.ca/",
      degree: "Information Technology Solutions",
      logoUrl: "/humber.png",
      start: "Jan 2023",
      end: "Aug 2024",
    },
    {
      school: "GLS University",
      href: "https://www.glsuniversity.ac.in/",
      degree: "Bachelor's of Computer Applications",
      logoUrl: "/gls.png",
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
        "Clipper is an AI agent designed to help content creators effortlessly repurpose long-form video content such as podcasts, interviews, and live streams into engaging, bite-sized clips for platforms like TikTok, Instagram Reels, and YouTube Shorts.",
      technologies: [
        "Next.js",
        "PostgreSQL",
        "FastAPI",
        "Gemini 2.5 Pro",
        "Tailwind + ShadCN",
        "AWS S3",
        "FFMPEG",
        "Inngest",
      ],
      links: [
        {
          type: "Devlog",
          href: "https://devpost.com/software/clipper-ndiy1m",
          icon: <Icons.notion className="size-3" />,
        },
        {
          type: "Website",
          href: "https://clipper-ai-omega.vercel.app/",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/clipper",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/clipper.png",
    },
    {
      title: "Gitbuddy",
      href: "https://github.com/0xadityaa/Gitbuddy",
      dates: "Jun 2025",
      active: true,
      description:
        "A Multi-Agent devtool that helps automate tedious tasks maintaining github repos. It can create and update Readmes, Dockerize the project for easy local dev, and generate a llm.txt file summarizing the version-controll history of project to pass on to other AI agents.",
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
          icon: <Icons.notion className="size-3" />,
        },
        {
          type: "Website",
          href: "https://gitbuddy-dev.lovable.app/",
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Gitbuddy",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/gitbuddy.png",
    },
    {
      title: "GraphRAG Chat",
      href: "https://github.com/0xadityaa/GraphRAGChat",
      dates: "May - Jun 2025",
      active: true,
      description:
        "A scalable GraphRAG Chatbot that scrapes site data, builds a knowledge graph, and uses it to answer semantic and multi-document relational questions and provide citations as site links. Auto-scales Frontend, Backend, and DB as needed.",
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
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/GraphRAGChat",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/graphrag-chat.png",
    },
    {
      title: "Finchat",
      href: "https://github.com/0xadityaa/Finchat",
      dates: "Jan - Feb 2025",
      active: true,
      description:
        "A smart chatbot that helps you analyze stocks and financial markets in real-time. Chat naturally to get live stock prices, company insights, and market trends with interactive charts and data visualizations. Built using RAG architecture and OpenAI's GPT-4o.",
      technologies: [
        "Python",
        "Fast API",
        "Streamlit",
        "LangChain",
        "LangGraph",
        "Pandas",
        "Azure OpenAI",
        "Docker",
      ],
      links: [
        {
          type: "Devlog",
          href: "https://www.0xadityaa.xyz/blog/what-are-llms-and-how-to-build-apps-using-it",
          icon: <Icons.notion className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Finchat",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/Finchat.png",
    },
    {
      title: "React Rooks",
      href: "https://chess-against-ai.vercel.app/",
      dates: "Jun - Jul 2024",
      active: true,
      description:
        "React Rooks is a web-based chess game that allows users to play against an AI (Stockfish). It features game history, on-demand gameplay, real-time game analysis, player statistics, and three difficulty levels.",
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
          icon: <Icons.globe className="size-3" />,
        },
        {
          type: "Source",
          href: "https://chess-against-ai.vercel.app/",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/ReactRooks.png",
    },
    {
      title: "JSON Parser",
      href: "https://github.com/0xadityaa/json-parser",
      dates: "Dec 2024 - Jan 2025",
      active: true,
      description:
        "This Deno JSON parser, built with TypeScript, efficiently parses JSON strings into an AST, validates against the ECMA-404 standard, and supports both local JSON files or JSON from APIs.",
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
          href: "https://www.0xadityaa.xyz/blog/implementing-a-json-parser",
          icon: <Icons.notion className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/json-parser",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/json-parser.png",
    },
    {
      title: "Byte Cast",
      href: "https://github.com/0xadityaa/Byte-Cast",
      dates: "March 2024",
      active: true,
      description:
        "This project allows users to capture their camera feed from their browser, encode it using FFMPEG, and stream it to the RTMP servers of platforms like YT, FB, LinkedIn, and others. It serves as a browser-based alternative to OBS for streaming.",
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
        // {
        //   type: "Website",
        //   href: "#",
        //   icon: <Icons.globe className="size-3" />,
        // },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Byte-Cast",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/Bytecast.png",
    },
    {
      title: "Crypto Maniac",
      href: "https://github.com/0xadityaa/Crypto-Maniac",
      dates: "Jul 2021 - Jan 2022",
      active: true,
      description:
        "This project is a mobile app for crypto paper trading that allows user to perform paper trading on live market data for cryptocurrencies along with features like portfolio tracking, alerts, realtime market news, and more.",
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
          icon: <Icons.notion className="size-3" />,
        },
        {
          type: "Source",
          href: "https://github.com/0xadityaa/Crypto-Maniac",
          icon: <Icons.github className="size-3" />,
        },
      ],
      image: "/Crypto-Maniac.png",
    },
  ],
  // hackathons: [
  //   {
  //     title: "Hack Western 5",
  //     dates: "November 23rd - 25th, 2018",
  //     location: "London, Ontario",
  //     description:
  //       "Developed a mobile application which delivered bedtime stories to children using augmented reality.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-western.png",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2019/mlh-trust-badge-2019-white.svg",
  //     links: [],
  //   },
  //   {
  //     title: "Hack The North",
  //     dates: "September 14th - 16th, 2018",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed a mobile application which delivers university campus wide events in real time to all students.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-the-north.png",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2019/mlh-trust-badge-2019-white.svg",
  //     links: [],
  //   },
  //   {
  //     title: "FirstNet Public Safety Hackathon",
  //     dates: "March 23rd - 24th, 2018",
  //     location: "San Francisco, California",
  //     description:
  //       "Developed a mobile application which communcicates a victims medical data from inside an ambulance to doctors at hospital.",
  //     icon: "public",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/firstnet.png",
  //     links: [],
  //   },
  //   {
  //     title: "DeveloperWeek Hackathon",
  //     dates: "February 3rd - 4th, 2018",
  //     location: "San Francisco, California",
  //     description:
  //       "Developed a web application which aggregates social media data regarding cryptocurrencies and predicts future prices.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/developer-week.jpg",
  //     links: [
  //       {
  //         title: "Github",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/cryptotrends/cryptotrends",
  //       },
  //     ],
  //   },
  //   {
  //     title: "HackDavis",
  //     dates: "January 20th - 21st, 2018",
  //     location: "Davis, California",
  //     description:
  //       "Developed a mobile application which allocates a daily carbon emission allowance to users to move towards a sustainable environment.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-davis.png",
  //     win: "Best Data Hack",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2018/white.svg",
  //     links: [
  //       {
  //         title: "Devpost",
  //         icon: <Icons.globe className="h-4 w-4" />,
  //         href: "https://devpost.com/software/my6footprint",
  //       },
  //       {
  //         title: "ML",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/Wallet6/my6footprint-machine-learning",
  //       },
  //       {
  //         title: "iOS",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/Wallet6/CarbonWallet",
  //       },
  //       {
  //         title: "Server",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/Wallet6/wallet6-server",
  //       },
  //     ],
  //   },
  //   {
  //     title: "ETH Waterloo",
  //     dates: "October 13th - 15th, 2017",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed a blockchain application for doctors and pharmacists to perform trustless transactions and prevent overdosage in patients.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/eth-waterloo.png",
  //     links: [
  //       {
  //         title: "Organization",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/ethdocnet",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Hack The North",
  //     dates: "September 15th - 17th, 2017",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed a virtual reality application allowing users to see themselves in third person.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-the-north.png",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2017/white.svg",
  //     links: [
  //       {
  //         title: "Streamer Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/justinmichaud/htn2017",
  //       },
  //       {
  //         title: "Client Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/RTSPClient",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Hack The 6ix",
  //     dates: "August 26th - 27th, 2017",
  //     location: "Toronto, Ontario",
  //     description:
  //       "Developed an open platform for people shipping items to same place to combine shipping costs and save money.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-the-6ix.jpg",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2017/white.svg",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/ShareShip/ShareShip",
  //       },
  //       {
  //         title: "Site",
  //         icon: <Icons.globe className="h-4 w-4" />,
  //         href: "https://share-ship.herokuapp.com/",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Stupid Hack Toronto",
  //     dates: "July 23rd, 2017",
  //     location: "Toronto, Ontario",
  //     description:
  //       "Developed a chrome extension which tracks which facebook profiles you have visited and immediately texts your girlfriend if you visited another girls page.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/stupid-hackathon.png",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/nsagirlfriend/nsagirlfriend",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Global AI Hackathon - Toronto",
  //     dates: "June 23rd - 25th, 2017",
  //     location: "Toronto, Ontario",
  //     description:
  //       "Developed a python library which can be imported to any python game and change difficulty of the game based on real time emotion of player. Uses OpenCV and webcam for facial recognition, and a custom Machine Learning Model trained on a [Kaggle Emotion Dataset](https://www.kaggle.com/c/challenges-in-representation-learning-facial-expression-recognition-challenge/leaderboard) using [Tensorflow](https://www.tensorflow.org/Tensorflow) and [Keras](https://keras.io/). This project recieved 1st place prize at the Global AI Hackathon - Toronto and was also invited to demo at [NextAI Canada](https://www.nextcanada.com/next-ai).",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/global-ai-hackathon.jpg",
  //     win: "1st Place Winner",
  //     links: [
  //       {
  //         title: "Article",
  //         icon: <Icons.globe className="h-4 w-4" />,
  //         href: "https://syncedreview.com/2017/06/26/global-ai-hackathon-in-toronto/",
  //       },
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/TinySamosas/",
  //       },
  //     ],
  //   },
  //   {
  //     title: "McGill AI for Social Innovation Hackathon",
  //     dates: "June 17th - 18th, 2017",
  //     location: "Montreal, Quebec",
  //     description:
  //       "Developed realtime facial microexpression analyzer using AI",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/ai-for-social-good.jpg",
  //     links: [],
  //   },
  //   {
  //     title: "Open Source Circular Economy Days Hackathon",
  //     dates: "June 10th, 2017",
  //     location: "Toronto, Ontario",
  //     description:
  //       "Developed a custom admin interface for food waste startup <a href='http://genecis.co/'>Genecis</a> to manage their data and provide analytics.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/open-source-circular-economy-days.jpg",
  //     win: "1st Place Winner",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/genecis",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Make School's Student App Competition 2017",
  //     dates: "May 19th - 21st, 2017",
  //     location: "International",
  //     description: "Improved PocketDoc and submitted to online competition",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/make-school-hackathon.png",
  //     win: "Top 10 Finalist | Honourable Mention",
  //     links: [
  //       {
  //         title: "Medium Article",
  //         icon: <Icons.globe className="h-4 w-4" />,
  //         href: "https://medium.com/make-school/the-winners-of-make-schools-student-app-competition-2017-a6b0e72f190a",
  //       },
  //       {
  //         title: "Devpost",
  //         icon: <Icons.globe className="h-4 w-4" />,
  //         href: "https://devpost.com/software/pocketdoc-react-native",
  //       },
  //       {
  //         title: "YouTube",
  //         icon: <Icons.youtube className="h-4 w-4" />,
  //         href: "https://www.youtube.com/watch?v=XwFdn5Rmx68",
  //       },
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/pocketdoc-react-native",
  //       },
  //     ],
  //   },
  //   {
  //     title: "HackMining",
  //     dates: "May 12th - 14th, 2017",
  //     location: "Toronto, Ontario",
  //     description: "Developed neural network to optimize a mining process",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/hack-mining.png",
  //     links: [],
  //   },
  //   {
  //     title: "Waterloo Equithon",
  //     dates: "May 5th - 7th, 2017",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed Pocketdoc, an app in which you take a picture of a physical wound, and the app returns common solutions or cures to the injuries or diseases.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/waterloo-equithon.png",
  //     links: [
  //       {
  //         title: "Devpost",
  //         icon: <Icons.globe className="h-4 w-4" />,
  //         href: "https://devpost.com/software/pocketdoc-react-native",
  //       },
  //       {
  //         title: "YouTube",
  //         icon: <Icons.youtube className="h-4 w-4" />,
  //         href: "https://www.youtube.com/watch?v=XwFdn5Rmx68",
  //       },
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/pocketdoc-react-native",
  //       },
  //     ],
  //   },
  //   {
  //     title: "SpaceApps Waterloo",
  //     dates: "April 28th - 30th, 2017",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed Earthwatch, a web application which allows users in a plane to virtually see important points of interest about the world below them. They can even choose to fly away from their route and then fly back if they choose. Special thanks to CesiumJS for providing open source world and plane models.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/space-apps.png",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/earthwatch",
  //       },
  //     ],
  //   },
  //   {
  //     title: "MHacks 9",
  //     dates: "March 24th - 26th, 2017",
  //     location: "Ann Arbor, Michigan",
  //     description:
  //       "Developed Super Graphic Air Traffic, a VR website made to introduce people to the world of air traffic controlling. This project was built completely using THREE.js as well as a node backend server.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/mhacks-9.png",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2017/white.svg",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/threejs-planes",
  //       },
  //     ],
  //   },
  //   {
  //     title: "StartHacks I",
  //     dates: "March 4th - 5th, 2017",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed at StartHacks 2017, Recipic is a mobile app which allows you to take pictures of ingredients around your house, and it will recognize those ingredients using ClarifAI image recognition API and return possible recipes to make. Recipic recieved 1st place at the hackathon for best pitch and hack.",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/starthacks.png",
  //     win: "1st Place Winner",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2017/white.svg",
  //     links: [
  //       {
  //         title: "Source (Mobile)",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/mattBlackDesign/recipic-ionic",
  //       },
  //       {
  //         title: "Source (Server)",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/mattBlackDesign/recipic-rails",
  //       },
  //     ],
  //   },
  //   {
  //     title: "QHacks II",
  //     dates: "February 3rd - 5th, 2017",
  //     location: "Kingston, Ontario",
  //     description:
  //       "Developed a mobile game which enables city-wide manhunt with random lobbies",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/qhacks.png",
  //     mlh: "https://s3.amazonaws.com/logged-assets/trust-badge/2017/white.svg",
  //     links: [
  //       {
  //         title: "Source (Mobile)",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/dillionverma/human-huntr-react-native",
  //       },
  //       {
  //         title: "Source (API)",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/mattBlackDesign/human-huntr-rails",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Terrible Hacks V",
  //     dates: "November 26th, 2016",
  //     location: "Waterloo, Ontario",
  //     description:
  //       "Developed a mock of Windows 11 with interesting notifications and functionality",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/terrible-hacks-v.png",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/justinmichaud/TerribleHacks2016-Windows11",
  //       },
  //     ],
  //   },
  //   {
  //     title: "Portal Hackathon",
  //     dates: "October 29, 2016",
  //     location: "Kingston, Ontario",
  //     description:
  //       "Developed an internal widget for uploading assignments using Waterloo's portal app",
  //     image:
  //       "https://pub-83c5db439b40468498f97946200806f7.r2.dev/hackline/portal-hackathon.png",
  //     links: [
  //       {
  //         title: "Source",
  //         icon: <Icons.github className="h-4 w-4" />,
  //         href: "https://github.com/UWPortalSDK/crowmark",
  //       },
  //     ],
  //   },
  // ],
} as const;
