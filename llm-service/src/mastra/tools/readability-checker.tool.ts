import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const readabilityCheckerTool = createTool({
  id: 'readability-checker',
  description: '求人説明文の可読性を評価し、改善提案を返します',
  inputSchema: z.object({
    text: z.string().describe('分析対象のテキスト'),
  }),

  outputSchema: z.object({
    readabilityScore: z
      .number()
      .min(0)
      .max(100)
      .describe('可読性スコア（0-100）'),
    grade: z
      .enum(['excellent', 'good', 'fair', 'poor'])
      .describe('評価グレード'),
    metrics: z.object({
      wordCount: z.number().describe('単語数'),
      sentenceCount: z.number().describe('文の数'),
      averageWordsPerSentence: z.number().describe('1文あたりの平均単語数'),
      complexWords: z.number().describe('難しい単語の数'),
    }),
    issues: z.array(z.string()).describe('検出された問題点'),
    suggestions: z.array(z.string()).describe('改善提案'),
  }),
  execute: async (context) => {
    const { text } = context;

    const readabilityScore = 100;
    const grade: 'excellent' | 'good' | 'fair' | 'poor' = 'excellent';
    const metrics = {
      wordCount: 500,
      sentenceCount: 10,
      averageWordsPerSentence: 10,
      complexWords: 20,
    };
    const issues = ['問題点1', '問題点2'];
    const suggestions = ['提案1', '提案2'];

    return {
      readabilityScore,
      grade,
      metrics,
      issues,
      suggestions,
    };
  },
});
