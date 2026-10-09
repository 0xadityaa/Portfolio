import { DATA } from "@/data/resume";

export type Project = (typeof DATA.projects)[number];

/** Detail pages live at /projects/<repo name>, so the slug is the repo name. */
export function projectSlug(project: Pick<Project, "href">) {
  return project.href.split("/").filter(Boolean).pop() ?? "";
}

export function findProject(slug: string) {
  return DATA.projects.find(
    (p) => projectSlug(p).toLowerCase() === slug.toLowerCase()
  );
}
