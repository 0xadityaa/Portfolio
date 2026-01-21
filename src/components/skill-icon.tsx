"use client";

import * as SimpleIcons from 'simple-icons';
import Image from 'next/image';

interface SkillIconProps {
  skill: string;
  className?: string;
}

// Mapping of skill names to Simple Icons slugs
const iconMapping: { [key: string]: string } = {
  "React": "react",
  "Nest.js": "nestjs",
  "Tanstack": "reactquery",
  "Next.js": "nextdotjs",
  "React Native": "react",
  "Node": "nodedotjs",
  "Bun": "bun",
  "Deno": "deno",
  "Javascript": "javascript",
  "Typescript": "typescript",
  "React Query": "reactquery",
  "Redux": "redux",
  "Tailwind": "tailwindcss",
  "Jest": "jest",
  "Playwright": "playwright",
  "Sentry": "sentry",
  "Storybook": "storybook",
  "Java": "openjdk",
  "Spring Boot": "springboot",
  "Docker": "docker",
  "MS SQL": "microsoftsqlserver",
  "MySQL": "mysql",
  "PostgreSQL": "postgresql",
  "MongoDB": "mongodb",
  "DynamoDB": "amazondynamodb",
  "Firebase": "firebase",
  "FastAPI": "fastapi",
  "Supabase": "supabase",
  "Convex": "convex",
  "Redis": "redis",
  "Kafka": "apachekafka",
  "WebSockets": "socketdotio",
  "Prisma": "prisma",
  "TypeORM": "typeorm",
  "Git": "git",
  "GitHub Actions": "githubactions",
  "Azure": "microsoftazure",
  "Azure DevOps": "azuredevops",
  "GCP": "googlecloud",
  "Vercel": "vercel",
  "Vercel AI SDK": "vercel",
  "LangChain": "langchain",
  "LangGraph": "langchain",
  "Vertex AI": "googlecloud",
  "MCP": "anthropic",
  "Vector Search": "algolia",
  "Opentelemetry": "opentelemetry",
  "Datadog": "datadog",
  "Python": "python",
  "Go": "go",
  "C++": "cplusplus",
  "C#": "csharp",
  "Linux": "linux",
  "Terraform": "terraform",
  "Ansible": "ansible",
  "Kubernetes": "kubernetes",
  "Grafana": "grafana",
  "TensorFlow": "tensorflow",
};

// Fallback to SVGL for icons not available in simple-icons
const svglFallback: { [key: string]: string } = {
  "Convex": "convex",
  "Azure": "azure",
  "Azure DevOps": "azure",
  "Playwright": "playwright",
  "MS SQL": "microsoft-sql-server",
};

export function SkillIcon({ skill, className = "size-4" }: SkillIconProps) {
  const iconSlug = iconMapping[skill];
  
  if (!iconSlug) {
    return null;
  }

  // Try to get icon from simple-icons first
  const iconKey = `si${iconSlug.charAt(0).toUpperCase() + iconSlug.slice(1).replace(/-/g, '')}` as keyof typeof SimpleIcons;
  const icon = SimpleIcons[iconKey];

  // If found in simple-icons, use it
  if (icon) {
    return (
      <svg
        role="img"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        fill="currentColor"
      >
        <title>{icon.title}</title>
        <path d={icon.path} />
      </svg>
    );
  }

  // Fallback to SVGL for missing icons
  const svglSlug = svglFallback[skill];
  if (svglSlug) {
    return (
      <Image
        src={`https://svgl.app/library/${svglSlug}.svg`}
        alt={skill}
        width={16}
        height={16}
        className={`${className} brightness-0 dark:invert`}
        unoptimized
      />
    );
  }

  return null;
}
