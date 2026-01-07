import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Article Scraper Tool
 * URLから記事コンテンツを抽出するツール
 *
 * Note: Tavily Extract APIを使用することで、
 * 複雑なHTML解析なしにクリーンなコンテンツを取得できます
 */
export const articleScraperTool = createTool({
  id: 'article-scraper',
  description:
    'URLから記事のタイトルと本文を抽出します。技術記事やブログの内容を取得するのに使用します。',

  inputSchema: z.object({
    urls: z.array(z.string().url()).describe('抽出対象のURL（最大5件）'),
  }),

  outputSchema: z.object({
    articles: z.array(
      z.object({
        url: z.string(),
        title: z.string(),
        content: z.string(),
        author: z.string().optional(),
        publishedAt: z.string().optional(),
        success: z.boolean(),
        error: z.string().optional(),
      }),
    ),
  }),

  execute: async (input) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TAVILY_API_KEY is not set. Please add it to your .env file.',
      );
    }

    // Limit to 5 URLs to avoid rate limiting
    const urls = input.urls.slice(0, 5);

    console.log(`[Article Scraper] Extracting ${urls.length} articles`);

    const response = await fetch('https://api.tavily.com/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        urls: urls,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Tavily Extract API error: ${response.status} - ${errorText}`,
      );
    }

    interface TavilyExtractResult {
      url: string;
      raw_content: string;
    }

    interface TavilyExtractResponse {
      results: TavilyExtractResult[];
      failed_results?: { url: string; error: string }[];
    }

    const data = (await response.json()) as TavilyExtractResponse;

    // Process successful results
    const articles = data.results.map((result) => {
      // Try to extract title from content (first line or heading)
      const titleMatch = result.raw_content.match(/^#\s*(.+)$/m);
      const title = titleMatch
        ? titleMatch[1]
        : extractTitleFromUrl(result.url);

      return {
        url: result.url,
        title: title,
        content: result.raw_content.slice(0, 2000), // Limit content length
        success: true,
      };
    });

    // Process failed results
    const failedArticles = (data.failed_results || []).map((failed) => ({
      url: failed.url,
      title: '',
      content: '',
      success: false,
      error: failed.error,
    }));

    console.log(
      `[Article Scraper] Successfully extracted ${articles.length} articles, ${failedArticles.length} failed`,
    );

    return {
      articles: [...articles, ...failedArticles],
    };
  },
});

/**
 * Extract a readable title from URL
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1] || '';

    // Remove file extensions and decode
    const title = decodeURIComponent(lastPart.replace(/\.[^/.]+$/, ''));

    // Convert hyphens/underscores to spaces and capitalize
    return title.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return 'Unknown Article';
  }
}
