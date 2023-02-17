import { withSuperjson } from "next-superjson"

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

export default withSuperjson()(nextConfig)
