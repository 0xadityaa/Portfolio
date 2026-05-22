import React from "react";
import { getGitHubBuilderProfile } from "@/lib/github";
import { DATA } from "@/data/resume";
import { ProjectsClient } from "@/components/projects-client";

export default async function ProjectsPage() {
  let githubData;
  try {
    githubData = await getGitHubBuilderProfile("0xadityaa");
  } catch (err) {
    console.error("Failed to fetch github builder profile inside projects page:", err);
    githubData = {
      repos: [],
    };
  }

  return (
    <section id="projects" className="py-8">
      <ProjectsClient projects={DATA.projects} githubRepos={githubData?.repos || []} />
    </section>
  );
}
