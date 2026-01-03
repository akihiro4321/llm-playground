import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const salaryBenchmarkTool = createTool({
  id: 'salary-benchmark',
  description: '職種名から業界の給与相場を取得します',
  inputSchema: z.object({
    jobTitle: z.string().describe('職種名（例: フルスタックエンジニア）'),
  }),
  outputSchema: z.object({
    averageMin: z.number().describe('平均給与下限（万円）'),
    averageMax: z.number().describe('平均給与上限（万円）'),
    currency: z.string().describe('通貨単位'),
  }),
  execute: async (inputData) => {
    const { jobTitle } = inputData;

    // モックデータ：職種ごとの給与相場マップ
    const salaryData: Record<string, { min: number; max: number }> = {
      フルスタックエンジニア: { min: 600, max: 900 },
      フロントエンドエンジニア: { min: 500, max: 800 },
      バックエンドエンジニア: { min: 550, max: 850 },
      データサイエンティスト: { min: 700, max: 1200 },
      プロダクトマネージャー: { min: 650, max: 1000 },
      デザイナー: { min: 450, max: 750 },
      QAエンジニア: { min: 400, max: 700 },
    };

    // 職種名の正規化（小文字、スペース除去）
    const normalizedTitle = jobTitle.toLowerCase().replace(/\s+/g, '');

    // マッチする職種を探す（部分一致）
    let matchedSalary = null;
    for (const [key, value] of Object.entries(salaryData)) {
      if (normalizedTitle.includes(key.toLowerCase().replace(/\s+/g, ''))) {
        matchedSalary = value;
        break;
      }
    }

    // マッチしない場合はデフォルト値
    const salary = matchedSalary || { min: 400, max: 800 };

    console.log(
      `[Salary Benchmark] ${jobTitle} -> ${salary.min}-${salary.max}万円`,
    );

    return {
      averageMin: salary.min,
      averageMax: salary.max,
      currency: '万円',
    };
  },
});
