// A request that asks for Markdown gets the Markdown twin of the page.
const wantsMarkdown = [{ type: "header", key: "accept", value: "(.*)text/markdown(.*)" }];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async rewrites() {
    return {
      // Markdown mode for agents: /blog/post.md, /index.md, or any page URL
      // with `Accept: text/markdown`. Rendered by src/app/md/[[...path]].
      beforeFiles: [
        { source: "/index.md", destination: "/md" },
        { source: "/:path(.+)\\.md", destination: "/md/:path" },
        { source: "/", has: wantsMarkdown, destination: "/md" },
        {
          source: "/:path((?!md(?:/|$)|_next/|images/|.*\\.[a-z0-9]+$).+)",
          has: wantsMarkdown,
          destination: "/md/:path",
        },
      ],
    };
  },
};

export default nextConfig;
