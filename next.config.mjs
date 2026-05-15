/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Next 16 requires explicit qualities list when using non-default values
    qualities: [75, 85, 90],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async redirects() {
    return [
      // Migrate the short-lived per-slug story routes (PR #18) back onto
      // the single /transformations page with a hash anchor (PR #20).
      // Bookmarks / shared links from that window keep working.
      {
        source: '/transformations/:slug',
        destination: '/transformations#:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
