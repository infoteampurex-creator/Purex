import type { MetadataRoute } from 'next';

/**
 * /robots.txt — crawler rules for Team Purex.
 *
 * Explicitly welcomes all major search + AI crawlers so we appear in
 * Google, Bing, DuckDuckGo, and in AI answers on ChatGPT, Claude,
 * Perplexity, Google Gemini. The default (no robots.txt) means
 * "allow anything," which is roughly what we want — but many AI
 * crawlers only crawl domains that explicitly welcome them by name.
 *
 * Disallowed paths:
 *   /client/*        — authenticated app surface, private client data
 *   /admin/*         — coach + super-admin panel
 *   /onboarding/*    — private consent flow
 *   /api/*           — server-only endpoints
 *   /application     — private application form
 *   /purex-mothers/* — personal appreciation URLs
 *                      (public but shouldn't rank on brand queries)
 *
 * /purex-mothers itself (the landing) stays allowed because it's a
 * public marketing page celebrating the cohort — good for the brand.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Wildcard rule for all crawlers we don't name explicitly.
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/client/',
          '/admin/',
          '/onboarding/',
          '/api/',
          '/application',
          '/purex-mothers/vani',
          '/purex-mothers/swarna',
          '/purex-mothers/akhila',
          '/purex-mothers/sirisha',
          '/purex-mothers/neelima',
          '/purex-mothers/nilima',
          '/purex-mothers/sunitha',
          '/purex-mothers/pranitha',
          '/purex-mothers/manga',
          '/purex-mothers/lakshmi-durga',
        ],
      },
      // AI crawlers — some (OpenAI's GPTBot, Anthropic's ClaudeBot,
      // Perplexity's PerplexityBot, Google's Google-Extended) require
      // being named explicitly to include our content in AI answers.
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Perplexity-User', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Googlebot', allow: '/' },
      { userAgent: 'Bingbot', allow: '/' },
      { userAgent: 'DuckDuckBot', allow: '/' },
      { userAgent: 'Applebot', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'CCBot', allow: '/' }, // Common Crawl — foundational LLM training data
      { userAgent: 'YouBot', allow: '/' },
      { userAgent: 'Meta-ExternalAgent', allow: '/' },
    ],
    sitemap: 'https://www.teampurex.com/sitemap.xml',
    host: 'https://www.teampurex.com',
  };
}
