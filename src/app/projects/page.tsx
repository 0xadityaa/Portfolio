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
          <div className="flex flex-col items-center justify-center space-y-4 text-center w-full mb-8">
            <Image 
              src="/cool-graphics/game-console-illustration.png" 
              alt="Projects" 
              width={120} 
              height={120} 
              className="object-contain hover:rotate-12 transition-transform duration-300"
            />
            <h2 className="font-bold text-3xl sm:text-5xl tracking-tighter">
              Stuff I&apos;ve Built
            </h2>
            <p className="text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed max-w-[600px] mx-auto">
              From random experiments to full-blown web apps, here&apos;s a collection of things I&apos;ve built with code and caffeine.
            </p>
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
