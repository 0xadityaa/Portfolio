"use client";

import * as SimpleIcons from 'simple-icons';
import Image from 'next/image';
import { CustomIcons } from './custom-icons';

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
  "Node.js": "nodedotjs",
  "Bun": "bun",
  "Deno": "deno",
  "Javascript": "javascript",
  "Typescript": "typescript",
  "React Query": "reactquery",
  "Redux": "redux",
  "Tailwind": "tailwindcss",
  "TailwindCSS": "tailwindcss",
  "Tailwind + ShadCN": "tailwindcss",
  "Shadcn UI": "shadcnui",
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
  "Firestore": "firebase",
  "FastAPI": "fastapi",
  "Fast API": "fastapi",
  "Supabase": "supabase",
  "Convex": "convex",
  "Redis": "redis",
  "Kafka": "apachekafka",
  "WebSockets": "socketdotio",
  "Socket.io": "socketdotio",
  "Prisma": "prisma",
  "TypeORM": "typeorm",
  "Git": "git",
  "GitHub Actions": "githubactions",
  "Azure": "microsoftazure",
  "Azure DevOps": "azuredevops",
  "Azure OpenAI": "openai",
  "GCP": "googlecloud",
  "Cloudflare": "cloudflare",
  "Vercel": "vercel",
  "Vercel AI SDK": "vercel",
  "LangChain": "langchain",
  "Langchain": "langchain",
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
  "AWS": "amazonwebservices",
  "AWS S3": "amazons3",
  "Remix": "remix",
  "Flutter": "flutter",
  "Android": "android",
  "iOS": "apple",
  "Streamlit": "streamlit",
  "Pandas": "pandas",
  "WASM": "webassembly",
  "Gemini 2.5 Pro": "googlegemini",
  "Gemini 2.5 Flash": "googlegemini",
  "Gemini 2.5 Flash + 2.5 Pro": "googlegemini",
  "GPT-4o": "openai",
  "FFMPEG": "ffmpeg",
  "Spanner Graph DB": "googlecloud",
  "Serverless": "serverless",
  "Inngest": "inngest",
  "FCM": "firebase",
  "JSON": "json",
};

// Skills that use custom icons
const customIconSkills = ["AWS", "AWS S3"];

// Fallback to SVGL for icons not available in simple-icons  
const svglFallback: { [key: string]: string } = {
  "Convex": "convex",
  "Azure": "azure",
  "Azure DevOps": "azure",
  "Playwright": "playwright",
  "MS SQL": "microsoft-sql-server",
  "Shadcn UI": "shadcn-ui",
  "Tailwind + ShadCN": "tailwindcss",
  "Streamlit": "streamlit",
  "GPT-4o": "openai",
  "Azure OpenAI": "openai",
};

export function SkillIcon({ skill, className = "size-4" }: SkillIconProps) {
  // Check for custom icon first
  if (customIconSkills.includes(skill)) {
    const Icon = CustomIcons.AWS;
    return (
      <div className={`${className} flex items-center justify-center`}>
        <Icon />
      </div>
    );
  }

  const iconSlug = iconMapping[skill];
  
  if (!iconSlug) {
    return null;
  }

  // Check if this skill should use SVGL (for icons not available or broken in simple-icons)
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

  // Try to get icon from simple-icons
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

  return null;
}
