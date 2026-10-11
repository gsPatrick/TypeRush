/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // o modo principal mudou de /play para /rush — links antigos continuam valendo
  async redirects() {
    return [{ source: "/play", destination: "/rush", permanent: true }];
  },
};

export default nextConfig;
