import BlurFade from "@/components/magicui/blur-fade";
import BlurFadeText from "@/components/magicui/blur-fade-text";
import { ResumeCard } from "@/components/resume-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DATA } from "@/data/resume";
import Link from "next/link";
import Markdown from "react-markdown";
import Image from "next/image";
import Marquee from "@/components/magicui/marquee";
import { SkillIcon } from "@/components/skill-icon";

const BLUR_FADE_DELAY = 0.04;

export default function Page() {
  return (
    <main className="flex flex-col min-h-[100dvh] space-y-12 mb-24 overflow-x-hidden">
      <section id="hero">
        <div className="mx-auto w-full max-w-2xl space-y-8">
          <div className="gap-2 flex justify-between">
            <div className="flex-col flex flex-1 space-y-1.5">
              <BlurFadeText
                delay={BLUR_FADE_DELAY}
                className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/tight"
                yOffset={8}
                text={`Hi, I'm ${DATA.name.split(" ")[0]}`}
              />
              <BlurFadeText
                className="max-w-[600px] md:text-xl"
                delay={BLUR_FADE_DELAY}
                text={DATA.description}
              />
            </div>
            <BlurFade delay={BLUR_FADE_DELAY}>
              <div className="relative size-28 p-2">
                <Image
                  src="/images/illustrations/budda-illustration.png"
                  alt="Budda"
                  width={100}
                  height={100}
                  className="size-32 object-contain hover:rotate-12 transition-transform duration-300"
                />
                {/* <Avatar className="size-28 border">
                  <AvatarImage alt={DATA.name} src={DATA.avatarUrl} className="object-cover" />
                  <AvatarFallback>{DATA.initials}</AvatarFallback>
                </Avatar> */}
              </div>
            </BlurFade>
          </div>
        </div>
      </section>
      
      <section id="about">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          <BlurFade delay={BLUR_FADE_DELAY * 3}>
             <div className="flex items-end gap-3 mb-1">
               <Image 
                 src="/images/illustrations/fish-circle-illustration.png" 
                 alt="About" 
                 width={100} 
                 height={100} 
                 className="object-contain hover:rotate-12 transition-transform duration-300"
               />
               <h2 className="text-xl font-bold">About</h2>
             </div>
          </BlurFade>
          <BlurFade delay={BLUR_FADE_DELAY * 4}>
            <Markdown className="prose max-w-full text-pretty font-sans text-lg text-muted-foreground dark:prose-invert">
              {DATA.summary}
            </Markdown>
          </BlurFade>
        </div>
      </section>

      <section id="skills">
         <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * 9}>
               <div className="flex items-end gap-3 mb-1">
                  <Image 
                   src="/images/illustrations/chess-pieces-illustration.png" 
                   alt="Skills" 
                   width={100} 
                   height={100} 
                   className="object-contain hover:rotate-12 transition-transform duration-300"
                 />
                 <h2 className="text-xl font-bold">Toolbox</h2>
               </div>
            </BlurFade>
            <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg bg-background pb-12 pt-8">
                <Marquee pauseOnHover className="[--duration:80s]">
                    {DATA.skills.slice(0, Math.ceil(DATA.skills.length / 2)).map((skill) => (
                      <div key={skill} className="flex items-center gap-2 mr-4 px-4 py-2 border rounded-full bg-card hover:bg-accent/50 transition-colors">
                          <SkillIcon skill={skill} className="size-4 text-foreground" />
                          <span className="text-sm font-medium">{skill}</span>
                      </div>
                    ))}
                </Marquee>
                <Marquee reverse pauseOnHover className="[--duration:80s] mt-2">
                    {DATA.skills.slice(Math.ceil(DATA.skills.length / 2)).map((skill) => (
                      <div key={skill} className="flex items-center gap-2 mr-4 px-4 py-2 border rounded-full bg-card hover:bg-accent/50 transition-colors">
                          <SkillIcon skill={skill} className="size-4 text-foreground" />
                          <span className="text-sm font-medium">{skill}</span>
                      </div>
                    ))}
                </Marquee>
                <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background"></div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background"></div>
            </div>
          </div>
      </section>

      <section id="work">
         <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * 5}>
              <div className="flex items-end gap-3 mb-1">
                <Image 
                 src="/images/illustrations/left-right-road-sign-illustration.png" 
                 alt="Work" 
                 width={100} 
                 height={100} 
                 className="object-contain hover:rotate-12 transition-transform duration-300"
               />
               <h2 className="text-xl font-bold">Work</h2>
             </div>
            </BlurFade>
            {DATA.work.map((work, id) => (
              <BlurFade
                key={work.company}
                delay={BLUR_FADE_DELAY * 6 + id * 0.05}
                              >
                <ResumeCard
                  key={work.company}
                  logoUrl={work.logoUrl}
                  altText={work.company}
                  title={work.company}
                  subtitle={work.title}
                  href={work.href}
                  period={`${work.start} - ${work.end ?? "Present"}`}
                  description={work.description}
                />
              </BlurFade>
            ))}
          </div>
      </section>

      <section id="education">
        <div className="w-full max-w-2xl mx-auto flex min-h-0 flex-col gap-y-3">
            <BlurFade delay={BLUR_FADE_DELAY * 7}>
              <div className="flex items-end gap-3 mb-1">
                <Image 
                 src="/images/illustrations/hat-illustration.png" 
                 alt="Education" 
                 width={100} 
                 height={100} 
                 className="object-contain hover:rotate-12 transition-transform duration-300"
               />
               <h2 className="text-xl font-bold">Education</h2>
             </div>
            </BlurFade>
            {DATA.education.map((education, id) => (
              <BlurFade
                key={education.school}
                delay={BLUR_FADE_DELAY * 8 + id * 0.05}
                >
                <ResumeCard
                  key={education.school}
                  href={education.href}
                  logoUrl={education.logoUrl}
                  altText={education.school}
                  title={education.school}
                  subtitle={education.degree}
                  period={`${education.start} - ${education.end}`}
                />
              </BlurFade>
            ))}
        </div>
      </section>

      <section id="contact">
        <div className="grid items-center justify-center gap-4 px-4 text-center md:px-6 w-full py-12">
          <BlurFade delay={BLUR_FADE_DELAY * 16}>
            <div className="space-y-3 relative">
               <div className="flex items-end justify-center gap-3 mb-1">
                 <Image 
                   src="/images/illustrations/speaker-illustration.png" 
                   alt="Contact" 
                   width={100} 
                   height={100} 
                   className="object-contain hover:rotate-12 transition-transform duration-300"
                 />
                 <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Get in Touch
                </h2>
               </div>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Want to chat? send me an {""}
                <Link
                  href={DATA.contact.social.email.url}
                  className="text-blue-500 hover:underline"
                >
                  email
                </Link>{" "}
                or shoot a dm on{" "}
                <Link
                  href={DATA.contact.social.X.url}
                  className="text-blue-500 hover:underline"
                >
                  twitter
                </Link>
              </p>
            </div>
          </BlurFade>
        </div>
      </section>
    </main>
  );
}
