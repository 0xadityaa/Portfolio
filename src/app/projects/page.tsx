import BlurFade from "@/components/magicui/blur-fade";
import { ProjectCard } from "@/components/project-card";
import { DATA } from "@/data/resume";
import Image from "next/image";

const BLUR_FADE_DELAY = 0.04;

export default function ProjectsPage() {
  return (
    <section id="projects">
      <div className="space-y-12 w-full py-12">
        <BlurFade delay={BLUR_FADE_DELAY * 11}>
          <div className="flex flex-col items-start justify-center space-y-4">
            <div className="space-y-2">
               <div className="flex items-end justify-start gap-4 mb-2 pl-4">
                   <Image 
                     src="/cool-graphics/game-console-illustration.png" 
                     alt="Projects" 
                     width={100} 
                     height={100} 
                     className="object-contain hover:rotate-12 transition-transform duration-300"
                   />
                  <h2 className="text-2xl font-bold tracking-tighter sm:text-4xl">
                    Stuff I built so far
                  </h2>
               </div>
              <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                A collection of projects I've built, ranging from experimental tools to full-stack web applications.
              </p>
            </div>
          </div>
        </BlurFade>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 max-w-[800px] mx-auto">
          {DATA.projects.map((project, id) => (
            <BlurFade
              key={project.title}
              delay={BLUR_FADE_DELAY * 12 + id * 0.05}
            >
              <ProjectCard
                href={project.href}
                key={project.title}
                title={project.title}
                description={project.description}
                dates={project.dates}
                tags={project.technologies}
                image={project.image}
                links={project.links}
              />
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  );
}
