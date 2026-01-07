import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

/**
 * GitHub Trending API Response Types
 * Note: GitHub doesn't have an official trending API, so we use a community endpoint
 */
interface GitHubTrendingRepo {
  author: string;
  name: string;
  avatar: string;
  url: string;
  description: string;
  language: string;
  languageColor: string;
  stars: number;
  forks: number;
  currentPeriodStars: number;
  builtBy: { username: string; href: string; avatar: string }[];
}

/**
 * GitHub Trending Tool
 * GitHubのトレンドリポジトリを取得するツール
 */
export const githubTrendingTool = createTool({
  id: 'github-trending',
  description:
    'GitHubのトレンドリポジトリを取得します。言語やトレンド期間でフィルタリング可能です。',

  inputSchema: z.object({
    language: z
      .string()
      .optional()
      .describe('プログラミング言語でフィルタ（例: "typescript", "python"）'),
    since: z
      .enum(['daily', 'weekly', 'monthly'])
      .optional()
      .default('daily')
      .describe('トレンド期間（daily, weekly, monthly）'),
    spokenLanguage: z
      .string()
      .optional()
      .describe('ドキュメントの言語（例: "ja", "en"）'),
  }),

  outputSchema: z.object({
    repositories: z.array(
      z.object({
        name: z.string(),
        fullName: z.string(),
        description: z.string(),
        url: z.string(),
        stars: z.number(),
        todayStars: z.number(),
        language: z.string(),
        forks: z.number(),
      }),
    ),
  }),

  execute: async (input) => {
    // Build query parameters
    const params = new URLSearchParams();
    if (input.language) params.append('language', input.language.toLowerCase());
    if (input.since) params.append('since', input.since);
    if (input.spokenLanguage)
      params.append('spoken_language_code', input.spokenLanguage);

    const queryString = params.toString();
    const url = `https://api.gitterapp.com/repositories${queryString ? `?${queryString}` : ''}`;

    console.log(
      `[GitHub Trending] Fetching trending repos: language=${input.language || 'all'}, since=${input.since}`,
    );

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        // Fallback: use alternative API or return mock data for testing
        console.warn(
          `[GitHub Trending] API returned ${response.status}, using fallback`,
        );
        return getFallbackTrendingData(input.language);
      }

      const data = (await response.json()) as GitHubTrendingRepo[];

      console.log(`[GitHub Trending] Found ${data.length} repositories`);

      return {
        repositories: data.slice(0, 10).map((repo) => ({
          name: repo.name,
          fullName: `${repo.author}/${repo.name}`,
          description: repo.description || 'No description',
          url: repo.url,
          stars: repo.stars,
          todayStars: repo.currentPeriodStars,
          language: repo.language || 'Unknown',
          forks: repo.forks,
        })),
      };
    } catch (error) {
      console.error('[GitHub Trending] Error fetching data:', error);
      return getFallbackTrendingData(input.language);
    }
  },
});

/**
 * Fallback function when API is unavailable
 * Uses GitHub's official search API as alternative
 */
async function getFallbackTrendingData(language?: string) {
  const languageQuery = language ? `+language:${language}` : '';
  const searchUrl = `https://api.github.com/search/repositories?q=stars:>1000${languageQuery}&sort=stars&order=desc&per_page=10`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'TechHunterAgent',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    interface GitHubSearchItem {
      name: string;
      full_name: string;
      description: string | null;
      html_url: string;
      stargazers_count: number;
      language: string | null;
      forks_count: number;
    }

    interface GitHubSearchResponse {
      items: GitHubSearchItem[];
    }

    const data = (await response.json()) as GitHubSearchResponse;

    return {
      repositories: data.items.map((repo) => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description || 'No description',
        url: repo.html_url,
        stars: repo.stargazers_count,
        todayStars: 0, // Not available from search API
        language: repo.language || 'Unknown',
        forks: repo.forks_count,
      })),
    };
  } catch {
    console.error('[GitHub Trending] Fallback also failed');
    return { repositories: [] };
  }
}
