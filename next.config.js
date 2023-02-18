import { withSuperjson } from "next-superjson"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || "",
  assetPrefix: (process.env["NEXT_PUBLIC_GITHUB_PAGES_BASE"] || "") + "/",
  experimental: {
    scrollRestoration: true,
  },
}

export default withSuperjson()(nextConfig)
