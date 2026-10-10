import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 py-16">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        Well, this is awkward
      </h1>
      <p className="max-w-[46ch] text-muted-foreground">
        This page doesn&apos;t exist. Maybe the link is old, maybe it never did. The{" "}
        <Link href="/blog" className="link">
          blog
        </Link>{" "}
        and{" "}
        <Link href="/projects" className="link">
          projects
        </Link>{" "}
        are still right where you left them.
      </p>
      <Link href="/" className="link inline-block">
        Take me home
      </Link>
    </main>
  );
}
