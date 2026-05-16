/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    // Next 16 requires explicit qualities list when using non-default values
    qualities: [75, 85, 90],
    // localPatterns is allow-list-only in Next 16. Anything not matched
    // here returns 400 INVALID_IMAGE_OPTIMIZE_REQUEST from the optimizer.
    // We must enumerate every /public subfolder we serve images from.
    //
    // The transformations entry intentionally also accepts `search:
    // 'v=2'` to dodge stale 308 redirects from PR #21. The default
    // (search: undefined) means "no query string allowed"; we keep the
    // explicit v=2 entry alongside the wildcard one so both forms work.
    localPatterns: [
      { pathname: '/experts/**' },
      { pathname: '/trainers/**' },
      { pathname: '/in-action/**' },
      { pathname: '/hero/**' },
      { pathname: '/transformations/**' },
      { pathname: '/transformations/**', search: 'v=2' },
    ],
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
      //
      // CRITICAL: the pattern is restricted to slugs that DON'T contain
      // a dot, so this rule never matches asset paths like
      // /transformations/sasa-before.jpg. (Without the constraint, every
      // image request gets 308-redirected to the HTML page, which
      // breaks the entire gallery — exactly what happened in #21.)
      {
        source: '/transformations/:slug((?!.*\\.).+)',
        destination: '/transformations#:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
