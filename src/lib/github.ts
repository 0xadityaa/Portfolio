export interface GitHubPinnedRepo {
  name: string;
  description: string;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  openGraphImageUrl: string;
  pushedAt: string;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  languages: string[];
  topics: string[];
  issuesCount?: number;
  commitsCount?: number;
}

export interface GitHubBuilderProfile {
  name: string;
  bio: string;
  company: string | null;
  location: string | null;
  avatarUrl: string;
  followersCount: number;
  publicReposCount: number;
  contributionsCount: number;
  pinnedRepos: GitHubPinnedRepo[];
  repos: GitHubPinnedRepo[];
}

const GITHUB_GRAPHQL_API = "https://api.github.com/graphql";

const query = `
query ($username: String!) {
  user(login: $username) {
    name
    bio
    company
    location
    avatarUrl
    followers {
      totalCount
    }
    repositories(first: 100, ownerAffiliations: OWNER, privacy: PUBLIC) {
      totalCount
      nodes {
        name
        description
        url
        homepageUrl
        stargazerCount
        forkCount
        pushedAt
        issues(states: OPEN) {
          totalCount
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history {
                totalCount
              }
            }
          }
        }
        openGraphImageUrl
        primaryLanguage {
          name
          color
        }
        languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
          nodes {
            name
            color
          }
        }
        repositoryTopics(first: 10) {
          nodes {
            topic {
              name
            }
          }
        }
      }
    }
    pinnedItems(first: 6, types: [REPOSITORY]) {
      nodes {
        ... on Repository {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          pushedAt
          issues(states: OPEN) {
            totalCount
          }
          defaultBranchRef {
            target {
              ... on Commit {
                history {
                  totalCount
                }
              }
            }
          }
          openGraphImageUrl
          primaryLanguage {
            name
            color
          }
          languages(first: 5, orderBy: {field: SIZE, direction: DESC}) {
            nodes {
              name
              color
            }
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
  }
}
`;

export async function getGitHubBuilderProfile(username: string = "0xadityaa"): Promise<GitHubBuilderProfile> {
  const token = process.env.GITHUB_TOKEN;

  if (!token || token.includes("dummy")) {
    console.warn(`
⚠️ [WARN] Missing or dummy GITHUB_TOKEN environment variable!
Returning mock GitHub data.
`);
    return getMockProfile();
  }

  try {
    const res = await fetch(GITHUB_GRAPHQL_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "antigravity-builder-portfolio",
      },
      body: JSON.stringify({
        query,
        variables: { username },
      }),
      next: {
        revalidate: 3600, // Cache for 1 hour
        tags: ["github-profile"],
      },
    });

  if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GitHub GraphQL API responded with status ${res.status}: ${errorText}`);
    }

    const { data, errors } = await res.json();

    if (errors && errors.length > 0) {
      throw new Error(`GitHub GraphQL errors: ${errors.map((e: any) => e.message).join(", ")}`);
    }

    const user = data?.user;
    if (!user) {
      throw new Error(`GitHub user "${username}" not found.`);
    }

    const mapRepoNode = (node: any): GitHubPinnedRepo => ({
      name: node.name,
      description: node.description || "No description provided.",
      url: node.url,
      homepageUrl: node.homepageUrl || null,
      stargazerCount: node.stargazerCount || 0,
      forkCount: node.forkCount || 0,
      issuesCount: node.issues?.totalCount || 0,
      commitsCount: node.defaultBranchRef?.target?.history?.totalCount || 0,
      openGraphImageUrl: node.openGraphImageUrl || "",
      pushedAt: node.pushedAt || new Date().toISOString(),
      primaryLanguage: node.primaryLanguage
        ? {
            name: node.primaryLanguage.name,
            color: node.primaryLanguage.color,
          }
        : null,
      languages: (node.languages?.nodes || []).map((l: any) => l.name),
      topics: (node.repositoryTopics?.nodes || []).map((t: any) => t.topic.name),
    });

    const pinnedRepos: GitHubPinnedRepo[] = (user.pinnedItems?.nodes || []).map(mapRepoNode);
    const repos: GitHubPinnedRepo[] = (user.repositories?.nodes || []).map(mapRepoNode);

    // Sum all repository commits as an all-time contribution approximation
    const allTimeCommits = repos.reduce((acc, repo) => acc + (repo.commitsCount || 0), 0);
    const defaultContributions = user.contributionsCollection?.contributionCalendar?.totalContributions || 0;

    return {
      name: user.name || "Aditya Negandhi",
      bio: user.bio || "Full Stack Engineer & aspiring Solutions Architect.",
      company: user.company || null,
      location: user.location || null,
      avatarUrl: user.avatarUrl || "/Me.jpeg",
      followersCount: user.followers?.totalCount || 0,
      publicReposCount: user.repositories?.totalCount || 0,
      contributionsCount: allTimeCommits > 0 ? allTimeCommits : defaultContributions,
      pinnedRepos,
      repos,
    };
  } catch (error) {
    console.error("❌ Failed to fetch GitHub profile stats:", error);
    console.warn("⚠️ Returning mock GitHub data due to fetch failure.");
    return getMockProfile();
  }
}

function getMockProfile(): GitHubBuilderProfile {
  const mockRepos = [
    {
      name: "clipper",
      description: "AI agent that automatically repurposes long-form video content into engaging clips for social media.",
      url: "https://github.com/0xadityaa/clipper",
      homepageUrl: "https://clipper-ai-omega.vercel.app/",
      stargazerCount: 15,
      forkCount: 2,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 100000000).toISOString(),
      primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      languages: ["TypeScript", "Python"],
      topics: ["nextjs", "gemini", "ffmpeg"],
    },
    {
      name: "Gitbuddy",
      description: "A multi-agent developer tool that automates repository maintenance.",
      url: "https://github.com/0xadityaa/Gitbuddy",
      homepageUrl: "https://gitbuddy-dev.lovable.app/",
      stargazerCount: 12,
      forkCount: 1,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 500000000).toISOString(),
      primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      languages: ["TypeScript", "CSS"],
      topics: ["langchain", "supabase"],
    },
    {
      name: "GraphRAGChat",
      description: "A scalable chatbot that builds knowledge graphs from scraped data to answer complex questions with citations.",
      url: "https://github.com/0xadityaa/GraphRAGChat",
      homepageUrl: "https://frontend-471866182091.us-central1.run.app",
      stargazerCount: 8,
      forkCount: 0,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 1500000000).toISOString(),
      primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      languages: ["TypeScript", "FastAPI"],
      topics: ["langchain", "gcp"],
    },
    {
      name: "Finchat",
      description: "A smart chatbot that helps you analyze stocks and financial markets in real-time.",
      url: "https://github.com/0xadityaa/Finchat",
      homepageUrl: null,
      stargazerCount: 5,
      forkCount: 1,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 2500000000).toISOString(),
      primaryLanguage: { name: "Python", color: "#3572A5" },
      languages: ["Python"],
      topics: ["langgraph", "azure"],
    },
    {
      name: "json-parser",
      description: "A custom JSON parser, built with TypeScript, efficiently parses JSON strings into an AST.",
      url: "https://github.com/0xadityaa/json-parser",
      homepageUrl: null,
      stargazerCount: 3,
      forkCount: 0,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 8500000000).toISOString(),
      primaryLanguage: { name: "TypeScript", color: "#3178c6" },
      languages: ["TypeScript"],
      topics: ["deno", "parser"],
    },
    {
      name: "Byte-Cast",
      description: "A browser-based streaming tool that lets you stream to platforms like YouTube and Twitch.",
      url: "https://github.com/0xadityaa/Byte-Cast",
      homepageUrl: null,
      stargazerCount: 6,
      forkCount: 2,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 18500000000).toISOString(),
      primaryLanguage: { name: "JavaScript", color: "#f1e05a" },
      languages: ["JavaScript"],
      topics: ["ffmpeg", "socketio"],
    },
    {
      name: "Crypto-Maniac",
      description: "A mobile app for crypto paper trading using live market data.",
      url: "https://github.com/0xadityaa/Crypto-Maniac",
      homepageUrl: null,
      stargazerCount: 2,
      forkCount: 0,
      openGraphImageUrl: "",
      pushedAt: new Date(Date.now() - 38500000000).toISOString(),
      primaryLanguage: { name: "Dart", color: "#00B4AB" },
      languages: ["Dart"],
      topics: ["flutter", "firebase"],
    }
  ];

  return {
    name: "Aditya Negandhi (Mock)",
    bio: "Full Stack Engineer & aspiring Solutions Architect.",
    company: null,
    location: "Toronto, ON",
    avatarUrl: "/Me.jpeg",
    followersCount: 123,
    publicReposCount: 45,
    contributionsCount: 890,
    pinnedRepos: mockRepos.slice(0, 4),
    repos: mockRepos,
  };
}
