import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * Tavily API Response Types
 */
interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

interface TavilySearchResponse {
  query: string;
  results: TavilySearchResult[];
  response_time: number;
}

/**
 * Web Search Tool using Tavily API
 * 技術記事やドキュメントを検索するためのツール
 */
export const webSearchTool = createTool({
  id: 'web-search',
  description:
    '指定されたクエリでWeb検索を行い、関連する技術記事やドキュメントを取得します',

  inputSchema: z.object({
    query: z.string().describe('検索クエリ'),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe('取得する結果の最大数（デフォルト: 5）'),
    searchDepth: z
      .enum(['basic', 'advanced'])
      .optional()
      .default('basic')
      .describe('検索の深さ（basic: 高速, advanced: 詳細）'),
    includeDomains: z
      .array(z.string())
      .optional()
      .describe('検索対象に含めるドメイン（例: ["zenn.dev", "qiita.com"]）'),
    excludeDomains: z
      .array(z.string())
      .optional()
      .describe('検索対象から除外するドメイン'),
  }),

  outputSchema: z.object({
    query: z.string(),
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string(),
        snippet: z.string(),
        score: z.number(),
        publishedAt: z.string().optional(),
      }),
    ),
    responseTime: z.number(),
  }),

  execute: async (input) => {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TAVILY_API_KEY is not set. Please add it to your .env file.',
      );
    }

    const requestBody = {
      query: input.query,
      max_results: input.maxResults ?? 5,
      search_depth: input.searchDepth ?? 'basic',
      include_domains: input.includeDomains,
      exclude_domains: input.excludeDomains,
      include_answer: false,
      include_raw_content: false,
    };

    console.log(`[Web Search] Searching for: "${input.query}"`);

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        ...requestBody,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
    }

    const data = (await response.json()) as TavilySearchResponse;

    console.log(`[Web Search] Found ${data.results.length} results`);

    return {
      query: data.query,
      results: data.results.map((result) => ({
        title: result.title,
        url: result.url,
        snippet: result.content,
        score: result.score,
        publishedAt: result.published_date,
      })),
      responseTime: data.response_time,
    };
  },
});
