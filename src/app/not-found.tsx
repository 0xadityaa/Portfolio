import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 py-16">
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        Hmm, this page doesn&apos;t exist
      </h1>
      <p className="max-w-[46ch] text-muted-foreground">
        The link might be old, or the page may have wandered off. The{" "}
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
        Back home
      </Link>
    </main>
  );
}
