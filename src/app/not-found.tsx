import Link from "next/link";

export default function NotFound() {
  return (
    <main className="space-y-4 py-16">
      <p className="meta">404</p>
      <h1 className="text-xl font-medium tracking-tight text-foreground">
        This page does not exist
      </h1>
      <p className="max-w-[46ch] text-muted-foreground">
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
      <Link href="/" className="link inline-block">
        Back home
      </Link>
    </main>
  );
}
