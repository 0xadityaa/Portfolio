export interface GitHubPinnedRepo {
  name: string;
  description: string;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  openGraphImageUrl: string;
  primaryLanguage: {
    name: string;
    color: string;
  } | null;
  languages: string[];
  topics: string[];
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
    repositories(privacy: PUBLIC) {
      totalCount
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
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

    const pinnedRepos: GitHubPinnedRepo[] = (user.pinnedItems?.nodes || []).map((node: any) => {
      return {
        name: node.name,
        description: node.description || "No description provided.",
        url: node.url,
        homepageUrl: node.homepageUrl || null,
        stargazerCount: node.stargazerCount || 0,
        forkCount: node.forkCount || 0,
        openGraphImageUrl: node.openGraphImageUrl || "",
        primaryLanguage: node.primaryLanguage
          ? {
              name: node.primaryLanguage.name,
              color: node.primaryLanguage.color,
            }
          : null,
        languages: (node.languages?.nodes || []).map((l: any) => l.name),
        topics: (node.repositoryTopics?.nodes || []).map((t: any) => t.topic.name),
      };
    });

    return {
      name: user.name || "Aditya Negandhi",
      bio: user.bio || "Full Stack Engineer & aspiring Solutions Architect.",
      company: user.company || null,
      location: user.location || null,
      avatarUrl: user.avatarUrl || "/Me.jpeg",
      followersCount: user.followers?.totalCount || 0,
      publicReposCount: user.repositories?.totalCount || 0,
      contributionsCount: user.contributionsCollection?.contributionCalendar?.totalContributions || 0,
      pinnedRepos,
    };
  } catch (error) {
    console.error("❌ Failed to fetch GitHub profile stats:", error);
    console.warn("⚠️ Returning mock GitHub data due to fetch failure.");
    return getMockProfile();
  }
}

function getMockProfile(): GitHubBuilderProfile {
  return {
    name: "Aditya Negandhi (Mock)",
    bio: "Full Stack Engineer & aspiring Solutions Architect.",
    company: null,
    location: "Toronto, ON",
    avatarUrl: "/Me.jpeg",
    followersCount: 123,
    publicReposCount: 45,
    contributionsCount: 890,
    pinnedRepos: [
      {
        name: "Mock Project 1",
        description: "This is a mocked github pinned repository.",
        url: "#",
        homepageUrl: null,
        stargazerCount: 42,
        forkCount: 7,
        openGraphImageUrl: "",
        primaryLanguage: { name: "TypeScript", color: "#3178c6" },
        languages: ["TypeScript", "React"],
        topics: ["nextjs", "react"],
      },
      {
        name: "Mock Project 2",
        description: "Another mocked repository since github token is missing.",
        url: "#",
        homepageUrl: null,
        stargazerCount: 24,
        forkCount: 3,
        openGraphImageUrl: "",
        primaryLanguage: { name: "Python", color: "#3572A5" },
        languages: ["Python"],
        topics: ["machine-learning"],
      }
    ],
  };
}
