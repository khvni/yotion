/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize PGlite to avoid bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@electric-sql/pglite': '@electric-sql/pglite',
      });
    }
    return config;
  },
}

module.exports = nextConfig
