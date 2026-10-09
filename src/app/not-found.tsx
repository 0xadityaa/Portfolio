import Link from "next/link";

export default function NotFound() {
  return (
    <main className="space-y-4 py-16">
      <p className="meta">404</p>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        This page does not exist
      </h1>
      <p className="max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
        The link may be old, or the page may have moved. The{" "}
        <Link href="/blog" className="link">
          blog
        </Link>{" "}
        and{" "}
        <Link href="/projects" className="link">
          projects
        </Link>{" "}
        are still where you left them.
      </p>
      <Link
        href="/"
        className="inline-flex rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 active:scale-[0.97]"
      >
        Back home
      </Link>
    </main>
  );
}
