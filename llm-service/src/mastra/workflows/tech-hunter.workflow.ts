import { createStep, createWorkflow } from '@mastra/core/workflows';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

/**
 * User Profile Schema
 */
const userProfileSchema = z.object({
  userId: z.string().default('default'),
  interests: z
    .array(z.string())
    .describe('興味のある技術トピック（例: TypeScript, Mastra, NestJS）'),
  projectPath: z
    .string()
    .optional()
    .describe('分析対象のプロジェクトパス（オプション）'),
  outputDir: z
    .string()
    .default('./reports')
    .describe('レポート出力先ディレクトリ'),
});

/**
 * Collected Info Schema
 */
const collectedInfoSchema = z.object({
  articles: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      snippet: z.string(),
      topic: z.string(),
    }),
  ),
  repositories: z.array(
    z.object({
      name: z.string(),
      fullName: z.string(),
      description: z.string(),
      url: z.string(),
      stars: z.number(),
      language: z.string(),
    }),
  ),
  projectInfo: z
    .object({
      projectName: z.string(),
      techStack: z.array(z.string()),
      suggestions: z.array(z.string()),
    })
    .optional(),
});

/**
 * Step 1: Collect Information
 * Web Search Agentを使って情報を収集
 */
const collectInfoStep = createStep({
  id: 'collect-info',
  description: 'Web検索とGitHubトレンドから情報を収集',
  inputSchema: userProfileSchema,
  outputSchema: collectedInfoSchema,
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const webSearchAgent = mastra?.getAgent('web-search-agent');
    if (!webSearchAgent) {
      throw new Error('Web Search Agent not found');
    }

    console.log(
      `[Tech Hunter] Collecting info for interests: ${inputData.interests.join(', ')}`,
    );

    // Collect articles and repos for each interest
    const allArticles: {
      title: string;
      url: string;
      snippet: string;
      topic: string;
    }[] = [];
    const allRepos: {
      name: string;
      fullName: string;
      description: string;
      url: string;
      stars: number;
      language: string;
    }[] = [];

    for (const interest of inputData.interests) {
      const prompt = `
「${interest}」に関する最新の技術情報を収集してください。
以下を含めてください：
1. 最新の技術記事（3〜5件）
2. 関連するGitHubトレンドリポジトリ（3〜5件）

以下のJSON形式で返してください:
{
  "articles": [
    { "title": "記事タイトル", "url": "https://...", "snippet": "概要" }
  ],
  "repositories": [
    { "name": "repo-name", "fullName": "owner/repo-name", "url": "https://github.com/...", "description": "説明", "stars": 1000, "language": "TypeScript" }
  ]
}
`;

      const response = await webSearchAgent.generate([
        { role: 'user', content: prompt },
      ]);

      // Parse the response with safe defaults
      try {
        const text = response.text;
        const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.articles && Array.isArray(parsed.articles)) {
            allArticles.push(
              ...parsed.articles.map(
                (a: { title?: string; url?: string; snippet?: string }) => ({
                  title: a.title || 'Untitled',
                  url: a.url || '',
                  snippet: a.snippet || '',
                  topic: interest,
                }),
              ),
            );
          }
          if (parsed.repositories && Array.isArray(parsed.repositories)) {
            allRepos.push(
              ...parsed.repositories.map(
                (r: {
                  name?: string;
                  fullName?: string;
                  full_name?: string;
                  url?: string;
                  html_url?: string;
                  description?: string;
                  stars?: number;
                  stargazers_count?: number;
                  language?: string;
                }) => ({
                  name: r.name || 'unknown',
                  fullName: r.fullName || r.full_name || r.name || 'unknown',
                  url: r.url || r.html_url || '',
                  description: r.description || 'No description',
                  stars: r.stars || r.stargazers_count || 0,
                  language: r.language || 'Unknown',
                }),
              ),
            );
          }
        }
      } catch (e) {
        console.warn(
          `[Tech Hunter] Failed to parse response for ${interest}:`,
          e,
        );
      }
    }

    // Analyze project if path provided
    let projectInfo:
      | {
          projectName: string;
          techStack: string[];
          suggestions: string[];
        }
      | undefined;

    if (inputData.projectPath) {
      try {
        const packageJsonPath = path.join(
          inputData.projectPath,
          'package.json',
        );
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, 'utf-8'),
          );
          const deps = Object.keys(packageJson.dependencies || {});
          const devDeps = Object.keys(packageJson.devDependencies || {});
          projectInfo = {
            projectName: packageJson.name || 'unknown',
            techStack: detectTechStack([...deps, ...devDeps]),
            suggestions: [],
          };
        }
      } catch (e) {
        console.warn('[Tech Hunter] Failed to analyze project:', e);
      }
    }

    return {
      articles: allArticles,
      repositories: allRepos,
      projectInfo,
    };
  },
});

/**
 * Step 2: Generate Report
 * Reporter Agentを使ってレポートを生成
 */
const generateReportStep = createStep({
  id: 'generate-report',
  description: 'パーソナライズされたレポートを生成',
  inputSchema: collectedInfoSchema,
  outputSchema: z.object({
    reportPath: z.string(),
    reportContent: z.string(),
  }),
  execute: async ({ inputData, mastra }) => {
    if (!inputData) {
      throw new Error('Input data not found');
    }

    const reporterAgent = mastra?.getAgent('reporter-agent');
    if (!reporterAgent) {
      throw new Error('Reporter Agent not found');
    }

    const collectedInfo = inputData;

    console.log('[Tech Hunter] Generating personalized report...');

    const prompt = `
以下の収集情報をもとに、パーソナライズされた技術レポートを生成してください。

## 収集した記事
${collectedInfo.articles.map((a) => `- [${a.title}](${a.url}) (${a.topic})`).join('\n')}

## 収集したリポジトリ
${collectedInfo.repositories.map((r) => `- [${r.fullName}](${r.url}) ⭐${r.stars} - ${r.description}`).join('\n')}

${collectedInfo.projectInfo ? `## プロジェクト情報\n- 名前: ${collectedInfo.projectInfo.projectName}\n- 技術スタック: ${collectedInfo.projectInfo.techStack.join(', ')}` : ''}

Markdown形式でレポートを生成してください。
`;

    const response = await reporterAgent.generate([
      { role: 'user', content: prompt },
    ]);

    const reportContent = response.text;

    // Save report to file
    const outputDir = './reports';
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `tech-hunter-report-${dateStr}.md`;
    const reportPath = path.join(outputDir, fileName);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, reportContent, 'utf-8');
    console.log(`[Tech Hunter] Report saved to: ${reportPath}`);

    return {
      reportPath,
      reportContent,
    };
  },
});

/**
 * Tech Hunter Workflow
 * collectInfoStep → generateReportStep の流れでレポート生成
 */
const techHunterWorkflow = createWorkflow({
  id: 'tech-hunter-workflow',
  inputSchema: userProfileSchema,
  outputSchema: z.object({
    reportPath: z.string(),
    reportContent: z.string(),
  }),
})
  .then(collectInfoStep)
  .then(generateReportStep);

techHunterWorkflow.commit();

export { techHunterWorkflow, userProfileSchema };

/**
 * Helper: Detect tech stack from dependency names
 */
function detectTechStack(depNames: string[]): string[] {
  const techMap: Record<string, string[]> = {
    react: ['react', 'react-dom', 'next'],
    vue: ['vue', 'nuxt'],
    typescript: ['typescript'],
    nestjs: ['@nestjs/core'],
    express: ['express'],
    hono: ['hono'],
    mastra: ['@mastra/core'],
    langchain: ['langchain', '@langchain/core'],
  };

  const detected: string[] = [];
  for (const [tech, packages] of Object.entries(techMap)) {
    if (packages.some((pkg) => depNames.includes(pkg))) {
      detected.push(tech);
    }
  }
  return detected;
}
