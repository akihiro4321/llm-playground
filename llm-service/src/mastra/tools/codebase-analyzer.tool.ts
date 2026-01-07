import { createTool } from '@mastra/core/tools';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';

/**
 * Codebase Analyzer Tool
 * プロジェクトの依存関係と技術スタックを分析するツール
 */
export const codebaseAnalyzerTool = createTool({
  id: 'codebase-analyzer',
  description:
    'プロジェクトのpackage.jsonを分析し、使用技術と依存関係を抽出します',

  inputSchema: z.object({
    projectPath: z
      .string()
      .describe(
        '分析対象プロジェクトのルートパス（package.jsonがあるディレクトリ）',
      ),
  }),

  outputSchema: z.object({
    projectName: z.string(),
    techStack: z.array(z.string()),
    dependencies: z.array(
      z.object({
        name: z.string(),
        version: z.string(),
        type: z.enum(['production', 'dev']),
      }),
    ),
    scripts: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),

  execute: async (input) => {
    const packageJsonPath = path.join(input.projectPath, 'package.json');

    console.log(`[Codebase Analyzer] Analyzing: ${packageJsonPath}`);

    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at: ${packageJsonPath}`);
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    // Extract dependencies
    const dependencies = [
      ...Object.entries(packageJson.dependencies || {}).map(
        ([name, version]) => ({
          name,
          version: version as string,
          type: 'production' as const,
        }),
      ),
      ...Object.entries(packageJson.devDependencies || {}).map(
        ([name, version]) => ({
          name,
          version: version as string,
          type: 'dev' as const,
        }),
      ),
    ];

    // Detect tech stack from dependencies
    const techStack = detectTechStack(dependencies.map((d) => d.name));

    // Extract script names
    const scripts = Object.keys(packageJson.scripts || {});

    // Generate suggestions based on current stack
    const suggestions = generateSuggestions(
      dependencies.map((d) => d.name),
      techStack,
    );

    console.log(
      `[Codebase Analyzer] Found ${dependencies.length} dependencies, Tech stack: ${techStack.join(', ')}`,
    );

    return {
      projectName: packageJson.name || 'unknown',
      techStack,
      dependencies,
      scripts,
      suggestions,
    };
  },
});

/**
 * Detect tech stack from dependency names
 */
function detectTechStack(depNames: string[]): string[] {
  const techMap: Record<string, string[]> = {
    // Frameworks
    react: ['react', 'react-dom', 'next', 'gatsby', 'remix'],
    vue: ['vue', 'nuxt', 'vuex', 'pinia'],
    angular: ['@angular/core', '@angular/cli'],
    svelte: ['svelte', '@sveltejs/kit'],
    nestjs: ['@nestjs/core', '@nestjs/common'],
    express: ['express'],
    hono: ['hono'],
    fastify: ['fastify'],

    // Languages & Runtimes
    typescript: ['typescript', 'ts-node', 'tsx'],

    // AI/ML
    langchain: ['langchain', '@langchain/core', '@langchain/openai'],
    openai: ['openai', '@openai/api'],
    mastra: ['@mastra/core', '@mastra/memory'],

    // Databases
    postgresql: ['pg', 'postgres', '@prisma/client'],
    mongodb: ['mongodb', 'mongoose'],
    redis: ['redis', 'ioredis'],
    qdrant: ['@qdrant/js-client-rest'],

    // Testing
    jest: ['jest', '@jest/core'],
    vitest: ['vitest'],

    // Build Tools
    vite: ['vite'],
    webpack: ['webpack'],
    esbuild: ['esbuild'],
  };

  const detected: string[] = [];

  for (const [tech, packages] of Object.entries(techMap)) {
    if (packages.some((pkg) => depNames.includes(pkg))) {
      detected.push(tech);
    }
  }

  return detected;
}

/**
 * Generate improvement suggestions based on current dependencies
 */
function generateSuggestions(
  depNames: string[],
  techStack: string[],
): string[] {
  const suggestions: string[] = [];

  // TypeScript suggestion
  if (!depNames.includes('typescript') && !techStack.includes('typescript')) {
    suggestions.push(
      'TypeScriptの導入を検討してください。型安全性が向上します。',
    );
  }

  // Testing suggestion
  if (
    !techStack.includes('jest') &&
    !techStack.includes('vitest') &&
    !depNames.includes('mocha')
  ) {
    suggestions.push(
      'テストフレームワーク（Jest or Vitest）の導入を推奨します。',
    );
  }

  // Linting suggestion
  if (!depNames.includes('eslint') && !depNames.includes('biome')) {
    suggestions.push('ESLintまたはBiomeの導入でコード品質を向上できます。');
  }

  // AI suggestions for specific stacks
  if (techStack.includes('typescript') && !techStack.includes('mastra')) {
    suggestions.push(
      'Mastraフレームワークでエージェント開発を効率化できます。',
    );
  }

  return suggestions;
}
